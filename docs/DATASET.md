# Dataset Generation & Methodology

## 1. Overview
The **AI Payment Risk Copilot** dataset consists of 12,000 synthetic transaction records modeling realistic consumer and business payment behaviors on the Razorpay platform. The dataset is explicitly partitioned into:
* **Training Set:** 8,400 records (70%)
* **Validation Set:** 1,800 records (15%)
* **Held-Out Test Set:** 1,800 records (15%)

Data splitting preserves chronological and user-independent integrity to strictly prevent test-set leakage.

---

## 2. Schema Specification

| Field Name | Type | Description |
| :--- | :--- | :--- |
| `transaction_id` | String | Unique transaction identifier |
| `merchant_id` | String | Identifier for the merchant receiving payment |
| `customer_id` | String | Unique identifier for the consumer account |
| `timestamp` | ISO-8601 | UTC timestamp of the transaction |
| `amount` | Float | Transaction value in INR |
| `currency` | String | Currency code (`INR`) |
| `payment_method` | String | `card`, `upi`, `netbanking`, `wallet` |
| `device_id` | String | Unique hardware/browser device fingerprint |
| `device_age` | Integer | Days since device was first seen for this customer |
| `ip_country` | String | Two-letter country code of the initiating IP |
| `customer_country` | String | Country of residence registered on customer account |
| `merchant_country` | String | Country of merchant incorporation |
| `previous_transaction_count` | Integer | Total lifetime successful transactions |
| `previous_failed_transactions` | Integer | Recent failed payment attempts (last 24 hours) |
| `transactions_last_10_minutes` | Integer | Velocity counter in 10-minute sliding window |
| `transactions_last_hour` | Integer | Velocity counter in 60-minute sliding window |
| `average_customer_amount` | Float | Baseline mean transaction value for this customer |
| `amount_deviation` | Float | Absolute relative difference `\|amt - avg\| / avg` |
| `new_device` | Boolean | True if device has never been seen for customer |
| `new_location` | Boolean | True if IP country is outside normal home territory |
| `chargeback_history` | Integer | Number of lifetime disputed transactions/chargebacks |
| `account_age` | Integer | Account age in days |
| `is_fraud` | Boolean | Ground truth label (True = Fraud, False = Legitimate) |
| `fraud_type` | String | Archetype classification (for auditing and evaluation) |

---

## 3. Fraud Archetypes & Realism

1. **Velocity Attack (`VELOCITY_ATTACK`):** Automated bot bursts attempting 4–12 transactions in under 10 minutes.
2. **High-Value Spike (`HIGH_VALUE_SPIKE`):** Sudden 3.5x–9.0x spike over customer baseline accompanied by high ticket amounts.
3. **Account Takeover (`NEW_DEVICE_TAKEOVER`):** Fraudulent credentials used on a new device with foreign IP and preceding auth/payment failures.
4. **Geo Anomaly (`GEO_ANOMALY_BOT`):** Offshore IP mismatching merchant and customer home locations.
5. **Card Testing Burst (`CARD_TESTING_BURST`):** Multiple micro-transaction failures followed by a high-value withdrawal attempt.
6. **Chargeback Recidivism (`CHARGEBACK_RECIDIVIST`):** Transactions originating from customer entities with repeated past chargeback disputes.
7. **Subtle Account Drain (`SUBTLE_ACCOUNT_DRAIN`):** Moderate transaction amounts with stealthy failure precursors on newly bound devices.

### Benign Edge-Case Handling
The dataset explicitly injects **benign outliers** (holiday gift shopping, legitimate device upgrades, international vacation travel) to prevent the ML model from developing simplistic or trivial decision boundaries.
