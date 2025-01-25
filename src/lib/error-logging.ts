import { base } from './airtable';

const ERROR_LOG_TABLE = 'Error Logs';

export async function logOrderError(error: Error, context: any) {
  try {
    await base(ERROR_LOG_TABLE).create([
      {
        fields: {
          'Error Type': error.name,
          'Message': error.message,
          'Stack Trace': error.stack,
          'Context': JSON.stringify(context, null, 2),
          'Timestamp': new Date().toISOString()
        }
      }
    ]);
  } catch (loggingError) {
    console.error('Failed to log error to Airtable:', loggingError);
    console.error('Original error:', error);
    console.error('Error context:', context);
  }
} 