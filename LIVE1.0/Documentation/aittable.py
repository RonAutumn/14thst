import json
from pyairtable import Api
import os
from datetime import datetime
import logging
from time import sleep
from dotenv import load_dotenv
import requests
from concurrent.futures import ThreadPoolExecutor
from tqdm import tqdm

# Set up logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('airtable_sync.log'),
        logging.StreamHandler()
    ]
)

# Load environment variables
load_dotenv()

# Airtable credentials
AIRTABLE_API_KEY = os.getenv('AIRTABLE_API_KEY')
BASE_ID = os.getenv('AIRTABLE_BASE_ID', 'applgr65s82aAWI6t')
OUTPUT_DIR = 'airtable_data'

# Known table names and their expected fields
KNOWN_TABLES = {
    'Pickup Orders': ['Order ID', 'Customer Name', 'Phone', 'Items', 'Total', 'Payment Method', 'Email', 'Status', 'Pickup Date'],
    'Order Details': ['Order ID', 'Items', 'Status'],
    'Products': ['Name', 'Price', 'Category', 'Description'],
    'Category': ['Name', 'Description'],
    'Settings': ['Key', 'Value'],
    'Shipping Orders': ['Order ID', 'Status'],
    'Delivery Orders': ['Order ID', 'Status'],
    'Fee Management': ['Name', 'Amount']
}

if not AIRTABLE_API_KEY:
    raise ValueError("AIRTABLE_API_KEY not found in environment variables")

def setup_output_directory():
    """Create output directory if it doesn't exist"""
    if not os.path.exists(OUTPUT_DIR):
        os.makedirs(OUTPUT_DIR)
        os.makedirs(os.path.join(OUTPUT_DIR, 'attachments'))

def get_all_tables():
    """
    Get a list of all tables in the base with enhanced error handling
    """
    try:
        headers = {
            'Authorization': f'Bearer {AIRTABLE_API_KEY}',
            'Content-Type': 'application/json'
        }
        base_url = f"https://api.airtable.com/v0/meta/bases/{BASE_ID}/tables"
        
        response = requests.get(base_url, headers=headers)
        response.raise_for_status()
        
        tables = response.json().get('tables', [])
        table_info = [{
            'name': table['name'],
            'id': table['id'],
            'fields': [field['name'] for field in table.get('fields', [])]
        } for table in tables]
        
        # Log discovered tables
        table_names = [info['name'] for info in table_info]
        logging.info(f"Discovered tables: {', '.join(table_names)}")
        
        # Check for known tables that weren't found
        missing_tables = set(KNOWN_TABLES.keys()) - set(table_names)
        if missing_tables:
            logging.warning(f"Some known tables were not found: {', '.join(missing_tables)}")
        
        return table_info
    except requests.exceptions.RequestException as e:
        logging.error(f"Error fetching tables: {str(e)}")
        return []

def download_attachment(url, filename, folder):
    """Download attachment files with retry logic"""
    max_retries = 3
    for attempt in range(max_retries):
        try:
            response = requests.get(url, stream=True)
            response.raise_for_status()
            
            filepath = os.path.join(folder, filename)
            with open(filepath, 'wb') as f:
                for chunk in response.iter_content(chunk_size=8192):
                    if chunk:
                        f.write(chunk)
            return filepath
        except Exception as e:
            if attempt == max_retries - 1:
                logging.error(f"Failed to download attachment {filename}: {str(e)}")
                return None
            sleep(2 ** attempt)

def process_record_value(value, record_id, field_name):
    """Process different types of field values with enhanced handling"""
    # Handle None/empty values
    if value is None:
        return ''
    
    # Handle status fields
    if field_name.lower() == 'status':
        return str(value).lower()
    
    # Handle date fields
    if any(date_field in field_name.lower() for date_field in ['date', 'time', 'created', 'modified']):
        if isinstance(value, str):
            # Try to parse and format date consistently
            try:
                parsed_date = datetime.fromisoformat(value.replace('Z', '+00:00'))
                return parsed_date.strftime('%Y-%m-%d %H:%M:%S')
            except ValueError:
                pass
    
    # Handle numeric fields
    if isinstance(value, (int, float)):
        return str(value)
    
    # Handle attachments
    if isinstance(value, list) and value and isinstance(value[0], dict):
        if 'url' in value[0]:
            attachment_dir = os.path.join(OUTPUT_DIR, 'attachments', record_id)
            os.makedirs(attachment_dir, exist_ok=True)
            
            processed_attachments = []
            for attachment in value:
                filename = attachment.get('filename', 'unknown')
                filepath = download_attachment(attachment['url'], filename, attachment_dir)
                if filepath:
                    processed_attachments.append({
                        'filename': filename,
                        'local_path': filepath,
                        'original_url': attachment['url']
                    })
            return processed_attachments
    
    # Handle arrays and objects
    if isinstance(value, (list, dict)):
        return json.dumps(value, ensure_ascii=False)
    
    return str(value)

def fetch_data_from_table(table_info, max_retries=3):
    """
    Fetch ALL data and fields from any Airtable table with enhanced processing
    """
    api = Api(AIRTABLE_API_KEY)
    table = api.table(BASE_ID, table_info['name'])
    
    for attempt in range(max_retries):
        try:
            records = table.all()
            if not records:
                logging.warning(f"No records found in table '{table_info['name']}'")
                return []
            
            logging.info(f"Processing {len(records)} records from {table_info['name']}")
            
            processed_records = []
            for record in tqdm(records, desc=f"Processing {table_info['name']}"):
                processed_record = {
                    'Record ID': record['id'],
                    'Created Time': record.get('createdTime', ''),
                }
                
                # Process each field value
                for field, value in record['fields'].items():
                    processed_value = process_record_value(value, record['id'], field)
                    processed_record[field] = processed_value
                
                # Check for missing required fields based on known table structure
                if table_info['name'] in KNOWN_TABLES:
                    for expected_field in KNOWN_TABLES[table_info['name']]:
                        if expected_field not in processed_record:
                            processed_record[expected_field] = ''
                
                processed_records.append(processed_record)
            
            # Sort records by timestamp if available
            if processed_records:
                processed_records.sort(key=lambda x: x.get('Created Time', ''), reverse=True)
            
            return processed_records
            
        except Exception as e:
            if attempt < max_retries - 1:
                wait_time = (attempt + 1) * 2
                logging.warning(f"Attempt {attempt + 1} failed for table '{table_info['name']}': {str(e)}. Retrying in {wait_time} seconds...")
                sleep(wait_time)
            else:
                logging.error(f"Failed to fetch data from table '{table_info['name']}' after {max_retries} attempts: {str(e)}")
                return []

def save_data_to_markdown(table_name, data):
    """Save data to markdown with improved formatting"""
    try:
        filename = os.path.join(OUTPUT_DIR, f"{table_name.lower().replace(' ', '_')}.md")
        
        with open(filename, 'w', encoding='utf-8') as f:
            # Write header
            f.write(f"# {table_name}\n\n")
            timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
            f.write(f"Generated on: {timestamp}\n")
            f.write(f"Total Records: {len(data)}\n\n")
            
            if not data:
                f.write("No data available for this table.\n")
                return
            
            # Get all unique fields
            fields = sorted(list(set(field for record in data for field in record.keys())))
            
            # Write table header
            f.write("| " + " | ".join(fields) + " |\n")
            f.write("| " + " | ".join(["---" for _ in fields]) + " |\n")
            
            # Write records
            for record in data:
                row = []
                for field in fields:
                    value = record.get(field, '')
                    
                    # Format value based on type
                    if isinstance(value, (list, dict)):
                        if isinstance(value, list) and value and isinstance(value[0], dict) and 'local_path' in value[0]:
                            # Handle attachments
                            value = '<br>'.join([f"[{att['filename']}]({att['local_path']})" for att in value])
                        else:
                            value = json.dumps(value, ensure_ascii=False)
                    elif value is None:
                        value = ''
                    
                    # Escape and truncate
                    value = str(value).replace('|', '\\|').replace('\n', '<br>')
                    if len(value) > 100:
                        value = value[:97] + "..."
                    row.append(value)
                
                f.write("| " + " | ".join(row) + " |\n")
            
        logging.info(f"Data saved to {filename}")
        
    except Exception as e:
        logging.error(f"Error saving markdown for table '{table_name}': {str(e)}")

def create_summary_documentation(all_data):
    """Create a summary markdown file with statistics and field information"""
    timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    filename = os.path.join(OUTPUT_DIR, 'summary.md')
    
    with open(filename, 'w', encoding='utf-8') as f:
        f.write(f"# Airtable Database Summary\n\n")
        f.write(f"Generated on: {timestamp}\n\n")
        
        # Overall statistics
        total_records = sum(len(data) for data in all_data.values())
        f.write(f"## Overview\n")
        f.write(f"- Total Tables: {len(all_data)}\n")
        f.write(f"- Total Records: {total_records}\n\n")
        
        # Table-specific information
        f.write("## Table Details\n\n")
        for table_name, data in all_data.items():
            f.write(f"### {table_name}\n")
            f.write(f"- Records: {len(data)}\n")
            
            if data:
                # Field analysis
                fields = set()
                field_types = {}
                for record in data:
                    for field, value in record.items():
                        fields.add(field)
                        if value:
                            field_types[field] = type(value).__name__
                
                f.write("#### Fields:\n")
                for field in sorted(fields):
                    f.write(f"- {field} ({field_types.get(field, 'unknown')})\n")
            
            f.write("\n")

def main():
    """Main execution function"""
    setup_output_directory()
    
    # Fetch table information
    tables = get_all_tables()
    if not tables:
        logging.error("No tables found or couldn't fetch table information")
        return
    
    all_table_data = {}
    
    # Process each table
    for table_info in tables:
        table_name = table_info['name']
        logging.info(f"\nProcessing table: {table_name}")
        
        data = fetch_data_from_table(table_info)
        if data:
            all_table_data[table_name] = data
            save_data_to_markdown(table_name, data)
        else:
            logging.warning(f"No data retrieved for table: {table_name}")
            all_table_data[table_name] = []
    
    # Create summary documentation
    create_summary_documentation(all_table_data)
    logging.info("\nData extraction completed successfully!")

if __name__ == "__main__":
    main()
