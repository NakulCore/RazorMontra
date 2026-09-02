# RPAY-POL-102: Velocity & Rate Limiting Mitigation Policy

## 1. Scope
Applies to real-time burst traffic, card cycling, and rapid automated payment submissions.

## 2. Velocity Triggers
- **10-Minute Velocity:** >= 4 transaction attempts from the same customer ID, device, or IP block within a 10-minute window.
- **60-Minute Velocity:** >= 7 transaction attempts in 1 hour.

## 3. Enforcement Guidelines
- When a velocity trigger fires in combination with failed authorization attempts, the transaction must be flagged (`FLAG`).
- When velocity >= 6 attempts in 10 minutes with repeated authorization failures, immediately escalate (`ESCALATE`) and temporarily rate-limit the client fingerprint.
