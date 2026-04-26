# EventHub Database Entities

This document lists the candidate database tables for the EventHub application, extracted from feature cards. Each entity is owned by the feature(s) that create, update, or delete it.

---

## Entities

### 1. Event
- Owned by: Enter Event Details, Set Event Date and Time, Set Event Location, Review Event Information, Set Event Visibility, Activate Event Listing
- Referenced by: Most features (filters, ticketing, sales, etc.)

### 2. TicketType
- Owned by: Define Ticket Types, Set Pricing
- Referenced by: Event, Ticket

### 3. Ticket
- Owned by: Confirm Purchase
- Referenced by: Display Seating Options, Select Seat, Select Ticket Type, Reserve Ticket, Update Sales Metrics

### 4. TicketReservation
- Owned by: Select Seat, Select Ticket Type, Reserve Ticket, Initiate Booking Cancellation, Validate Cancellation Eligibility, Process Cancellation Request, Confirm Cancellation
- Referenced by: Payment, Refund

### 5. Payment
- Owned by: Enter Payment Information, Validate Payment, Handle Payment Failure
- Referenced by: TicketReservation, Ticket

### 6. Refund
- Owned by: Initiate Refund Request, Validate Refund Eligibility, Process Refund Payment, Notify Refund Status
- Referenced by: TicketReservation

### 7. SalesData
- Owned by: Update Sales Metrics
- Referenced by: Display Sales Dashboard, Export Sales Data

### 8. User
- Owned by: Create User Account, Update User Information, Deactivate User Account, Delete User Account
- Referenced by: UserRole

### 9. UserRole
- Owned by: Assign User Role, Update User Role, Remove User Role
- Referenced by: User

---

This list forms the basis for the PostgreSQL schema. Each entity will be defined as a table, with relationships and fields specified in the next step.
