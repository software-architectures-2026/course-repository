Feature Card: Display Event List
1. Data Ownership
   - Owns: None
   - References: Event
2. Input / Output
   - Input: User action (page load, navigation)
   - Output: UI update (event list displayed)
3. Dependencies
   - Filter Event List, Sort Event List
4. Invariants
   - Only published events are displayed

Feature Card: Filter Event List
1. Data Ownership
   - Owns: None
   - References: Event
2. Input / Output
   - Input: User action (filter selection)
   - Output: UI update (filtered event list)
3. Dependencies
   - Display Event List
4. Invariants
   - Filtered results must match selected criteria

Feature Card: Sort Event List
1. Data Ownership
   - Owns: None
   - References: Event
2. Input / Output
   - Input: User action (sort selection)
   - Output: UI update (sorted event list)
3. Dependencies
   - Display Event List
4. Invariants
   - Sorting must be accurate and consistent

Feature Card: View Event Details
1. Data Ownership
   - Owns: None
   - References: Event
2. Input / Output
   - Input: User action (event selection)
   - Output: UI update (event details page)
3. Dependencies
   - Display Event List
4. Invariants
   - Event details must be accurate and up-to-date

Feature Card: Apply Date Filter
1. Data Ownership
   - Owns: None
   - References: Event
2. Input / Output
   - Input: User action (date filter selection)
   - Output: UI update (filtered event list)
3. Dependencies
   - Filter Event List
4. Invariants
   - Only events within selected date range are shown

Feature Card: Apply Location Filter
1. Data Ownership
   - Owns: None
   - References: Event
2. Input / Output
   - Input: User action (location filter selection)
   - Output: UI update (filtered event list)
3. Dependencies
   - Filter Event List
4. Invariants
   - Only events in selected location are shown

Feature Card: Apply Category Filter
1. Data Ownership
   - Owns: None
   - References: Event
2. Input / Output
   - Input: User action (category filter selection)
   - Output: UI update (filtered event list)
3. Dependencies
   - Filter Event List
4. Invariants
   - Only events in selected category are shown

Feature Card: Apply Price Filter
1. Data Ownership
   - Owns: None
   - References: Event
2. Input / Output
   - Input: User action (price filter selection)
   - Output: UI update (filtered event list)
3. Dependencies
   - Filter Event List
4. Invariants
   - Only events within selected price range are shown

Feature Card: Display Seating Options
1. Data Ownership
   - Owns: None
   - References: Event, Ticket
2. Input / Output
   - Input: User action (event details page)
   - Output: UI update (seating options displayed)
3. Dependencies
   - View Event Details
4. Invariants
   - Seating options must reflect real-time availability

Feature Card: Select Seat
1. Data Ownership
   - Owns: TicketReservation
   - References: Event, Ticket
2. Input / Output
   - Input: User action (seat selection)
   - Output: Data change (seat reserved), UI update
3. Dependencies
   - Display Seating Options
4. Invariants
   - Seat can only be reserved if available; double-booking prevented (QAW: booking integrity)

Feature Card: Select Ticket Type
1. Data Ownership
   - Owns: TicketReservation
   - References: Event, Ticket
2. Input / Output
   - Input: User action (ticket type selection)
   - Output: Data change (ticket type reserved), UI update
3. Dependencies
   - Display Seating Options
4. Invariants
   - Ticket type must match event configuration

Feature Card: Reserve Ticket
1. Data Ownership
   - Owns: TicketReservation
   - References: Event, Ticket
2. Input / Output
   - Input: User action (reserve button)
   - Output: Data change (reservation created), UI update
3. Dependencies
   - Select Seat, Select Ticket Type
4. Invariants
   - Reservation must expire if not purchased within set time

Feature Card: Enter Payment Information
1. Data Ownership
   - Owns: Payment
   - References: TicketReservation
2. Input / Output
   - Input: User action (payment form submission)
   - Output: Data change (payment info stored), UI update
3. Dependencies
   - Reserve Ticket
4. Invariants
   - Payment information must be securely handled

Feature Card: Validate Payment
1. Data Ownership
   - Owns: Payment
   - References: TicketReservation
2. Input / Output
   - Input: System event (payment processing)
   - Output: Data change (payment status updated), UI update
3. Dependencies
   - Enter Payment Information
4. Invariants
   - Payment must be validated by gateway; failed payments retried (QAW: payment failure resilience)

Feature Card: Confirm Purchase
1. Data Ownership
   - Owns: Ticket
   - References: Payment, TicketReservation
2. Input / Output
   - Input: System event (successful payment)
   - Output: Data change (ticket issued), UI update
3. Dependencies
   - Validate Payment
4. Invariants
   - Ticket issued only after successful payment; no orphaned payments (QAW)

Feature Card: Handle Payment Failure
1. Data Ownership
   - Owns: Payment
   - References: TicketReservation
2. Input / Output
   - Input: System event (payment failure)
   - Output: UI update (failure notification), data change (reservation released)
3. Dependencies
   - Validate Payment
4. Invariants
   - User notified of failure; reservation released; payment retried if possible (QAW)

Feature Card: Enter Event Details
1. Data Ownership
   - Owns: Event
   - References: None
2. Input / Output
   - Input: Organizer action (event creation form)
   - Output: Data change (event created), UI update
3. Dependencies
   - None
4. Invariants
   - Event details must be valid and complete

Feature Card: Set Event Date and Time
1. Data Ownership
   - Owns: Event
   - References: None
2. Input / Output
   - Input: Organizer action (date/time selection)
   - Output: Data change (event date/time set), UI update
3. Dependencies
   - Enter Event Details
4. Invariants
   - Date/time must be valid and not in the past

Feature Card: Set Event Location
1. Data Ownership
   - Owns: Event
   - References: None
2. Input / Output
   - Input: Organizer action (location selection)
   - Output: Data change (event location set), UI update
3. Dependencies
   - Enter Event Details
4. Invariants
   - Location must be valid and available

Feature Card: Define Ticket Types
1. Data Ownership
   - Owns: TicketType
   - References: Event
2. Input / Output
   - Input: Organizer action (ticket type definition)
   - Output: Data change (ticket types created), UI update
3. Dependencies
   - Enter Event Details
4. Invariants
   - Ticket types must match event requirements

Feature Card: Set Pricing
1. Data Ownership
   - Owns: TicketType
   - References: Event
2. Input / Output
   - Input: Organizer action (pricing definition)
   - Output: Data change (pricing set), UI update
3. Dependencies
   - Define Ticket Types
4. Invariants
   - Pricing must be valid and non-negative

Feature Card: Review Event Information
1. Data Ownership
   - Owns: Event
   - References: None
2. Input / Output
   - Input: Organizer action (review step)
   - Output: UI update (event summary)
3. Dependencies
   - Enter Event Details, Set Event Date and Time, Set Event Location, Define Ticket Types, Set Pricing
4. Invariants
   - All event information must be accurate and complete

Feature Card: Set Event Visibility
1. Data Ownership
   - Owns: Event
   - References: None
2. Input / Output
   - Input: Organizer action (visibility toggle)
   - Output: Data change (event visibility updated), UI update
3. Dependencies
   - Review Event Information
4. Invariants
   - Event must not be visible before review is complete

Feature Card: Activate Event Listing
1. Data Ownership
   - Owns: Event
   - References: None
2. Input / Output
   - Input: Organizer action (publish button)
   - Output: Data change (event published), UI update
3. Dependencies
   - Set Event Visibility
4. Invariants
   - Event listing must be activated only after all validations

Feature Card: Display Sales Dashboard
1. Data Ownership
   - Owns: None
   - References: SalesData
2. Input / Output
   - Input: Organizer action (dashboard access)
   - Output: UI update (dashboard displayed)
3. Dependencies
   - Update Sales Metrics
4. Invariants
   - Dashboard must reflect real-time data (QAW: real-time performance)

Feature Card: Update Sales Metrics
1. Data Ownership
   - Owns: SalesData
   - References: Event, Ticket
2. Input / Output
   - Input: System event (sales update)
   - Output: Data change (sales metrics updated), UI update
3. Dependencies
   - Ticket issued
4. Invariants
   - Sales metrics must be accurate and up-to-date (QAW)

Feature Card: Export Sales Data
1. Data Ownership
   - Owns: None
   - References: SalesData
2. Input / Output
   - Input: Organizer action (export request)
   - Output: Data export (CSV, PDF, etc.)
3. Dependencies
   - Display Sales Dashboard
4. Invariants
   - Exported data must match dashboard data

Feature Card: Initiate Booking Cancellation
1. Data Ownership
   - Owns: TicketReservation
   - References: Ticket
2. Input / Output
   - Input: User action (cancel booking)
   - Output: Data change (cancellation request created), UI update
3. Dependencies
   - Confirm Purchase
4. Invariants
   - Cancellation must be within allowed window (QAW: refund reliability)

Feature Card: Validate Cancellation Eligibility
1. Data Ownership
   - Owns: TicketReservation
   - References: Ticket
2. Input / Output
   - Input: System event (cancellation request)
   - Output: UI update (eligibility feedback)
3. Dependencies
   - Initiate Booking Cancellation
4. Invariants
   - Only eligible bookings can be cancelled

Feature Card: Process Cancellation Request
1. Data Ownership
   - Owns: TicketReservation
   - References: Ticket
2. Input / Output
   - Input: System event (eligible cancellation)
   - Output: Data change (booking cancelled), UI update
3. Dependencies
   - Validate Cancellation Eligibility
4. Invariants
   - Booking must be cancelled promptly; refund process triggered

Feature Card: Confirm Cancellation
1. Data Ownership
   - Owns: TicketReservation
   - References: Ticket
2. Input / Output
   - Input: System event (cancellation processed)
   - Output: UI update (confirmation), notification
3. Dependencies
   - Process Cancellation Request
4. Invariants
   - User must be notified of cancellation

Feature Card: Initiate Refund Request
1. Data Ownership
   - Owns: Refund
   - References: TicketReservation
2. Input / Output
   - Input: User action (refund request)
   - Output: Data change (refund request created), UI update
3. Dependencies
   - Confirm Cancellation
4. Invariants
   - Refund request must be valid and timely

Feature Card: Validate Refund Eligibility
1. Data Ownership
   - Owns: Refund
   - References: TicketReservation
2. Input / Output
   - Input: System event (refund request)
   - Output: UI update (eligibility feedback)
3. Dependencies
   - Initiate Refund Request
4. Invariants
   - Only eligible refunds are processed

Feature Card: Process Refund Payment
1. Data Ownership
   - Owns: Refund
   - References: TicketReservation
2. Input / Output
   - Input: System event (eligible refund)
   - Output: Data change (refund processed), UI update
3. Dependencies
   - Validate Refund Eligibility
4. Invariants
   - Refund must be processed within 24 hours (QAW: refund reliability)

Feature Card: Notify Refund Status
1. Data Ownership
   - Owns: Refund
   - References: TicketReservation
2. Input / Output
   - Input: System event (refund processed)
   - Output: UI update (status notification), notification
3. Dependencies
   - Process Refund Payment
4. Invariants
   - User must be notified of refund status

Feature Card: Create User Account
1. Data Ownership
   - Owns: User
   - References: None
2. Input / Output
   - Input: User action (registration)
   - Output: Data change (user created), UI update
3. Dependencies
   - None
4. Invariants
   - User data must be valid and unique

Feature Card: Update User Information
1. Data Ownership
   - Owns: User
   - References: None
2. Input / Output
   - Input: User action (profile update)
   - Output: Data change (user updated), UI update
3. Dependencies
   - Create User Account
4. Invariants
   - User data must remain valid

Feature Card: Deactivate User Account
1. Data Ownership
   - Owns: User
   - References: None
2. Input / Output
   - Input: User action (deactivation request)
   - Output: Data change (user deactivated), UI update
3. Dependencies
   - Create User Account
4. Invariants
   - Deactivated users cannot access platform

Feature Card: Delete User Account
1. Data Ownership
   - Owns: User
   - References: None
2. Input / Output
   - Input: User action (delete request)
   - Output: Data change (user deleted), UI update
3. Dependencies
   - Deactivate User Account
4. Invariants
   - Deleted user data must be removed from system

Feature Card: Assign User Role
1. Data Ownership
   - Owns: UserRole
   - References: User
2. Input / Output
   - Input: Admin action (role assignment)
   - Output: Data change (role assigned), UI update
3. Dependencies
   - Create User Account
4. Invariants
   - Role assignment must be valid and authorized

Feature Card: Update User Role
1. Data Ownership
   - Owns: UserRole
   - References: User
2. Input / Output
   - Input: Admin action (role update)
   - Output: Data change (role updated), UI update
3. Dependencies
   - Assign User Role
4. Invariants
   - Role updates must be valid and authorized

Feature Card: Remove User Role
1. Data Ownership
   - Owns: UserRole
   - References: User
2. Input / Output
   - Input: Admin action (role removal)
   - Output: Data change (role removed), UI update
3. Dependencies
   - Assign User Role
4. Invariants
   - Role removal must be valid and authorized

Feature Card: View User Roles
1. Data Ownership
   - Owns: None
   - References: UserRole, User
2. Input / Output
   - Input: Admin action (view roles)
   - Output: UI update (roles displayed)
3. Dependencies
   - Assign User Role
4. Invariants
   - Displayed roles must be accurate
