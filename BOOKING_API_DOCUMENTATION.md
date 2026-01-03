# Booking API Endpoints Documentation

## Overview

This document provides a comprehensive overview of the booking system with Paystack payment integration and wallet management.

---

## Complete Booking Flow - For Frontend Developers

### 🎯 User Journey (Guest/Customer)

**1. Browse & Select Property**

- User browses properties on the platform
- Clicks "Book Now" on a property

**2. Create Booking**

- **Endpoint:** `POST /bookings`
- **Auth:** Required (JWT token)
- User fills booking form:
  - Guest details (name, email, phone)
  - Check-in/out dates
  - Number of guests
  - Special requests
- System automatically:
  - Assigns `booked_by_id` from authenticated user
  - Calculates `total_amount` from property price × nights
  - Generates unique `payment_reference`
  - Sets status to `pending`

**3. View Booking Details**

- **Endpoint:** `GET /bookings/{booking_id}`
- User sees booking summary with "Pay Now" button

**4. Initialize Payment**

- **Endpoint:** `POST /bookings/initialize-payment`
- User clicks "Pay Now"
- System generates Paystack checkout URL
- User redirected to Paystack payment page

**5. Complete Payment on Paystack**

- User enters card details on Paystack
- Completes payment
- Paystack redirects back to app

**6. Payment Verification**

- **Endpoint:** `POST /bookings/verify-payment`
- App automatically verifies payment
- System:
  - Confirms payment with Paystack
  - Marks booking as `paid`
  - Funds agent wallet
  - Sends confirmation email to user
  - Sends payment notification to agent

**7. View My Bookings**

- **Endpoint:** `GET /bookings`
- User sees all their bookings (pending, paid, confirmed, cancelled)
- Can filter by status
- Pagination support

**8. View My Transactions**

- **Endpoint:** `GET /bookings/users/{user_id}/transactions`
- User sees all their booking payments
- Shows: amount paid, booking reference, date, status

**9. Cancel Booking (if needed)**

- **Endpoint:** `POST /bookings/{booking_id}/cancel`
- User can cancel booking
- System:
  - Checks cancellation policy
  - Processes refund (if applicable)
  - Sends cancellation email
  - Updates booking status to `cancelled`

---

### 🏢 Agent Journey (Property Owner)

**1. Receive Booking Notification**

- Agent receives email when new booking created
- Email contains guest details and booking info

**2. View All Property Bookings**

- **Endpoint:** `GET /bookings/agent/{agent_id}/bookings`
- **Auth:** Required (agent or admin)
- Agent sees all bookings for their properties
- Can filter by:
  - Status (pending, paid, confirmed)
  - Date range
  - Property

**3. Receive Payment Notification**

- When guest pays, agent receives email notification
- Email contains:
  - Guest contact information
  - Booking details
  - Check-in/out dates
  - Amount received

**4. Check Wallet Balance**

- **Endpoint:** `GET /bookings/agents/{agent_id}/wallet`
- Agent sees current wallet balance
- Shows total earnings from bookings

**5. View Transaction History**

- **Endpoint:** `GET /bookings/agents/{agent_id}/transactions`
- Agent sees all wallet transactions:
  - Credits from booking payments
  - Debits from withdrawals/fees
  - Balance before/after each transaction

**6. Update Booking Status**

- **Endpoint:** `PATCH /bookings/{booking_id}/status`
- **Auth:** Property owner only
- Agent can:
  - Confirm booking
  - Mark as completed after guest checkout
  - Cannot cancel paid bookings (admin only)

**7. View Booking Details**

- **Endpoint:** `GET /bookings/{booking_id}`
- Agent sees full booking details
- Guest contact information
- Payment status

---

### 👨‍💼 Admin/Finance Journey

**1. View All Bookings (System-wide)**

- **Endpoint:** `GET /bookings/admin/all`
- **Auth:** Admin only
- See all bookings across all properties
- Advanced filters:
  - Agent ID
  - Property ID
  - Status
  - Date range
  - Payment status

**2. View All Transactions (System-wide)**

- **Endpoint:** `GET /bookings/transactions`
- **Auth:** Admin only
- See all wallet transactions in the system
- Filter by:
  - Transaction type (credit/debit)
  - Status
  - Date range
  - User ID
  - Booking ID

**3. Manage Bookings**

- **Endpoint:** `PATCH /bookings/admin/{booking_id}`
- **Auth:** Admin only
- Admin can:
  - Update any booking status
  - Cancel paid bookings
  - Process refunds
  - Override restrictions

**4. Manage Transactions**

- **Endpoint:** `POST /bookings/transactions/{transaction_id}/reverse`
- **Auth:** Admin only
- Admin can:
  - Reverse transactions
  - Process refunds
  - Adjust wallet balances
  - Mark transactions as failed

**5. View User Transaction History**

- **Endpoint:** `GET /bookings/users/{user_id}/transactions`
- **Auth:** Admin only (or user themselves)
- See all transactions for specific user
- Useful for customer support

**6. Generate Reports**

- **Endpoint:** `GET /bookings/admin/reports`
- **Auth:** Admin only
- Generate reports:
  - Total bookings by date range
  - Revenue analytics
  - Agent performance
  - Payment success rate

**7. Handle Cancelled Bookings**

- **Endpoint:** `GET /bookings/admin/cancelled`
- View all cancelled bookings
- Process refunds
- Track cancellation patterns

---

## User Role Permissions

| Endpoint              | User (Guest)     | Agent               | Admin    |
| --------------------- | ---------------- | ------------------- | -------- |
| Create Booking        | ✅               | ✅                  | ✅       |
| View Own Bookings     | ✅               | ✅                  | ✅       |
| View Agent Bookings   | ❌               | ✅ (own)            | ✅ (all) |
| View All Bookings     | ❌               | ❌                  | ✅       |
| Update Booking Status | ❌               | ✅ (own properties) | ✅ (all) |
| Cancel Booking        | ✅ (unpaid only) | ✅ (own properties) | ✅ (all) |
| View Own Transactions | ✅               | ✅                  | ✅       |
| View All Transactions | ❌               | ❌                  | ✅       |
| Manage Transactions   | ❌               | ❌                  | ✅       |
| View Wallet           | ✅               | ✅                  | ✅ (all) |
| Process Refunds       | ❌               | ❌                  | ✅       |

---

## Booking Status Lifecycle

```
pending
  ↓
payment_initialized (Paystack link generated)
  ↓
paid (Payment verified, wallet funded)
  ↓
confirmed (Agent confirms or user confirms)
  ↓
completed (After checkout date)

Alternative flows:
pending → cancelled (User cancels before payment)
payment_initialized → cancelled (Payment timeout/failure)
paid → cancelled (Admin cancellation with refund)
```

---

## Transaction Flow

**For Booking Payment:**

```
1. User completes payment on Paystack
2. Webhook/Verify endpoint called
3. Transaction created:
   - type: "credit"
   - wallet_id: agent's wallet
   - booking_id: linked booking
   - amount: payment amount
   - status: "completed"
   - balance_before: old balance
   - balance_after: new balance
4. Agent wallet balance updated
5. Both user and agent notified
```

**For Refund:**

```
1. Admin initiates refund
2. Transaction created:
   - type: "debit"
   - wallet_id: agent's wallet
   - booking_id: linked booking
   - amount: refund amount
   - status: "completed"
   - description: "Refund for booking cancellation"
3. Agent wallet debited
4. Refund processed to user's payment method
5. Notifications sent
```

---

## Notification System

### Email Notifications

**1. Booking Created (Unpaid)**

- **Recipient:** Guest (user who created booking)
- **Subject:** "Booking Created - Payment Required"
- **Content:**
  - Booking details
  - Payment link (48hr expiry)
  - Property information
  - Amount due
- **Trigger:** Booking created with status `pending`

**2. Payment Reminder (Unpaid)**

- **Recipient:** Guest
- **Subject:** "Payment Reminder - Booking Expires Soon"
- **Content:**
  - Booking about to expire
  - Payment link
  - Expiry countdown
- **Trigger:** 24 hours before payment link expires

**3. Booking Confirmation (Paid)**

- **Recipient:** Guest
- **Subject:** "Booking Confirmed - Payment Received"
- **Content:**
  - Booking reference
  - Property details
  - Check-in/out dates
  - Amount paid
  - Next steps
- **Trigger:** Payment verified successfully

**4. Agent Payment Notification**

- **Recipient:** Property owner (agent)
- **Subject:** "New Booking Payment Received"
- **Content:**
  - Guest contact information
  - Booking details
  - Amount received
  - Wallet updated
- **Trigger:** Payment verified successfully

**5. Booking Cancellation**

- **Recipient:** Both guest and agent
- **Subject:** "Booking Cancelled"
- **Content:**
  - Cancellation reason
  - Refund details (if applicable)
  - Cancellation date
- **Trigger:** Booking cancelled

**6. Refund Processed**

- **Recipient:** Guest
- **Subject:** "Refund Processed"
- **Content:**
  - Refund amount
  - Expected arrival date
  - Transaction reference
- **Trigger:** Refund transaction completed

---

## System Flow

### 1. Booking Creation → 2. Payment → 3. Verification → 4. Wallet Funding → 5. Email Notifications

## Endpoints

### 1. Create Booking

**POST** `/bookings`

Creates a new booking and automatically assigns the authenticated user.

**Authentication:** Required

**Request Body:**

```json
{
  "property_id": "uuid",
  "guest_name": "John Doe",
  "guest_email": "john@example.com",
  "guest_phone": "+234XXXXXXXXXX",
  "check_in_date": "2024-02-01",
  "check_out_date": "2024-02-05",
  "number_of_guests": 2,
  "special_requests": "Early check-in if possible"
}
```

**Response:**

- Status: `201 Created`
- Body: `BookingResponse` with payment_reference generated

**Notes:**

- User authenticated via JWT token
- Total amount calculated from property price × nights
- Payment reference auto-generated: `BOOK-{timestamp}-{uuid[:8]}`

---

### 2. Initialize Payment

**POST** `/bookings/initialize-payment`

Generates Paystack payment link for a booking.

**Authentication:** Required

**Request Body:**

```json
{
  "booking_id": "uuid"
}
```

**Response:**

```json
{
  "authorization_url": "https://checkout.paystack.com/...",
  "access_code": "xyz123",
  "reference": "BOOK-..."
}
```

**Validations:**

- User must own the booking
- Booking must not already be paid
- Redirects user to Paystack checkout

---

### 3. Verify Payment

**POST** `/bookings/verify-payment`

Verifies payment with Paystack and processes wallet funding.

**Authentication:** Optional (can be called from Paystack redirect)

**Request Body:**

```json
{
  "reference": "BOOK-..."
}
```

**Response:**

```json
{
  "status": "success",
  "amount": 50000.0,
  "currency": "NGN",
  "paid_at": "2024-01-15T10:30:00Z",
  "reference": "BOOK-..."
}
```

**Process:**

1. Verifies payment with Paystack API
2. Marks booking as `paid`
3. Gets property owner (agent)
4. Creates or gets agent wallet
5. Credits wallet with payment amount
6. Creates transaction record
7. Sends confirmation email to guest
8. Sends payment notification to agent

---

### 4. Paystack Webhook

**POST** `/bookings/webhook`

Handles async payment notifications from Paystack.

**Authentication:** None (validates signature)

**Headers:**

```
x-paystack-signature: <webhook-signature>
```

**Payload:**

```json
{
  "event": "charge.success",
  "data": {
    "reference": "BOOK-...",
    "amount": 5000000,
    "status": "success"
  }
}
```

**Process:**

- Same as verify payment but triggered automatically by Paystack
- Handles idempotency (checks if already processed)
- Non-blocking email sending

---

### 5. Confirm Booking

**POST** `/bookings/{booking_id}/confirm`

Confirms a booking. Behavior depends on payment status.

**Authentication:** Required

**Response:** `BookingResponse`

**Logic:**

- **If paid:** Marks as `confirmed`, sends confirmation email
- **If unpaid:** Generates timed payment link (48hr expiry), sends payment reminder email

**Use Case:**

- User wants to formally confirm attendance
- System can send payment reminders with time-limited links

---

### 6. Get User Bookings

**GET** `/bookings`

Retrieves all bookings for the authenticated user.

**Authentication:** Required

**Query Parameters:**

- `page` (default: 1)
- `page_size` (default: 20, max: 100)
- `status` (optional: pending, paid, confirmed, etc.)

**Response:**

```json
{
  "bookings": [...],
  "total": 10,
  "page": 1,
  "page_size": 20
}
```

---

### 7. Get Agent Bookings

**GET** `/bookings/agent/{agent_id}/bookings`

Retrieves all bookings for properties owned by an agent.

**Authentication:** Required (agent or admin)

**Query Parameters:**

- `page`, `page_size`, `status` (same as above)

**Authorization:**

- Agent can only view their own property bookings
- Admins can view any agent's bookings

**Response:** Same structure as Get User Bookings

---

### 8. Get Booking by ID

**GET** `/bookings/{booking_id}`

Retrieves a specific booking.

**Authentication:** Required

**Authorization:** User must own the booking

**Response:** `BookingResponse`

---

### 9. Update Booking Status

**PATCH** `/bookings/{booking_id}/status`

Updates booking status (agent/admin only).

**Authentication:** Required

**Authorization:**

- Property owner (agent)
- System admin

**Request Body:**

```json
{
  "status": "confirmed"
}
```

**Valid Statuses:**

- `pending`
- `payment_initialized`
- `paid`
- `confirmed`
- `cancelled`
- `completed`

---

### 10. Get All Transactions (Admin)

**GET** `/bookings/transactions`

Retrieves all wallet transactions in the system.

**Authentication:** Required (admin only)

**Query Parameters:**

- `page`, `page_size`, `status`

**Response:**

```json
{
  "transactions": [
    {
      "id": "uuid",
      "wallet_id": "uuid",
      "booking_id": "uuid",
      "transaction_type": "credit",
      "amount": 50000.0,
      "description": "Booking payment for Luxury Apartment",
      "status": "completed",
      "balance_before": 100000.0,
      "balance_after": 150000.0,
      "payment_reference": "BOOK-...",
      "paystack_reference": "...",
      "created_at": "2024-01-15T10:30:00Z"
    }
  ],
  "total": 100,
  "page": 1,
  "page_size": 20
}
```

---

## Data Models

### Booking

```python
{
    id: UUID
    property_booked_id: UUID
    booked_by_id: UUID  # Authenticated user
    guest_name: str
    guest_email: str
    guest_phone: str
    check_in_date: date
    check_out_date: date
    number_of_guests: int
    special_requests: str (optional)
    total_amount: Decimal
    currency: str  # Default: "NGN"
    status: str  # See statuses above
    payment_reference: str  # Internal reference
    paystack_reference: str  # Paystack's reference
    payment_authorization_url: str  # Payment link
    paid_at: datetime (nullable)
    created_at: datetime
    updated_at: datetime
}
```

### Wallet

```python
{
    id: UUID
    user_id: UUID  # One wallet per user
    balance: Decimal(15, 2)
    created_at: datetime
    updated_at: datetime
}
```

### Transaction

```python
{
    id: UUID
    wallet_id: UUID
    booking_id: UUID (nullable)
    transaction_type: str  # "credit" or "debit"
    amount: Decimal
    description: str
    status: str  # "pending", "completed", "failed", "reversed"
    balance_before: Decimal
    balance_after: Decimal
    payment_reference: str (nullable)
    paystack_reference: str (nullable)
    metadata: JSON
    created_at: datetime
}
```

---

## Payment Flow Diagram

```
User Creates Booking
    ↓
System Generates payment_reference
    ↓
User Clicks "Pay Now"
    ↓
POST /bookings/initialize-payment
    ↓
Paystack Returns authorization_url
    ↓
User Redirected to Paystack Checkout
    ↓
User Completes Payment
    ↓
        ↙                    ↘
    Webhook Triggered    User Redirected Back
    (Background)         (Foreground)
        ↓                    ↓
POST /webhook        POST /verify-payment
        ↘                    ↙
            ↓
    Verify with Paystack API
            ↓
    Mark Booking as "paid"
            ↓
    Get Property Owner
            ↓
    Create/Get Agent Wallet
            ↓
    Credit Wallet (Amount / 100)  # Paystack uses kobo
            ↓
    Create Transaction Record
            ↓
    Send Emails (Background)
        - Guest: Booking confirmation
        - Agent: Payment notification
```

---

## Wallet Funding Logic

When a booking payment is verified:

1. **Extract amount:** Paystack returns amount in kobo (NGN \* 100)

   - Convert: `amount_paid = Decimal(paystack_amount) / 100`

2. **Get property owner:**

   ```python
   property_obj = db.query(Property).filter(Property.id == booking.property_booked_id).first()
   agent_id = property_obj.listed_by_id
   ```

3. **Get or create wallet:**

   ```python
   wallet = wallet_repo.get_or_create(agent_id)
   ```

4. **Credit wallet:**

   ```python
   wallet_repo.credit(
       wallet_id=wallet.id,
       amount=amount_paid,
       description=f"Booking payment for {property_name}",
       booking_id=booking.id,
       payment_reference=reference,
       paystack_reference=paystack_ref,
       metadata={...}
   )
   ```

5. **Transaction created automatically** with:
   - `balance_before`: Wallet balance before credit
   - `balance_after`: Wallet balance after credit
   - `status`: "completed"

---

## Email Notifications

### 1. Guest Booking Confirmation

**Trigger:** Payment verified successfully

**Recipient:** `booking.guest_email`

**Template:** `templates/emailtemplatereviai/booking_confirmation.html`

**Variables:**

- Guest name
- Property title
- Check-in/out dates
- Total amount
- Booking reference

### 2. Agent Payment Notification

**Trigger:** Payment verified successfully

**Recipient:** `property.listed_by.email`

**Template:** `templates/emailtemplatereviai/booking_agent_notification.html`

**Variables:**

- Agent name
- Guest name, email, phone
- Property title
- Check-in/out dates
- Total amount

---

## Security Considerations

### 1. Authentication

- All endpoints (except webhook) require JWT authentication
- User can only access their own bookings
- Agents can only access their own property bookings
- Admins have full access

### 2. Authorization Checks

```python
# User owns booking
if booking.booked_by_id != current_user.id:
    raise HTTPException(403, "Forbidden")

# Agent owns property
if property.listed_by_id != current_user.id:
    raise HTTPException(403, "Forbidden")
```

### 3. Webhook Security

TODO: Implement signature verification:

```python
signature = request.headers.get('x-paystack-signature')
if not paystack_service.verify_webhook_signature(payload, signature):
    raise HTTPException(400, "Invalid signature")
```

### 4. Idempotency

- Webhook checks if booking already marked as paid
- Prevents duplicate wallet credits

---

## Error Handling

### Common Errors

**404 Not Found**

- Booking not found
- Property not found

**403 Forbidden**

- User doesn't own booking
- User not property owner

**400 Bad Request**

- Booking already paid
- Payment verification failed
- Check-out date before check-in

**500 Internal Server Error**

- Paystack API error
- Wallet funding error (logged, doesn't block payment verification)

---

## Database Migrations

### Applied Migrations

1. `property/migrations/0007_booking.py` - Creates Booking table
2. `property/migrations/0008_wallet_transaction_and_more.py` - Creates Wallet and Transaction tables

### Indexes Created

- `booking_property_booked_id` - For agent booking queries
- `booking_booked_by_id` - For user booking queries
- `booking_status` - For status filtering
- `booking_payment_reference` - For payment lookup
- `wallet_user_id` (unique) - One wallet per user
- `transaction_wallet_id` - For wallet transaction history
- `transaction_booking_id` - For booking transaction lookup

---

## Environment Variables Required

```env
# Paystack
PAYSTACK_SECRET_KEY=sk_test_...
PAYSTACK_PUBLIC_KEY=pk_test_...

# Email
EMAIL_HOST=smtppro.zoho.com
EMAIL_PORT=465
EMAIL_USE_SSL=True
EMAIL_HOST_USER=noreply@reviai.ai
EMAIL_HOST_PASSWORD=...
DEFAULT_FROM_EMAIL=noreply@reviai.ai

# App
BASE_URL=https://your-domain.com  # For payment callbacks
```

---

## Testing Checklist

### Manual Testing Steps

1. **Create Booking**

   - ✓ Booking created with authenticated user
   - ✓ Total amount calculated correctly
   - ✓ Payment reference generated

2. **Initialize Payment**

   - ✓ Paystack link generated
   - ✓ Authorization URL valid
   - ✓ Booking status updated to `payment_initialized`

3. **Complete Payment (Paystack)**

   - ✓ Payment successful on Paystack
   - ✓ Redirected back to app

4. **Verify Payment**

   - ✓ Payment verified
   - ✓ Booking marked as `paid`
   - ✓ Agent wallet created/found
   - ✓ Wallet credited with correct amount
   - ✓ Transaction record created
   - ✓ Guest confirmation email sent
   - ✓ Agent notification email sent

5. **Webhook**

   - ✓ Webhook received from Paystack
   - ✓ Duplicate processing prevented
   - ✓ Wallet funded correctly

6. **Get Bookings**

   - ✓ User sees only their bookings
   - ✓ Agent sees all property bookings
   - ✓ Pagination works
   - ✓ Status filtering works

7. **Update Status**

   - ✓ Only agent/admin can update
   - ✓ Status changes persist

8. **Transactions**
   - ✓ Only admin can access
   - ✓ All transactions visible

---

## Future Enhancements

### Planned Features

- [ ] Timed payment link expiration tracking
- [ ] Payment reminder email template
- [ ] Webhook signature verification
- [ ] Refund processing
- [ ] Wallet withdrawal system
- [ ] Commission calculation
- [ ] Booking cancellation policy
- [ ] Partial payments support

---

## Repository Methods

### BookingRepository

- `create(booking_data, user_id)` - Create booking
- `get_by_id(booking_id)` - Get booking
- `get_by_payment_reference(ref)` - Find by payment ref
- `get_by_paystack_reference(ref)` - Find by Paystack ref
- `mark_as_paid(booking_id)` - Update to paid
- `update_payment_info(booking_id, ref, url)` - Update payment details
- `get_all(skip, limit, status, booked_by_id)` - List bookings

### WalletRepository

- `get_by_user_id(user_id)` - Get user wallet
- `get_or_create(user_id)` - Get or create wallet
- `credit(wallet_id, amount, ...)` - Credit wallet
- `debit(wallet_id, amount, ...)` - Debit wallet

### TransactionRepository

- `get_all(skip, limit, wallet_id, booking_id, status)` - List transactions
- `get_by_id(transaction_id)` - Get transaction
- `get_by_booking(booking_id)` - Get booking transactions

---

## API Response Examples

### Successful Booking Creation

```json
{
  "id": "123e4567-e89b-12d3-a456-426614174000",
  "property_booked_id": "223e4567-e89b-12d3-a456-426614174000",
  "booked_by_id": "323e4567-e89b-12d3-a456-426614174000",
  "guest_name": "John Doe",
  "guest_email": "john@example.com",
  "guest_phone": "+2348012345678",
  "check_in_date": "2024-02-01",
  "check_out_date": "2024-02-05",
  "number_of_guests": 2,
  "special_requests": "Early check-in",
  "total_amount": "50000.00",
  "currency": "NGN",
  "status": "pending",
  "payment_reference": "BOOK-20240115-12a3b4c5",
  "paystack_reference": null,
  "payment_authorization_url": null,
  "paid_at": null,
  "created_at": "2024-01-15T10:00:00Z",
  "updated_at": "2024-01-15T10:00:00Z"
}
```

### Transaction Record Example

```json
{
  "id": "423e4567-e89b-12d3-a456-426614174000",
  "wallet_id": "523e4567-e89b-12d3-a456-426614174000",
  "booking_id": "123e4567-e89b-12d3-a456-426614174000",
  "transaction_type": "credit",
  "amount": "50000.00",
  "description": "Booking payment for Luxury Apartment in Lekki",
  "status": "completed",
  "balance_before": "100000.00",
  "balance_after": "150000.00",
  "payment_reference": "BOOK-20240115-12a3b4c5",
  "paystack_reference": "T123456789",
  "metadata": {
    "booking_id": "123e4567-e89b-12d3-a456-426614174000",
    "property_id": "223e4567-e89b-12d3-a456-426614174000",
    "guest_name": "John Doe",
    "check_in": "2024-02-01",
    "check_out": "2024-02-05"
  },
  "created_at": "2024-01-15T10:30:00Z"
}
```
