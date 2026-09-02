# API Reference — AI Payment Risk Copilot

## Base URL
`http://localhost:8000/api/v1`

Interactive Swagger OpenAPI UI: `http://localhost:8000/docs`
Redoc Documentation: `http://localhost:8000/redoc`

---

## Endpoints

### 1. Risk Analysis & Pipeline

#### `POST /risk/analyze`
Executes the full defense-in-depth risk pipeline: Feature Extraction → ML Risk Inference → Rule Engine → RAG Policy Retrieval → AI Investigation Agent → Bounded Decision Agent → Safe Action Execution → Immutable Audit Ledger.

**Query Parameters:**
* `auto_execute` (bool, default `true`): Dispatch safe payment provider action immediately.

**Request Body:**
```json
{
  "merchant_id": "merch_0088",
  "customer_id": "cust_00109",
  "amount": 65000.0,
  "currency": "INR",
  "payment_method": "card",
  "device_id": "dev_unknown_7781a",
  "device_age": 1,
  "ip_country": "IN",
  "customer_country": "IN",
  "merchant_country": "IN",
  "previous_transaction_count": 12,
  "previous_failed_transactions": 1,
  "transactions_last_10_minutes": 1,
  "transactions_last_hour": 1,
  "average_customer_amount": 8000.0,
  "amount_deviation": 7.12,
  "new_device": true,
  "new_location": false,
  "chargeback_history": 0,
  "account_age": 120
}
```

**Response (200 OK):**
```json
{
  "transaction": {
    "transaction_id": "txn_8b71d9a01f",
    "merchant_id": "merch_0088",
    "customer_id": "cust_00109",
    "timestamp": "2026-09-02T09:12:00Z",
    "amount": 65000.0,
    "currency": "INR",
    "payment_method": "card",
    "device_id": "dev_unknown_7781a",
    "device_age": 1,
    "ip_country": "IN",
    "customer_country": "IN",
    "merchant_country": "IN",
    "previous_transaction_count": 12,
    "previous_failed_transactions": 1,
    "transactions_last_10_minutes": 1,
    "transactions_last_hour": 1,
    "average_customer_amount": 8000.0,
    "amount_deviation": 7.12,
    "new_device": true,
    "new_location": false,
    "chargeback_history": 0,
    "account_age": 120,
    "is_fraud": null
  },
  "ml_result": {
    "risk_score": 88,
    "risk_probability": 0.884,
    "risk_class": "HIGH",
    "risk_factors": [
      "Transaction amount (₹65,000.00) is 8.1x customer's historical average (₹8,000.00)",
      "Unrecognized device fingerprint (Device ID: dev_unknown_7781a)"
    ],
    "feature_contributions": [...],
    "model_version": "rf_gb_ensemble_v1.0"
  },
  "rule_results": [
    {
      "rule": "RULE_HIGH_AMOUNT",
      "triggered": true,
      "severity": "HIGH",
      "reason": "Transaction value ₹65,000.00 exceeds threshold (8.1x customer average).",
      "risk_points": 25
    },
    {
      "rule": "RULE_NEW_DEVICE",
      "triggered": true,
      "severity": "MEDIUM",
      "reason": "First-time device access detected (Device age: 1 days).",
      "risk_points": 15
    }
  ],
  "rules_triggered_count": 2,
  "retrieved_policies": [
    {
      "policy_id": "RPAY-POL-101",
      "title": "High-Value Transaction Review Protocol",
      "category": "TRANSACTION_LIMITS",
      "text": "Transactions exceeding INR 50,000 or >3.5x customer historical average...",
      "relevance_score": 0.92
    },
    {
      "policy_id": "RPAY-POL-103",
      "title": "New Device Fingerprint & Account Takeover Prevention",
      "category": "DEVICE_SECURITY",
      "text": "Device age <= 3 days on established account requires step-up 2FA...",
      "relevance_score": 0.88
    }
  ],
  "investigation": {
    "summary": "Transaction flagged with elevated risk (HIGH class, Score: 88/100). Gated rule violations detected: [HIGH_AMOUNT, NEW_DEVICE].",
    "risk_factors": [...],
    "missing_information": [
      "Device hardware IMEI/Biometric token confirmation",
      "PAN/GSTIN high-value transaction tax declaration"
    ],
    "recommended_next_step": "Enforce mandatory 3DS / OTP step-up verification challenge on the cardholder.",
    "confidence": 0.92,
    "agent_status": "SUCCESS"
  },
  "decision": {
    "decision": "FLAG",
    "reason": "Elevated fraud probability (Score: 88/100). Flagged for asynchronous analyst review under RPAY-POL-101.",
    "policy_ids": ["RPAY-POL-101", "RPAY-POL-103"],
    "risk_score": 88,
    "confidence": 0.92,
    "safeguard_applied": false
  },
  "action": {
    "action_id": "act_flg_3910ab",
    "transaction_id": "txn_8b71d9a01f",
    "action": "flag",
    "status": "FLAGGED_IN_QUEUE",
    "message": "Transaction placed on 24h compliance review queue.",
    "timestamp": "2026-09-02T09:12:01Z",
    "provider": "MockPaymentSandbox"
  },
  "audit_id": "aud_7719d284a0c1",
  "timestamp": "2026-09-02T09:12:01Z"
}
```

---

### 2. Live Transactions

* `GET /transactions?limit=50&offset=0&is_fraud_only=false` — List ingested transactions.
* `GET /transactions/{transaction_id}` — Fetch specific transaction by ID.
* `POST /transactions` — Ingest transaction and run analysis.

---

### 3. Policies & Knowledge Base

* `GET /policies` — List all active Razorpay compliance policies.
* `POST /policies/search` — Search policy store with semantic query string.

---

### 4. Metrics & Evaluation

* `GET /metrics` — Get system KPIs, precision, recall, F1, and financial protected amount.

---

### 5. Audit Ledger

* `GET /audit?limit=50` — List immutable risk decision audit entries.
* `GET /audit/{transaction_id}` — Get cryptographic trace for a single transaction.

---

### 6. Interactive Demo & Simulator

* `GET /demo/scenarios` — Retrieve all 7 pre-engineered fraud and benign demo scenarios.
* `POST /demo/seed?count=50` — Seed live transactions through the pipeline.
