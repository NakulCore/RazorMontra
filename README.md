# 🛡️ AI Payment Risk Copilot — Razorpay AI Buildathon Submission

> **Autonomous multi-layered payment risk investigation, policy compliance, and safe decision intelligence for merchants on Razorpay.**

[![Build Status](https://img.shields.io/badge/build-passing-brightgreen.svg)](https://github.com)
[![Python 3.11+](https://img.shields.io/badge/python-3.11+-blue.svg)](https://python.org)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.115+-009688.svg)](https://fastapi.tiangolo.com)
[![React 18](https://img.shields.io/badge/React-18.3-61DAFB.svg)](https://react.dev)
[![Tailwind CSS](https://img.shields.io/badge/TailwindCSS-3.4-38B2AC.svg)](https://tailwindcss.com)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

---

## 📌 Executive Summary

Modern fintech payment platforms face sophisticated fraud threats: automated bot bursts, credential stuffing takeovers, cross-border proxy anomalies, and chargeback abuse. Traditional rules alone are brittle, while raw black-box LLMs risk hallucinating facts and executing unbounded actions.

**AI Payment Risk Copilot** implements a **defense-in-depth architecture** specifically engineered for the **AI Risk Manager** track:

```
TRANSACTION PAYLOAD
        │
        ▼
FEATURE EXTRACTION & ENRICHMENT (Temporal Velocity, Baseline Deviation, Device Novelty)
        │
        ├──► ML RISK MODEL (Random Forest Ensemble, 99.1% F1, 100.0% ROC-AUC)
        │
        ├──► DETERMINISTIC RULE ENGINE (7 Configurable Safety Gates: High Amount, Velocity, Geo, Device)
        │
        ├──► GROUNDED EXPLAINABILITY (Empirical feature contribution attribution)
        │
        ├──► RAG POLICY KNOWLEDGE BASE (TF-IDF Vector Index over Razorpay Risk Protocols)
        │
        ├──► AI INVESTIGATION AGENT (Context synthesis, missing KYC identification, deterministic fallback)
        │
        ├──► BOUNDED DECISION ENGINE (Restricted to APPROVE | VERIFY | FLAG | ESCALATE with safety overrides)
        │
        ├──► SAFE ACTION ENGINE (Idempotent execution via Mock Sandbox / Razorpay Test API)
        │
        └──► IMMUTABLE AUDIT LEDGER (Cryptographic trace snapshot of entire pipeline)
```

---

## 🏆 Key Highlights & Genuine Evaluation Results

All metrics are measured directly on an unseen **1,800-transaction held-out test split** (12,000 total dataset records):

| Metric | Score | Impact |
| :--- | :--- | :--- |
| **Precision** | **98.84%** | Minimizes merchant customer friction (False Positive Rate < 0.12%) |
| **Recall (Sensitivity)** | **99.42%** | Intercepts 99.42% of all fraudulent transactions |
| **F1-Score** | **99.13%** | High harmonic balance across classes |
| **ROC-AUC** | **1.0000** | Discriminative separation across 7 fraud archetypes |
| **Net Money Protected** | **₹1,299,107.17** | Total fraud value intercepted minus friction review costs |

---

## 📸 Final Build UI & System Walkthrough

Explore the key interfaces and capabilities of the RazorMontra AI Payment Risk Copilot:

### 1. Merchant Cockpit & Executive Dashboard
![RazorMontra Dashboard](docs/images/dashboard.png)
* **Real-time Portfolio Health:** Continuous telemetry tracking 12,000+ transactions, 115 high-risk interceptions, review queue volume, and **₹12,99,107** in protected capital with a **+99.2% Net Recovery ROI**.
* **Visual Defense Pipeline:** High-level pipeline stage tracking from transaction ingest to ML ensemble inference, deterministic rules, RAG retrieval, and bounded action dispatch.
* **Held-Out Model KPIs:** Instant visibility into empirical validation metrics (98.8% Precision, 99.4% Recall, 99.1% F1, 100% ROC-AUC).

---

### 2. Active Risk Alerts & Slide-Out Investigation Console
![Risk Alerts & Investigation Console](docs/images/risk-investigation-console.png)
* **Triage Alert Queue:** Dedicated queue grouping intercepted transactions by severity (`CRITICAL`, `HIGH`, `MEDIUM`) with instant signal badges (New Device, Velocity Burst, Geo Mismatch).
* **Deep-Dive Investigation Console:** Slide-over analyst console presenting:
  - **Calibrated ML Risk Score Gauge:** Real-time risk scoring and calibrated fraud probability (`Score: 87/100`, `86.7% fraud probability`).
  - **AI Risk Investigator Synthesis:** Grounded synthesis citing empirical deviations, failed authorization history, and specific rule violations without hallucination.
  - **Bounded Decision & Override Actions:** Autonomous decision recommendations (`ESCALATE` with 96% confidence) with one-click analyst actions (`Approve`, `Verify`, `Flag`, `Escalate`).

---

### 3. Interactive 7-Archetype Demo Simulator
![Interactive Demo Simulator](docs/images/demo-simulator.png)
* **Reproducible Test Scenarios:** Built-in simulator covering all key fraud archetypes:
  - `NORMAL_PAYMENT`: Frictionless ₹1,250 routine UPI groceries payment (`LOW RISK` → `APPROVE`).
  - `HIGH_VALUE_ANOMALY`: Sudden ₹65,000 transaction (8.1x baseline) from unrecognized device (`MEDIUM RISK` → `FLAG`).
  - `VELOCITY_ATTACK`: 8 rapid card attempts in 10 minutes from bot burst (`CRITICAL` → `ESCALATE`).
  - `NEW_DEVICE_TAKEOVER`: Foreign proxy IP + first-time device binding (`HIGH RISK` → `ESCALATE`).
  - `LOCATION_ANOMALY`: Offshore Romanian IP with unknown device and prior failures (`HIGH RISK` → `ESCALATE`).
  - `MULTI_SIGNAL_FRAUD`: Compound high-ticket burst with chargeback history (`HIGH RISK` → `ESCALATE`).
  - `FALSE_POSITIVE`: Singapore hotel booking by established customer with trusted device (`LOW RISK` → `APPROVE`).
* **Live Telemetry Seeder:** One-click button to seed 50 live transactions through the end-to-end pipeline.

---

### 4. 9-Stage Autonomous Risk Pipeline Execution
![Autonomous Risk Pipeline Modal](docs/images/autonomous-risk-pipeline.png)
* **Multi-Layer Defense in Motion:** Interactive pipeline modal showing millisecond-by-millisecond progression through 9 deterministic and AI stages:
  1. `TRANSACTION INGEST` — Schema and cryptographic signature verification.
  2. `FEATURE EXTRACTION` — Baseline ratio calculation, device novelty, and velocity windowing.
  3. `ML RISK MODEL` — Random Forest inference and calibrated probability scoring.
  4. `SAFETY RULES` — Enforcement of 7 deterministic compliance gates.
  5. `RAG RETRIEVAL` — Vector search over Razorpay compliance policies.
  6. `AI INVESTIGATION` — Context synthesis and missing KYC detection.
  7. `BOUNDED DECISION` — Strict safety override bounds.
  8. `SANDBOX ACTION` — Idempotent dispatch to payment provider sandbox.
  9. `AUDIT LOGGED` — Immutable cryptographic ledger entry generation.

---

### 5. Live Payment Stream & Real-Time Ingestion
![Live Payment Stream](docs/images/live-transactions.png)
* **Continuous Ingestion Telemetry:** High-throughput streaming view of incoming merchant transactions with real-time risk scores, decision verdicts, and key anomaly tags.
* **Instant Actionability:** One-click `Investigate →` launcher for any individual transaction.

---

### 6. Empirical ML Model Evaluation & Financial Impact
![Model Evaluation & Financial ROI](docs/images/model-evaluation.png)
* **Held-Out Test Set Metrics:** Genuine evaluation on 1,800 unseen test samples:
  - **Precision:** 98.84% (False Positive Rate: 0.12%)
  - **Recall:** 99.42% (Intercepts 99.4% of all fraud attacks)
  - **F1-Score:** 99.13% | **ROC-AUC:** 100.00% | **Accuracy:** 99.83%
* **Confusion Matrix & ROI Accounting:** Full confusion matrix (1,626 True Negatives, 171 True Positives, 2 False Positives, 1 False Negative) coupled with actual financial metrics:
  - Gross fraud exposure: ₹13,14,242
  - Intercepted fraud value: **₹12,99,407**
  - Customer friction review cost: -₹300 (only 2 reviews required)
  - **Net Recovery Rate: 99.2%**

---

### 7. Vectorized RAG Policy Knowledge Base
![RAG Policy Knowledge Base](docs/images/rag-policies.png)
* **Context-Grounded Policy Retrieval:** TF-IDF vector index searching over indexed Razorpay compliance and dispute mitigation protocols.
* **Semantic Querying:** Real-time search engine matching user queries and anomalous transaction patterns against relevant policy clauses (Transaction Limits, Velocity Control, Device Security, Geo Compliance, Auth Standards, Dispute Risk, Emergency Escalation).

---

### 8. Immutable Risk Decision Ledger with Interactive Audit Inspection
![Immutable Risk Decision Ledger](docs/images/audit-ledger.png)
* **Cryptographic Traceability:** Full tamper-evident audit ledger capturing every automated decision, policy citation, and provider action dispatch.
* **Interactive Decision Slicing:** Real-time filter pills (`ALL`, `ESCALATE`, `FLAG`, `VERIFY`, `APPROVE`) with dynamic record counts.
* **One-Click Decision Inspector (`Inspect ↗`):** Detailed modal showing rule gate trip points, cited Razorpay policy clauses, and a direct link to launch the live investigation console.

---

## 🚀 Quick Start (Local Development)

### 1. Prerequisites
* Python 3.11+
* Node.js 18+ (with `pnpm` or `npm`)
* Git

### 2. Turnkey One-Click Launch
```bash
git clone <repo-url>
cd linu-test
./start.sh
```
This automatically initializes the virtual environment, generates the 12,000+ transaction dataset, trains the ML ensemble, builds the React frontend, and launches the FastAPI server.

* **Merchant Cockpit Dashboard:** `http://localhost:8000`
* **Interactive Swagger API Docs:** `http://localhost:8000/docs`
* **ReDoc API Reference:** `http://localhost:8000/redoc`

---

## 🐳 Docker Deployment

Run the complete frontend, backend, database, and RAG knowledge store with a single command:

```bash
docker compose up --build
```
* **Frontend UI:** `http://localhost:3000` (or `http://localhost:8000`)
* **Backend API:** `http://localhost:8000/api/v1`

---

## 🧪 Running Automated Tests

Run the complete test suite covering dataset generation, feature extraction, ML inference, rule engine triggers, RAG retrieval, agent bounds, action idempotency, failure fallbacks, and E2E pipeline:

```bash
source .venv/bin/activate
PYTHONPATH=. pytest backend/tests/ -v
```

---

## 📂 Project Architecture & Codebase Map

```
.
├── backend/
│   ├── app/
│   │   ├── api/
│   │   │   └── endpoints.py          # Complete FastAPI REST API endpoints
│   │   ├── core/
│   │   │   ├── config.py             # Environment configuration & paths
│   │   │   └── database.py           # SQLAlchemy 2.0 async engine & sessions
│   │   ├── models/
│   │   │   ├── schemas.py            # Pydantic v2 data contracts & schemas
│   │   │   └── db_models.py          # SQLAlchemy ORM database models
│   │   ├── services/
│   │   │   ├── generator.py          # 12,000+ realistic synthetic transactions & 7 fraud archetypes
│   │   │   ├── feature_engine.py     # Reusable feature engineering & normalization
│   │   │   ├── ml_engine.py          # Random Forest ML model, training, inference & explainability
│   │   │   ├── rule_engine.py        # Deterministic risk rules & configurable thresholds
│   │   │   ├── rag_engine.py         # TF-IDF vector index over Razorpay compliance policies
│   │   │   ├── investigation_agent.py# Structured AI risk investigator with deterministic fallback
│   │   │   ├── decision_agent.py     # Bounded decision maker (APPROVE, VERIFY, FLAG, ESCALATE)
│   │   │   ├── razorpay_provider.py  # PaymentProvider abstraction (Mock Sandbox & Razorpay Test API)
│   │   │   ├── action_engine.py      # Idempotent action dispatcher
│   │   │   ├── audit_service.py      # Immutable audit trail recorder
│   │   │   └── pipeline.py           # Unified risk analysis orchestrator
│   │   └── main.py                   # FastAPI application entry point & static SPA mount
│   ├── tests/                        # 13 comprehensive unit, failure & E2E integration tests
│   └── requirements.txt              # Backend dependencies
├── frontend/
│   ├── src/
│   │   ├── components/               # Header, Sidebar, MetricsCards, InvestigationDrawer
│   │   ├── pages/                    # Dashboard, Transactions, Demo Simulator, Policies, Metrics, Audit
│   │   ├── services/                 # API client service
│   │   ├── types.ts                  # TypeScript data interfaces
│   │   └── App.tsx                   # Main SPA container
│   ├── package.json
│   └── vite.config.ts
├── policies/                         # Realistic Markdown compliance policies for RAG
├── docs/
│   ├── ARCHITECTURE.md               # Detailed system design & component diagrams
│   ├── DATASET.md                    # Dataset schema, fraud patterns & methodology
│   ├── EVALUATION.md                 # Real model performance metrics & financial calculations
│   ├── API.md                        # Complete REST API reference with JSON payloads
│   └── DEMO.md                       # 5-minute evaluator walk-through script
├── docker-compose.yml
├── Dockerfile.backend
├── Dockerfile.frontend
├── .env.example
└── start.sh
```

---

## 🎯 5-Minute Evaluator Demo Workflow

1. **Dashboard Overview:** Open `http://localhost:8000` to review overall metrics, live alerts, and system health.
2. **Demo Simulator:** Navigate to **Demo Simulator** and click **Simulate & Investigate** on:
   * **`VELOCITY_ATTACK`**: Simulates 8 rapid attempts in 10 minutes with preceding failures → trips `RULE_HIGH_VELOCITY` → cites `RPAY-POL-102` → triggers `ESCALATE` action.
   * **`FALSE_POSITIVE`**: Simulates an established customer on a Singapore vacation → recognizes low velocity and trusted device → assigns Low Risk → auto-approves.
3. **Investigation Deep-Dive:** Click any transaction to open the slide-out **Investigation Drawer** to inspect feature deltas, rule triggers, RAG policy matches, AI reasoning, and audit trace.
4. **RAG Explorer:** Query the semantic policy store under **RAG Policies** (e.g., search *"cross-border verification"*).
5. **Model Evaluation Cockpit:** Review candidate model comparisons (Logistic Regression vs Random Forest vs HistGradientBoosting) and financial ROI under **Model Evaluation**.

---

## 🔒 Security & Safe Operating Boundaries

* **No Hardcoded Secrets:** All secrets, keys, and thresholds are managed via `.env` / environment variables.
* **Bounded Agent Decisions:** The decision agent is strictly restricted to `APPROVE`, `VERIFY`, `FLAG`, and `ESCALATE`. It has no ability to execute arbitrary commands.
* **Deterministic Safety Overrides:** If the ML risk score is >= 60 or Critical rules are tripped, the system prohibits automated approvals regardless of LLM output.
* **Idempotent Actions:** Every action execution generates an idempotency key preventing duplicate charges or duplicate blocks.
* **Failsafe Degradation:** If external LLMs or vector databases are unreachable, the deterministic fallback engine continues processing transactions with 100% uptime.

---

## 💳 Razorpay Test Mode Configuration

To test with real Razorpay Test API credentials:
1. Create a Razorpay account and generate API Keys from the Razorpay Dashboard (Test Mode).
2. Set the following in your `.env` file:
   ```env
   PAYMENT_PROVIDER=razorpay
   RAZORPAY_KEY_ID=rzp_test_your_key_id
   RAZORPAY_KEY_SECRET=your_key_secret
   RAZORPAY_TEST_MODE=True
   ```
3. Restart the server. The provider abstraction seamlessly switches from `MockPaymentSandbox` to `RazorpayPaymentProvider`.

---

## 📄 License
MIT License. Built for the **Razorpay AI Buildathon**.
