-- EventHub Database Schema
-- PostgreSQL SQL file defining all tables

-- Enable pgcrypto for UUID generation
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 1. users
CREATE TABLE users (
    user_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    full_name TEXT,
    status TEXT NOT NULL CHECK (status IN ('active', 'deactivated', 'deleted')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. events
CREATE TABLE events (
    event_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organizer_id UUID NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    category TEXT,
    location TEXT NOT NULL,
    start_time TIMESTAMPTZ NOT NULL,
    end_time TIMESTAMPTZ NOT NULL,
    visibility BOOLEAN NOT NULL DEFAULT FALSE,
    published BOOLEAN NOT NULL DEFAULT FALSE,
    metadata JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. ticket_types
CREATE TABLE ticket_types (
    ticket_type_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id UUID NOT NULL REFERENCES events(event_id) ON DELETE CASCADE,
    -- ON DELETE CASCADE: Ticket types cannot exist without their event
    name TEXT NOT NULL,
    price NUMERIC(10,2) NOT NULL CHECK (price >= 0),
    quantity INT NOT NULL CHECK (quantity >= 0),
    metadata JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. ticket_reservations
CREATE TABLE ticket_reservations (
    reservation_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id UUID NOT NULL REFERENCES events(event_id) ON DELETE CASCADE,
    -- ON DELETE CASCADE: Reservations are tied to events
    user_id UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    -- ON DELETE CASCADE: Reservations are tied to users
    ticket_type_id UUID NOT NULL REFERENCES ticket_types(ticket_type_id) ON DELETE CASCADE,
    -- ON DELETE CASCADE: Reservations are tied to ticket types
    seat TEXT,
    status TEXT NOT NULL CHECK (status IN ('active', 'expired', 'cancelled')),
    expires_at TIMESTAMPTZ,
    metadata JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. tickets
CREATE TABLE tickets (
    ticket_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ticket_type_id UUID NOT NULL REFERENCES ticket_types(ticket_type_id) ON DELETE CASCADE,
    -- ON DELETE CASCADE: Tickets cannot exist without their ticket type
    reservation_id UUID REFERENCES ticket_reservations(reservation_id) ON DELETE SET NULL,
    -- ON DELETE SET NULL: Tickets may exist independently after reservation expires or is cancelled
    user_id UUID REFERENCES users(user_id) ON DELETE SET NULL,
    -- ON DELETE SET NULL: Tickets may remain for reporting after user deletion
    seat TEXT,
    status TEXT NOT NULL CHECK (status IN ('issued', 'reserved', 'cancelled')),
    issued_at TIMESTAMPTZ,
    metadata JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. payments
CREATE TABLE payments (
    payment_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    reservation_id UUID NOT NULL REFERENCES ticket_reservations(reservation_id) ON DELETE CASCADE,
    -- ON DELETE CASCADE: Payments are tied to reservations
    amount NUMERIC(10,2) NOT NULL CHECK (amount >= 0),
    status TEXT NOT NULL CHECK (status IN ('pending', 'completed', 'failed')),
    method TEXT,
    gateway_response JSONB,
    processed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. refunds
CREATE TABLE refunds (
    refund_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    payment_id UUID NOT NULL REFERENCES payments(payment_id) ON DELETE CASCADE,
    -- ON DELETE CASCADE: Refunds are tied to payments
    reservation_id UUID NOT NULL REFERENCES ticket_reservations(reservation_id) ON DELETE CASCADE,
    -- ON DELETE CASCADE: Refunds are tied to reservations
    amount NUMERIC(10,2) NOT NULL CHECK (amount >= 0),
    status TEXT NOT NULL CHECK (status IN ('pending', 'processed', 'failed')),
    requested_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    processed_at TIMESTAMPTZ,
    metadata JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. sales_data
CREATE TABLE sales_data (
    sales_data_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id UUID NOT NULL REFERENCES events(event_id) ON DELETE CASCADE,
    -- ON DELETE CASCADE: Sales data is tied to events
    total_tickets_sold INT NOT NULL DEFAULT 0 CHECK (total_tickets_sold >= 0),
    total_revenue NUMERIC(10,2) NOT NULL DEFAULT 0 CHECK (total_revenue >= 0),
    last_updated TIMESTAMPTZ DEFAULT NOW(),
    metadata JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 9. user_roles
CREATE TABLE user_roles (
    user_role_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    -- ON DELETE CASCADE: Roles are tied to users
    role TEXT NOT NULL,
    assigned_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for foreign keys
CREATE INDEX idx_ticket_types_event_id ON ticket_types(event_id);
CREATE INDEX idx_tickets_ticket_type_id ON tickets(ticket_type_id);
CREATE INDEX idx_tickets_reservation_id ON tickets(reservation_id);
CREATE INDEX idx_tickets_user_id ON tickets(user_id);
CREATE INDEX idx_ticket_reservations_event_id ON ticket_reservations(event_id);
CREATE INDEX idx_ticket_reservations_user_id ON ticket_reservations(user_id);
CREATE INDEX idx_ticket_reservations_ticket_type_id ON ticket_reservations(ticket_type_id);
CREATE INDEX idx_payments_reservation_id ON payments(reservation_id);
CREATE INDEX idx_refunds_payment_id ON refunds(payment_id);
CREATE INDEX idx_refunds_reservation_id ON refunds(reservation_id);
CREATE INDEX idx_sales_data_event_id ON sales_data(event_id);
CREATE INDEX idx_user_roles_user_id ON user_roles(user_id);

-- Indexes for search/filter criteria (from feature card Input fields)
CREATE INDEX idx_events_start_time ON events(start_time);
CREATE INDEX idx_events_end_time ON events(end_time);
CREATE INDEX idx_events_location ON events(location);
CREATE INDEX idx_events_category ON events(category);
CREATE INDEX idx_events_published ON events(published);
CREATE INDEX idx_ticket_types_price ON ticket_types(price);
CREATE INDEX idx_ticket_reservations_status ON ticket_reservations(status);
CREATE INDEX idx_tickets_status ON tickets(status);
CREATE INDEX idx_users_email ON users(email);

-- Indexes for unique business rules
-- Unique seat reservation for active status already enforced by unique_seat_event_active
-- Unique user email already enforced by UNIQUE constraint

-- Application-level invariants: Only published events are displayed, filtering, sorting, display logic, event visibility after review, activation after validation
-- Database-level invariant: Event start_time must not be in the past
ALTER TABLE events ADD CONSTRAINT check_event_start_time_future CHECK (start_time >= NOW());

-- Database-level invariant: Prevent double-booking (booking integrity)
CREATE UNIQUE INDEX unique_seat_event_active ON ticket_reservations (event_id, seat) WHERE status = 'active';
-- Application-level invariants: Reservation expiry, cancellation eligibility, refund reliability, prompt cancellation, notification

-- Database-level invariant: Pricing must be valid and non-negative
-- Already enforced by CHECK (price >= 0)

-- Database-level invariant: User data must be unique
-- Already enforced by email TEXT NOT NULL UNIQUE

-- Application-level invariants: Role assignment/update/removal must be valid and authorized, displayed roles must be accurate

-- Application-Level Invariants (not enforced by database):
-- Filtering, sorting, and display rules (event list, dashboard, export)
-- Real-time updates and notifications
-- Payment gateway validation and retry
-- Reservation expiry and cancellation eligibility
-- Refund processing time and eligibility
-- User access, deletion, and authorization
-- Event visibility and activation after review

-- Demo Data

-- Users
-- Demo users: passwords are hashed using bcrypt via pgcrypto's crypt()/gen_salt('bf')
-- Demo plaintext passwords: alice@example.com -> 'alicepass', bob@example.com -> 'bobpass', carol@example.com -> 'carolpass'
INSERT INTO users (user_id, email, password_hash, full_name, status, created_at, updated_at)
VALUES
    (gen_random_uuid(), 'alice@example.com', crypt('alicepass', gen_salt('bf')), 'Alice Smith', 'active', NOW(), NOW()),
    (gen_random_uuid(), 'bob@example.com', crypt('bobpass', gen_salt('bf')), 'Bob Johnson', 'active', NOW(), NOW()),
    (gen_random_uuid(), 'carol@example.com', crypt('carolpass', gen_salt('bf')), 'Carol Lee', 'deactivated', NOW(), NOW());

-- User Roles
INSERT INTO user_roles (user_role_id, user_id, role, assigned_at, created_at, updated_at)
SELECT gen_random_uuid(), user_id, 'organizer', NOW(), NOW(), NOW() FROM users WHERE email = 'alice@example.com';
INSERT INTO user_roles (user_role_id, user_id, role, assigned_at, created_at, updated_at)
SELECT gen_random_uuid(), user_id, 'customer', NOW(), NOW(), NOW() FROM users WHERE email = 'bob@example.com';

-- Events
INSERT INTO events (event_id, organizer_id, title, description, category, location, start_time, end_time, visibility, published, metadata, created_at, updated_at)
SELECT gen_random_uuid(), user_id, 'Spring Concert', 'Live music event', 'music', 'Budapest', NOW() + INTERVAL '7 days', NOW() + INTERVAL '7 days' + INTERVAL '2 hours', TRUE, TRUE, '{}', NOW(), NOW() FROM users WHERE email = 'alice@example.com';
INSERT INTO events (event_id, organizer_id, title, description, category, location, start_time, end_time, visibility, published, metadata, created_at, updated_at)
SELECT gen_random_uuid(), user_id, 'Tech Meetup', 'Networking for developers', 'technology', 'Debrecen', NOW() + INTERVAL '14 days', NOW() + INTERVAL '14 days' + INTERVAL '3 hours', TRUE, FALSE, '{}', NOW(), NOW() FROM users WHERE email = 'alice@example.com';

-- Ticket Types
INSERT INTO ticket_types (ticket_type_id, event_id, name, price, quantity, metadata, created_at, updated_at)
SELECT gen_random_uuid(), event_id, 'VIP', 15000, 10, '{}', NOW(), NOW() FROM events WHERE title = 'Spring Concert';
INSERT INTO ticket_types (ticket_type_id, event_id, name, price, quantity, metadata, created_at, updated_at)
SELECT gen_random_uuid(), event_id, 'General', 5000, 100, '{}', NOW(), NOW() FROM events WHERE title = 'Spring Concert';
INSERT INTO ticket_types (ticket_type_id, event_id, name, price, quantity, metadata, created_at, updated_at)
SELECT gen_random_uuid(), event_id, 'Standard', 3000, 50, '{}', NOW(), NOW() FROM events WHERE title = 'Tech Meetup';

-- Ticket Reservations
INSERT INTO ticket_reservations (reservation_id, event_id, user_id, ticket_type_id, seat, status, expires_at, metadata, created_at, updated_at)
SELECT gen_random_uuid(), e.event_id, u.user_id, t.ticket_type_id, 'A1', 'active', NOW() + INTERVAL '1 hour', '{}', NOW(), NOW()
FROM events e, users u, ticket_types t
WHERE e.title = 'Spring Concert' AND u.email = 'bob@example.com' AND t.name = 'VIP' AND t.event_id = e.event_id;
INSERT INTO ticket_reservations (reservation_id, event_id, user_id, ticket_type_id, seat, status, expires_at, metadata, created_at, updated_at)
SELECT gen_random_uuid(), e.event_id, u.user_id, t.ticket_type_id, 'B10', 'active', NOW() + INTERVAL '1 hour', '{}', NOW(), NOW()
FROM events e, users u, ticket_types t
WHERE e.title = 'Spring Concert' AND u.email = 'carol@example.com' AND t.name = 'General' AND t.event_id = e.event_id;

-- Tickets
INSERT INTO tickets (ticket_id, ticket_type_id, reservation_id, user_id, seat, status, issued_at, metadata, created_at, updated_at)
SELECT gen_random_uuid(), t.ticket_type_id, r.reservation_id, u.user_id, r.seat, 'issued', NOW(), '{}', NOW(), NOW()
FROM ticket_types t, ticket_reservations r, users u
WHERE t.name = 'VIP' AND r.seat = 'A1' AND u.email = 'bob@example.com' AND t.ticket_type_id = r.ticket_type_id;

-- Payments
INSERT INTO payments (payment_id, reservation_id, amount, status, method, gateway_response, processed_at, created_at, updated_at)
SELECT gen_random_uuid(), r.reservation_id, t.price, 'completed', 'card', '{}', NOW(), NOW(), NOW()
FROM ticket_reservations r, ticket_types t
WHERE r.seat = 'A1' AND t.ticket_type_id = r.ticket_type_id;

-- Refunds
INSERT INTO refunds (refund_id, payment_id, reservation_id, amount, status, requested_at, processed_at, metadata, created_at, updated_at)
SELECT gen_random_uuid(), p.payment_id, r.reservation_id, p.amount, 'processed', NOW(), NOW(), '{}', NOW(), NOW()
FROM payments p, ticket_reservations r
WHERE r.seat = 'A1' AND p.reservation_id = r.reservation_id;

-- Sales Data
INSERT INTO sales_data (sales_data_id, event_id, total_tickets_sold, total_revenue, last_updated, metadata, created_at, updated_at)
SELECT gen_random_uuid(), event_id, 1, 15000, NOW(), '{}', NOW(), NOW() FROM events WHERE title = 'Spring Concert';
INSERT INTO sales_data (sales_data_id, event_id, total_tickets_sold, total_revenue, last_updated, metadata, created_at, updated_at)
SELECT gen_random_uuid(), event_id, 0, 0, NOW(), '{}', NOW(), NOW() FROM events WHERE title = 'Tech Meetup';
