# RPAY-POL-106: Chargeback Mitigation & Recidivist Handling

## 1. Objective
Protect merchants from card network dispute thresholds (Visa VFMP / Mastercard ECP programs).

## 2. Customer Dispute History
- Accounts with 1 historical chargeback: Enforce mandatory 3DS verification (`VERIFY`) on all transactions regardless of amount.
- Accounts with >= 2 historical chargebacks: Transactions above INR 5,000 must be immediately flagged (`FLAG`) or escalated (`ESCALATE`).

---

# RPAY-POL-107: High-Risk Escalation & Account Quarantine Protocol

## 1. Objective
Standard operating procedures for imminent fraud threats, credential dumps, and multi-signal attacks.

## 2. Escalation Criteria
- Risk Score >= 90 (Critical).
- Co-occurrence of 3 or more high-severity rule violations.
- Extreme velocity (> 8 txns in 10 minutes) with repeated failed payments.

## 3. Mandatory Actions
- Immediate execution of `escalate` action to halt settlement.
- Dispatch webhook to merchant security desk.
- Add device fingerprint and IP hash to temporary 24-hour quarantine watchlist.

---

# RPAY-POL-108: Card Testing & Botnet Defense Policy

## 1. Objective
Mitigate automated card testing scripts (enumeration of CVV/expiry dates through micro-authorizations).

## 2. Detection Patterns
- Rapid sequence of low-value attempts (< INR 200) followed by a high-value payment attempt.
- More than 3 failed CVV/PIN errors within a 15-minute sliding window.

## 3. Action
- Block current transaction session and enforce `FLAG` / `ESCALATE` action.
