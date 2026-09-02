# RPAY-POL-101: High-Value Transaction Review Protocol

## 1. Scope and Objective
This policy governs risk management procedures for high-value and anomalous ticket-size payment requests processed through the Razorpay Payment Gateway.

## 2. Policy Thresholds
- **Absolute Value Threshold:** Any transaction exceeding INR 50,000.00 is designated as a High-Value Transaction (HVT).
- **Deviation Threshold:** Any transaction exceeding 3.5x of the customer's historical 90-day moving average must trigger an automated risk assessment.

## 3. Mandatory Actions
1. If the ML Risk Score is between 40 and 74, enforce mandatory Step-Up Authentication (OTP/3DS 2.0).
2. If the ML Risk Score is >= 75 and multiple anomalous factors are present (e.g., new device + foreign IP), the transaction must be flagged (`FLAG`) or escalated (`ESCALATE`) for manual risk analyst review.
3. Transactions exceeding INR 100,000.00 from newly registered accounts (< 7 days old) must not be auto-approved without secondary KYC verification.
