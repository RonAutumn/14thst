import { createEnv } from "@t3-oss/env-nextjs";
import { z } from "zod";

export const env = createEnv({
    server: {
        AIRTABLE_API_KEY: z.string(),
        AIRTABLE_BASE_ID: z.string(),
        AIRTABLE_DELIVERY_TABLE: z.string(),
        AIRTABLE_PRODUCTS_TABLE: z.string(),
        AIRTABLE_SHIPPING_ORDERS_TABLE: z.string(),
        SHIPSTATION_API_KEY: z.string(),
        SHIPSTATION_API_SECRET: z.string(),
    },
    client: {
        NEXT_PUBLIC_API_URL: z.string().url(),
        NEXT_PUBLIC_SITE_PASSWORD: z.string(),
    },
    runtimeEnv: {
        AIRTABLE_API_KEY: process.env.AIRTABLE_API_KEY,
        AIRTABLE_BASE_ID: process.env.AIRTABLE_BASE_ID,
        AIRTABLE_DELIVERY_TABLE: process.env.AIRTABLE_DELIVERY_TABLE,
        AIRTABLE_PRODUCTS_TABLE: process.env.AIRTABLE_PRODUCTS_TABLE,
        AIRTABLE_SHIPPING_ORDERS_TABLE: process.env.AIRTABLE_SHIPPING_ORDERS_TABLE,
        SHIPSTATION_API_KEY: process.env.SHIPSTATION_API_KEY,
        SHIPSTATION_API_SECRET: process.env.SHIPSTATION_API_SECRET,
        NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
        NEXT_PUBLIC_SITE_PASSWORD: process.env.NEXT_PUBLIC_SITE_PASSWORD,
    },
}); 