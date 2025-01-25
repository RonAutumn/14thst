*# **Application Flow Documentation (Improved)**

This document outlines the end-to-end workflow of the HeavenHighNYC Shop Platform from both the **customer** and **admin** perspectives. It also provides a high-level overview of how orders are processed and how rewards are tracked, ensuring that each step in the flow is clear, modular, and easy to maintain.

---

## **1. Overview**

The HeavenHighNYC Shop Platform comprises:
- A **Customer Portal**: Where users browse, order products, and participate in the rewards program.
- An **Admin Portal**: Where admins manage products, orders, shipping, delivery fees, and the rewards program.

Key integrations (current and planned) include:
- **Airtable** (current database; possibly migrating to a more scalable database in the future).
- **Phone-based Authentication** (Twilio or similar) for secure user login and rewards tracking.
- **ShipStation** (planned future integration) for shipping label generation and order management.
- **Payment Software** (future consideration): Currently, there is **no integrated payment software**. Orders may require payment on delivery, manual invoicing, or other offline/alternative methods.

---

## **2. Customer Flow**

The following steps describe how a typical customer interacts with the Bakery/Wellness Shop Platform:

1. **Access Website**
   - The customer visits the platform’s URL (which may be password-protected or invite-only, depending on the business model).
   - The homepage or shop page is displayed, showing featured products and available categories.

2. **Sign In / Sign Up (Optional but Recommended)**
   - If the customer is a returning user, they can sign in using:
     - **Phone Number + OTP** (via Twilio or similar).
     - Any other supported authentication method (email, social login, etc.).
   - If the customer is new, they can create an account:
     - Provide name, phone number, and/or email.
     - Confirm identity via OTP or email verification link.
   - Signing in allows the customer to track rewards points, view past orders, and save delivery addresses.

3. **Browse Products**
   - Customers can filter products by category (e.g., bakery, wellness, vegan, gluten-free).
   - Product detail pages provide descriptions, images, price, and availability status.

4. **Add to Cart**
   - Customers add items to their shopping cart.
   - The cart summary is updated in real time, showing subtotal, anticipated delivery fees (if known), and any applicable discounts or rewards.

5. **Rewards Program (Optional)**
   - If logged in, customers can view their current rewards balance.
   - If they have redeemable points, they can choose to apply them when completing the order (if the admin offers that option).
   - Points are accrued upon order confirmation but held for 14 days before becoming claimable (to allow for returns/cancellations).

6. **Checkout (Without Integrated Payment)**
   - Because there is currently **no integrated payment software**, the checkout process focuses on:
     - **Delivery/Shipping Details**:  
       - **Delivery Address** (local deliveries).  
       - **Shipping Address** (if items can be shipped).  
     - **Contact Information**: Phone or email for status updates.
     - **Delivery Fee**: Calculated based on zip code or borough (for local deliveries).  
       - **Shipping Fee**: Currently a flat rate or manually invoiced (no automated shipping cost calculations at this stage).
   - The order is then **placed** and stored in the database (Airtable), with payment to be handled offline or via a manual process (e.g., pay on delivery, bank transfer, manual invoicing).

7. **Order Confirmation**
   - The platform creates an entry in Airtable (or future DB) with the status `pending` or `awaiting payment`.
   - The customer sees an on-screen confirmation, and may receive an email or SMS with order details (configurable in the admin panel).
   - Rewards points (if any) are tracked and will be released after the 14-day hold period.

8. **Order Tracking**
   - For **Local Delivery**: The system updates the order status (pending → out for delivery → delivered).
   - For **Shipping**: In the future, tracking details will be available via ShipStation or other carrier solutions.  
     - Currently, shipping might rely on manual processes (e.g., admin emails tracking info once the product is shipped).

9. **Completion and Feedback**
   - Once delivered or shipped, customers can:
     - Rate their experience.
     - Report issues or request refunds/returns (if applicable).
   - Positive ratings increase the “Customer Satisfaction Score”.

---

## **3. Admin Flow**

Below is the typical sequence of actions an admin might perform to keep the platform running smoothly:

1. **Admin Login**
   - Admins access the **Admin Portal** (separate URL or route).
   - Secure login (username/password, 2FA, or SSO) ensures only authorized staff can manage data.

2. **Dashboard Overview**
   - The admin sees real-time metrics:
     - Daily/weekly sales.
     - Orders in various statuses (pending, awaiting payment, delivered, etc.).
     - Current rewards engagement.
     - Potential inventory alerts (if integrated).

3. **Manage Products**
   - **Create/Update** product listings (name, description, images, price).
   - **Enable/Disable** stock availability or set inventory thresholds.
   - Category organization for better product discovery.

4. **Manage Orders**
   - **View All Orders**: Filter by status, date, or order type (delivery/shipping).
   - **Order Detail**: Check items, payment arrangement (e.g., pay on delivery), and customer notes.
   - **Update Order Status**: Mark order as “awaiting payment,” “paid,” “processing,” “delivered,” etc.
   - **Future ShipStation Integration**: Once integrated, admins will be able to generate shipping labels or packing slips for shipping orders directly within the admin portal.
   - **Delivery Fee Adjustments**: If the admin notices an incorrect fee, they can override or adjust it on the fly.

5. **Manage Delivery Fees**
   - **Configure** zip code- or borough-based fees (e.g., Manhattan = $5, Brooklyn = $7, etc.).
   - **Promotions**: Offer free delivery if order exceeds a certain amount.
   - **Scheduled Delivery Setup**: Admin can define time windows or blackout dates.

6. **Manage Rewards Program**
   - **Set Points Policy**: Points per dollar spent, hold duration (14 days), redemption rules.
   - **Approve/Adjust Points**: If customers have issues, admins can manually credit or remove points.
   - **Monitor Engagement**: View top customers, total points redeemed, etc.

7. **Reporting & Analytics**
   - **Sales Reports**: Exportable data on daily, weekly, monthly sales.
   - **Customer Insights**: Repeat customer rate, average order value, popular products.
   - **Error Logs**: Track system errors or order failures to maintain reliability.

8. **System Settings**
   - **Environment Variables**: Manage API keys (for Twilio, Airtable, future ShipStation, etc.).
   - **User Management**: Create new admin accounts or revoke access as needed.
   - **Logging & Error Handling**: Centralized logs for all admin actions and system events.

---

## **4. End-to-End Order Processing Flow**

Below is a more detailed breakdown of how an order moves through the system without integrated payment software:

1. **Customer Places Order**
   - Order is created in Airtable (or a future DB) with status `pending` or `awaiting payment`.

2. **Backend Fetches the Order**
   - An API endpoint (`POST /orders`) receives the order details.
   - Validates data (items, address, any manual payment arrangement).

3. **Fee Calculation**
   - **Delivery**: Looks up fee by borough or zip code.
   - **Shipping**: Currently uses a flat rate or admin-set rate.  
     - **Future**: Will integrate ShipStation or another carrier to calculate rates automatically.

4. **Order Status Updates**
   - **Awaiting Payment**: Because there’s no direct online payment, the order remains in this status until the customer pays (e.g., upon delivery or via offline invoice).
   - **Processing**: Once payment is verified by the admin or another process.
   - **Out for Delivery**: For local deliveries.
   - **Shipped**: If items are sent via a shipping service.
   - **Delivered** or **Completed** once the product arrives.

5. **Rewards Accrual**
   - Points are recorded but held for 14 days to account for cancellations or returns.
   - After 14 days, points become fully claimable, updating the customer’s rewards balance.

6. **Exception Handling**
   - **API Errors**: Retry or log if data can’t be updated in Airtable.
   - **Database Conflicts**: Roll back partial writes if transactions fail.
   - **Payment Issues**: Since payment is offline, the system could flag the order if payment isn’t confirmed within a certain timeframe.

---

## **5. Diagram (Optional Visual Overview)**

```mermaid
flowchart TD
    A[Customer Visits Site] --> B[Logs In or Continues As Guest]
    B --> C[Browses Products & Adds to Cart]
    C --> D[Proceeds to Checkout (No Integrated Payment)]
    D --> E[Applies Rewards / Points (If Any)]
    E --> F[Places Order]
    F --> G[Order Stored in DB (Airtable) - Status: Awaiting Payment]
    G --> H[Admin Portal Monitors Incoming Orders]
    H --> I[Admin Confirms Payment (Offline/On Delivery)]
    I --> J[Updates Order to Processing/Out for Delivery/Shipped]
    J --> K[Customer Receives Order]
    K --> L[Rewards Points Finalized After Hold Period]
    L --> M[Feedback & Rating]

```

## **6. Technical Implementation Notes**

### Authentication Flow
```typescript
interface AuthFlow {
  phoneAuth: {
    provider: 'twilio';
    verificationMethod: 'sms' | 'voice';
    retryLimit: number;
  };
  session: {
    duration: string; // e.g., '7d'
    refreshToken: boolean;
  };
}
```

### Database Schema (Airtable)
```typescript
interface Order {
  id: string;
  status: 'pending' | 'awaiting_payment' | 'processing' | 'delivered';
  customer: Customer;
  items: OrderItem[];
  delivery: DeliveryDetails;
  rewards: RewardsInfo;
}

interface DeliveryDetails {
  address: string;
  zipCode: string;
  borough?: string;
  fee: number;
  instructions?: string;
}
```
