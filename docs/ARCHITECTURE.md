# Architecture & System Design — AI Payment Risk Copilot

## 1. Overview
The **AI Payment Risk Copilot** is an enterprise-grade fintech risk management platform designed for merchants and risk analysts on the Razorpay ecosystem. It continuously processes payment events through an autonomous, defense-in-depth pipeline combining machine learning, deterministic rule gates, grounded explainability, retrieval-augmented policy compliance (RAG), bounded decision intelligence, and safe payment actions.

---

## 2. End-to-End Pipeline Workflow

```
                        ┌───────────────────────────────┐
                        │      Incoming Transaction     │
                        │   (Amount, Device, IP, Geo,   │
                        │      Velocity, History)       │
                        └──────────────┬────────────────┘
                                       │
                                       ▼
                        ┌───────────────────────────────┐
                        │     Feature Extraction &      │
                        │      Enrichment Engine        │
                        └──────────────┬────────────────┘
                                       │
                ┌──────────────────────┴──────────────────────┐
                ▼                                             ▼
 ┌───────────────────────────────┐             ┌───────────────────────────────┐
 │       ML Risk Engine          │             │     Deterministic Rule Engine │
 │  (Gradient Boosted Ensemble,  │             │   (Hard Velocity, Geo Mismatch│
 │  Calibrated Probabilities,    │             │    High Amount, Device Change,│
 │    Feature Contributions)     │             │     Prior Chargeback Limits)  │
 └──────────────┬────────────────┘             └──────────────┬────────────────┘
                │                                             │
                └──────────────────────┬──────────────────────┘
                                       │
                                       ▼
                        ┌───────────────────────────────┐
                        │   Grounded Explainability     │
                        │  (Empirical feature deltas &  │
                        │   SHAP-style risk breakdown)  │
                        └──────────────┬────────────────┘
                                       │
                                       ▼
                        ┌───────────────────────────────┐
                        │    RAG Policy Knowledge Base  │
                        │  (Vector similarity search    │
                        │   over Razorpay Risk Policies)│
                        └──────────────┬────────────────┘
                                       │
                                       ▼
                        ┌───────────────────────────────┐
                        │    AI Investigation Agent     │
                        │ (Context Synthesis & Anomaly  │
                        │   Identification w/ Fallback) │
                        └──────────────┬────────────────┘
                                       │
                                       ▼
                        ┌───────────────────────────────┐
                        │    Bounded Decision Agent     │
                        │  Guardrails: APPROVE | VERIFY │
                        │        FLAG | ESCALATE        │
                        └──────────────┬────────────────┘
                                       │
                                       ▼
                        ┌───────────────────────────────┐
                        │          Action Engine        │
                        │ (Idempotent Mock / Razorpay   │
                        │      Provider Interface)      │
                        └──────────────┬────────────────┘
                                       │
                                       ▼
                        ┌───────────────────────────────┐
                        │   Immutable Audit Ledger      │
                        │ (Cryptographic Hash / Trace ID│
                        │    Complete Pipeline History) │
                        └──────────────┬────────────────┘
                                       │
                                       ▼
                        ┌───────────────────────────────┐
                        │    Merchant Cockpit & UI      │
                        │ (Interactive Alerts, Metrics, │
                        │  Explainability, Demo Scenarios)
                        └───────────────────────────────┘
```

---

## 3. Core Component Architecture

### A. Feature Extraction & Enrichment
* **Inputs:** Transaction payload (amount, customer, merchant, device ID, IP, billing address, timestamp).
* **Enrichment:** Calculates real-time temporal velocity (last 10 mins, last 1 hour), customer historical average deviation, device novelty, geo-location discrepancy, and previous chargeback frequency.
* **Vectorized Processing:** Sub-millisecond calculation suitable for low-latency payment processing loops.

### B. Machine Learning Risk Engine
* **Algorithm:** High-performance Gradient Boosting Classifier with calibrated probability estimation.
* **Outputs:** 
  * `risk_score` (0–100 integer)
  * `risk_probability` (0.00–1.00 float)
  * `risk_class` (`LOW`, `MEDIUM`, `HIGH`, `CRITICAL`)
  * `risk_factors` (Feature-grounded attribution list)
  * `model_version` (Semantic version string)
* **Performance Targets:** High ROC-AUC, optimized Precision-Recall tradeoff minimizing false positives for high-trust merchants while catching coordinated fraud bursts.

### C. Deterministic Rule Engine
Operates alongside ML to enforce regulatory, compliance, and strict operational bounds:
* `RULE_HIGH_VELOCITY`: > 5 transactions in 10 minutes from single device/customer.
* `RULE_EXTREME_AMOUNT`: Transaction > 5x customer historical average.
* `RULE_LOCATION_MISMATCH`: IP country != Customer country != Merchant country without prior international history.
* `RULE_NEW_DEVICE_HIGH_VALUE`: Unknown device with transaction > $500.
* `RULE_REPEATED_FAILURES`: > 3 failed transactions in previous 1 hour.
* `RULE_CHARGEBACK_HISTORY`: Customer flagged with prior chargeback disputes.

### D. Grounded Explainability
* Eliminates LLM hallucination by computing exact numerical feature contributions against baseline distributions.
* Maps feature anomalies directly to verifiable operational statements.

### E. RAG Policy Knowledge Store
* Ingests fintech risk policies (e.g., *Razorpay Merchant Risk Protocol 3.2*, *High-Velocity Anomaly Policy*, *International Card Verification Standard*, *2FA Step-up Verification Requirements*).
* Hybrid lexical + dense semantic retrieval returning top-k matching policy clauses with relevance scores and clause IDs.

### F. AI Investigation & Bounded Decision Agents
* **Investigation Agent:** Ingests the enriched transaction, ML outputs, rule triggers, customer history, and retrieved policy clauses. Produces a structured JSON risk synthesis with strict Pydantic validation.
* **Decision Agent:** Bounded strictly to 4 deterministic state actions (`APPROVE`, `VERIFY`, `FLAG`, `ESCALATE`).
* **Failsafe Degradation:** If LLM inference is disabled or times out, the deterministic safety engine executes rule-based gating seamlessly without halting the transaction flow.

### G. Action Engine & Provider Abstraction
* **`PaymentProvider` Interface:**
  * `approve_transaction(tx_id)`
  * `request_stepup_verification(tx_id, method)`
  * `flag_for_review(tx_id, reason)`
  * `escalate_and_block(tx_id, reason)`
* **Implementations:** `MockPaymentProvider` (default for hackathon demo) and `RazorpayPaymentProvider` (for live/test API keys). All operations are idempotent.

### H. Audit Trail System
* Every transaction analysis persists an immutable audit snapshot with timestamp, model version, raw features, rule firings, retrieved policy IDs, agent synthesis, final decision, and provider response.

---

## 4. Technology Stack

| Layer | Technologies |
| :--- | :--- |
| **Backend API** | Python 3.11+, FastAPI, Pydantic v2, Uvicorn |
| **Machine Learning** | scikit-learn, pandas, numpy, joblib |
| **Data & Storage** | SQLite (zero-config local) / PostgreSQL, SQLAlchemy, aiosqlite |
| **RAG & Vector Search** | In-memory semantic vector index with TF-IDF/cosine similarity + embeddings fallback |
| **Frontend UI** | React 18, TypeScript, Tailwind CSS, Lucide Icons, Vite |
| **Testing** | pytest, httpx, coverage |
| **DevOps & Containers** | Docker, Docker Compose, Bash scripts |
