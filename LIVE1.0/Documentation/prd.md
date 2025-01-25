# **Product Requirements Document (PRD)**

**Project Name:** HeavenHighNYC Shop Platform  
**Last Updated:** [Insert Date]

---

## 1. Introduction

**Purpose:**  
This document outlines the requirements for restructuring and enhancing the Bakery/Wellness Shop Platform to improve scalability, deployability, and user experience. The project will also implement robust admin features, a refined rewards program, integrations for shipping and delivery management, and a more detailed approach to order processing and error handling.

**Audience:**  
Developers, product managers, and stakeholders involved in the bakery/wellness shop platform.

---

## 2. Project Summary

**Overview:**  
The Bakery/Wellness Shop Platform is a password-protected website offering delivery and shipping for wellness and bakery products. It includes:

- A **Shop Page** for browsing and purchasing products.  
- An **Admin Panel** for product management, order tracking, and delivery fee settings.  
- A **Rewards Program** for customer retention.  
- Backend integrated with Airtable as the current database.

**Goals and Objectives:**  
- Restructure the project for better modularity and deployment.  
- Implement shipping station integration for streamlined shipping.  
- Introduce zip code- or borough-specific delivery fees.  
- Enhance admin features for better control over rewards, delivery, and shipping.  
- Create a seamless user experience for rewards and delivery tracking.  
- Strengthen order processing flows, error handling, and data validation.

---

## 3. User Information

**Target Audience:**

- **Customers:** Individuals purchasing bakery and wellness products online.  
- **Admins:** Shop managers managing products, orders, rewards, and delivery settings.

**User Needs:**

- **Customers:**  
  - Easy browsing, purchasing, and checkout processes.  
  - Rewards program participation for accumulating points.  
  - Transparent delivery fees based on zip codes or boroughs.

- **Admins:**  
  - Intuitive management of products, orders, and rewards.  
  - Seamless printing of shipping orders through ShipStation or similar platform.  
  - Control over delivery fees and rewards program policies.  
  - Clear order processing pipeline with minimal errors.

---

## 4. Features

### 4.1 Current Features
- Password-protected access.  
- Shop page with product listings.  
- Airtable integration for database management.  
- Admin features for product creation and delivery fee settings.  
- Delivery and shipping options for customers.

### 4.2 Planned Enhancements

1. **Delivery System Improvements:**
   - **ShipStation Integration**: Admins can print shipping labels/orders directly.  
   - **Zip Code- or Borough-Based Delivery Fees**: Controlled by the admin, ensuring flexible pricing strategies.  
   - **Scheduled Deliveries**: Users can specify desired delivery dates and times.

2. **Admin Portal Enhancements:**
   - **Rewards Program Control Panel**: Admins can configure point accumulation rates, redemption rules, and hold durations.  
   - **Dashboard** to manage delivery fees, shipping, and rewards.  
   - **Deeper Integration with ShipStation** for order management.

3. **Rewards Program:**
   - **Phone Number Authentication** (e.g., SMS-based OTP via Twilio) for sign-ups.  
   - **Points Holding Period** (14 days) before points become claimable.  
   - **Admin Portal Integration** for tracking and adjustments.

4. **UI and Structural Enhancements:**
   - **Project Restructuring** using a modular architecture (inspired by ShadCN).  
   - **Responsive and Improved Design** for both admin and customer portals.  
   - **Separation of Concerns** for admin, customer, and backend services.

---

### 4.3 Enhanced Order Processing System

**Order Flow**

1. **Order Creation**  
   - Customer places an order through the frontend.  
   - Order details are stored in Airtable’s `Orders` table (or a future database).  
   - **Required Fields** (example structure):
     ```json
     {
       "Order ID": "unique_id",
       "Customer Name": "string",
       "Total": 123.45,
       "Address": "string",
       "Timestamp": "ISO_date",
       "Items": "string",
       "Type": "delivery|shipping",
       "Payment Method": "string"
     }
     ```

2. **Order Processing**  
   - Backend fetches orders via Airtable (or new DB) API.  
   - Orders processed based on **type**:
     - **Delivery**: Local delivery with fees based on zip code or borough.  
     - **Shipping**: Flat rate or calculated shipping through integrated carrier solutions (ShipStation).

3. **Status Updates**  
   - Status can be updated via an API call:
     ```js
     await base('Orders').update(orderId, {
       'Status': 'new_status'
     });
     ```
   - Supported statuses: `pending`, `processing`, `shipped`, `delivered`, `cancelled`, etc.

---

### 4.4 Delivery Fees

- Delivery fees can be **zip code-specific** or **borough-specific**, configured by the admin.  
- Example borough-based fee structure:
  ```js
  const deliveryFees = {
    'Manhattan': 5.00,
    'Brooklyn': 7.00,
    'Queens': 8.00,
    'Bronx': 9.00,
    'Staten Island': 10.00
  };

Admin panel allows for overrides or special promotions (e.g., free delivery above a certain order total).
4.5 Error Handling
A robust error handling framework is crucial for reliability:

API Errors: Implement retry mechanisms with exponential backoff.
Validation Errors: Provide detailed error messages for invalid inputs.
Database Errors: Automatic rollback for failed transactions to maintain data integrity.
Logging: Centralized logging for error tracking and analytics.
5. Technical Requirements
5.1 Frontend
Framework: React.js (or similar modern framework).
Design System: Based on ShadCN principles and component architecture.
Responsive, Mobile-First: Optimized for all devices.
5.2 Backend
Framework: Node.js (Express/Nest) or Python (FastAPI/Django).
Database:
Currently Airtable.
Potential migration to PostgreSQL or Firebase if scalability requires.
API: RESTful or GraphQL for communication between frontend and backend.
Hosting: AWS, Vercel, or a suitable cloud provider.
CI/CD: Automated pipelines for testing, linting, and deployment.
5.3 Integrations
ShipStation API for shipping management (printing labels, tracking).
Phone Number-Based Authentication (e.g., Twilio) for rewards and user sign-in.
5.4 API Endpoints (Enhanced)
Endpoint	Method	Description
/orders	GET	Fetch all orders
/orders/{id}	GET	Fetch a specific order
/orders	POST	Create a new order
/orders/{id}	PUT	Update order status
/delivery-fees	GET	Fetch delivery fee structures
/delivery-fees	POST	Update/set new delivery fees
5.5 Data Validation
All API requests should be validated against schemas or interfaces:

ts
Copy code
interface Order {
  id: string;
  customerName: string;
  total: number;
  items: string[];
  status: 'pending' | 'processing' | 'completed' | 'cancelled' | 'shipped';
  address: string;
  type: 'delivery' | 'shipping';
  paymentMethod: string;
}
6. Metrics and KPIs
6.1 Delivery System Metrics
Order Fulfillment Time: Reduce by 20%.
Real-Time Order Updates: 95% success rate.
6.2 Admin Efficiency Metrics
Time to Manage Delivery Fees: Reduced by 30%.
Rewards Program Engagement: Increased by 25%.
6.3 Customer Experience Metrics
Bounce Rate: Reduced by 20%.
Customer Satisfaction Score: Improved to 90%+.
6.4 Order Processing Metrics (Enhanced)
Order Processing Time: < 5 minutes for 95% of orders.
Error Rate: < 1% of total orders.
System Uptime: 99.9% availability.
6.5 Customer Satisfaction Metrics (Enhanced)
Order Accuracy: 99% accuracy rate.
Delivery Time: < 60 minutes for 90% of local deliveries.
Support Response Time: < 15 minutes.
7. Stakeholders and Roles
Key Stakeholders:

Business Owner: Defines vision and goals.
Developers: Implement features, manage code, testing, and deployments.
Admin Team: Manages daily operations—orders, shipping, rewards.
Project Managers: Oversee timelines and feature rollouts.
Responsibilities:

Developers: Code development, testing, and deployment pipelines.
Admins: Manage products, shipping, and rewards programs.
Project Managers: Ensure milestones are met, coordinate cross-functional teams.
8. Roadmap
8.1 Proposed Project Tree Structure (Using ShadCN)
bash
Copy code
/project-root
├── /apps
│   ├── /admin            # Admin-specific application
│   │   ├── /components   # Reusable UI components
│   │   ├── /pages        # Admin pages
│   │   ├── /styles       # Admin styles
│   │   └── index.tsx     # Admin entry point
│   ├── /customer         # Customer-specific application
│   │   ├── /components   # Reusable UI components
│   │   ├── /pages        # Customer pages
│   │   ├── /styles       # Customer styles
│   │   └── index.tsx     # Customer entry point
├── /packages
│   ├── /ui               # Shared ShadCN UI components
│   ├── /config           # Shared configurations (e.g., Tailwind, ESLint)
│   ├── /utils            # Shared utility functions
│   └── /types            # Shared type definitions
├── /backend
│   ├── /routes           # API route definitions
│   ├── /controllers      # Business logic
│   ├── /models           # Database models or schemas
│   ├── /middleware       # Middleware functions
│   ├── /services         # External integrations (e.g., ShipStation)
│   └── app.ts            # Backend entry point
├── package.json          # Dependency manager
├── .env                  # Environment variables
└── README.md             # Project documentation
8.2 Phase 1: Core System
Restructure project tree and modularize admin, customer, and backend layers using ShadCN.
Implement order processing pipeline with Airtable integration.
Develop basic admin interface.
8.3 Phase 2: Advanced Features
Integrate ShipStation API for shipping.
Implement Zip Code/Borough Delivery Fees with admin control.
Enhance order tracking with real-time status updates.
Introduce Rewards Program (phone-based authentication, points holding, redemption).
8.4 Phase 3: Optimization
Performance Tuning for both frontend and backend.
Error Handling Improvements with centralized logging and retry mechanisms.
Automated Testing for continuous integration and delivery.
Launch Revamped Customer Portal with responsive UI.
8.5 Phase 4: Monitoring and Feedback
Monitor performance and user feedback.
Optimize workflows based on KPIs (delivery fees, shipping times, reward usage).
Refine platform for scalability and user satisfaction.
Conclusion
This combined PRD details the functional, technical, and strategic roadmap for the Bakery/Wellness Shop Platform. By restructuring the codebase, enhancing admin capabilities (including delivery fee control and ShipStation integration), and improving the rewards program with robust error handling and data validation, the platform aims to deliver a superior experience for both customers and admins.

Next Steps:

Validate project milestones with stakeholders.
Assign development tasks and finalize technology choices.
Set up CI/CD pipelines and begin incremental feature deployment.