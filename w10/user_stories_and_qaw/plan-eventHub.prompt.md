# EventHub Architectural Decision Plan

## 1. Quality Attribute Scenarios

Concrete, testable scenarios for EventHub:

- US-02: Prevent double-booking (Performance/Security)
  - During normal operation, two customers attempt to purchase the same seat simultaneously. The booking service allows only one purchase, prevents double-booking, and provides clear feedback within 2 seconds. 100% of seats are sold only once.
- US-02: Payment gateway fails, hold/resume (Availability/Performance)
  - During normal operation, the payment gateway is slow or fails. The payment and booking services retry payment, hold reservation, and notify user of status. 99% of users receive a status update within 5 seconds; no orphaned payments.
- US-07: Block unauthorized admin access (Security/Availability)
  - During normal operation or under attack, a malicious actor attempts unauthorized access to admin functions. The access control/authentication service blocks access, logs attempt, and alerts admin. 100% of unauthorized attempts blocked and logged within 1 second.
- US-06: Real-time sales data (Performance/Availability/Testability)
  - Organizers request real-time sales data during high-traffic events. The sales analytics/dashboard service provides up-to-date sales data. 99% of dashboard updates within 5 seconds; data accuracy verified by automated tests.
- US-04: Refund reliability (Availability/Performance)
  - Customer requests refund, but refund process fails or is delayed. The refund/payment service retries refund, notifies user of status, and escalates if needed. 99% of refunds processed within 24 hours; user notified of any delay.
- US-08: Scalability under peak load (Performance/Scalability)
  - Multiple admins run complex analytics queries during peak usage. The analytics service maintains acceptable performance for all users. 95% of queries complete in under 10 seconds.

## 2. Decision Matrix Criteria & Weights

| Criterion                        | Weight | Why it matters?                                                                                  |
|-----------------------------------|--------|--------------------------------------------------------------------------------------------------|
| Concurrency & booking integrity   | 30     | Prevents double-selling tickets; core to business trust and reliability.                        |
| Payment failure resilience        | 20     | Ensures users are not charged without tickets; critical for financial and legal safety.          |
| Security & access control         | 20     | Protects admin functions and sensitive data; prevents catastrophic breaches.                     |
| Real-time data performance        | 10     | Enables timely sales and analytics for organizers; supports business decisions.                  |
| Refund reliability                | 10     | Maintains customer trust by ensuring refunds are processed correctly and promptly.               |
| Scalability under peak load       | 10     | Supports high traffic during flash sales or popular events without degrading performance.        |

## 3. Frontend Frameworks

| Framework | Weighted Total |
|-----------|---------------|
| Angular (*)| 470           |
| React     | 450           |
| Vue.js    | 310           |
| Svelte    | 290           |

## 4. Backend Frameworks

| Framework         | Weighted Total |
|-------------------|---------------|
| Spring Boot       | 480           |
| Node.js (*)       | 420           |
| Go                | 400           |
| Django            | 380           |

## 5. Database Options

| Database         | Weighted Total |
|------------------|---------------|
| Aurora           | 500           |
| PostgreSQL (*)   | 480           |
| MySQL            | 380           |
| MongoDB          | 360           |

## 6. Summary

- Architectural drivers: booking integrity, payment resilience, security
- Final choices: Angular (frontend), Node.js (backend), PostgreSQL (database)
- Criteria and weights reflect EventHub's business priorities and technical risks
- Decision matrix provides transparent, justifiable technology selection
