# RPAY-POL-105: Step-Up Authentication & Verification Protocol

## 1. Scope
Defines when passive friction-free checkout must be upgraded to active customer challenge.

## 2. Trigger Conditions
- Risk score in Medium Risk band (40 to 74).
- First time payment using newly saved payment instrument.
- Minor location deviation (domestic roaming).

## 3. Protocol
- Dispatch asynchronous OTP / 3DS challenge token (`request_verification`).
- Merchant checkout holds session for 120 seconds awaiting verified callback.
- On challenge pass, transaction state transitions to `APPROVE`. On challenge failure or timeout, transition to `FLAG`.
