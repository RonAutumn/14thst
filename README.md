# 14thst.com E-commerce Platform

A modern e-commerce platform built with Next.js 14, featuring delivery and shipping order management.

## Features

- 🛍️ Product management with Airtable integration
- 🚚 Delivery order management
- 📦 Shipping integration with ShipStation
- 📊 Admin dashboard with real-time analytics
- 🔒 Secure authentication
- 📱 Responsive design
- 🌐 Google Places API integration for address validation
- 💳 Secure payment processing

## Tech Stack

- Next.js 14
- TypeScript
- Tailwind CSS
- Airtable (Database)
- ShipStation API
- Resend (Email)
- Google Places API

## Getting Started

1. Clone the repository:
```bash
git clone https://github.com/yourusername/14thst.git
cd 14thst
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file in the root directory with the following variables:
```env
PORT=3000
NEXT_PUBLIC_SITE_PASSWORD=your_password
AIRTABLE_API_KEY=your_airtable_key
AIRTABLE_BASE_ID=your_base_id
NEXT_PUBLIC_API_URL=https://14thst.com/api
RESEND_API_KEY=your_resend_key
ADMIN_EMAIL=your_email
ADMIN_PASSWORD=your_admin_password
SHIPSTATION_API_KEY=your_shipstation_key
SHIPSTATION_API_SECRET=your_shipstation_secret
NEXT_PUBLIC_GOOGLE_PLACES_API_KEY=your_google_api_key
```

4. Run the development server:
```bash
npm run dev
```

5. Build for production:
```bash
npm run build
```

## Environment Setup

Make sure to set up the following services:
- Airtable account and base
- ShipStation account
- Resend account for email services
- Google Cloud Console account for Places API

## Deployment

The application is configured for deployment on Vercel or similar platforms.

## License

This project is private and proprietary. All rights reserved.
