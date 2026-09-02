# RPAY-POL-104: Geographic Anomalies & Cross-Border Compliance

## 1. Scope
Governs IP geolocation discrepancies, proxy/VPN usage, and foreign card issuance rules.

## 2. Geo Mismatch Criteria
- Initiating IP Country differs from Customer Home Country and Merchant Country.
- High-risk transit routes or TOR exit nodes.

## 3. Policy Execution
- If IP country is foreign but amount is small (< INR 2,000) and customer has international transaction history, request verification (`VERIFY`).
- If cross-border transaction value exceeds INR 20,000 without prior international history, escalate (`ESCALATE`) or flag (`FLAG`) to avoid cross-border chargebacks and AML non-compliance.
