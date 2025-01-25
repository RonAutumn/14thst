declare namespace NodeJS {
    interface ProcessEnv {
        NEXT_PUBLIC_SITE_PASSWORD: string;
        AIRTABLE_API_KEY: string;
        AIRTABLE_BASE_ID: string;
        AIRTABLE_DELIVERY_TABLE: string;
        AIRTABLE_PRODUCTS_TABLE: string;
        AIRTABLE_SHIPPING_ORDERS_TABLE: string;
        NEXT_PUBLIC_API_URL: string;
        PORT: string;
        RESEND_API_KEY: string;
        ADMIN_EMAIL: string;
        ADMIN_PASSWORD: string;
        NODE_ENV: 'development' | 'production' | 'test';
        STRIPE_SECRET_KEY: string;
        STRIPE_WEBHOOK_SECRET: string;
    }
} 