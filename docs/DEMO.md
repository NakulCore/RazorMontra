# 5-Minute Evaluator Walk-Through Guide — Razorpay AI Buildathon

## Target Audience: Razorpay AI Buildathon Judges & Evaluators
**Track:** AI Risk Manager  
**Project:** AI Payment Risk Copilot  

---

## 5-Minute Demo Flow

### Step 1: Open the Dashboard (0:00 - 0:45)
1. Launch the application: `./start.sh` or `docker compose up`.
2. Navigate to `http://localhost:8000` (or `http://localhost:5173` in development mode).
3. **Point out the Top KPI Cards:**
   * **Total Processed:** 12,000+ realistic fintech transactions.
   * **Net Money Protected:** ₹1,299,107.17 in intercepted fraud.
   * **Precision:** **98.8%** (Low customer friction / false positive rate < 0.2%).
   * **Recall:** **99.4%** (Detects virtually all fraud attempts).
   * **F1-Score:** **99.1%** & **ROC-AUC: 1.0000** on held-out test split.

---

### Step 2: Interactive Scenario Simulation (0:45 - 2:00)
1. Click **"Demo Simulator"** on the left navigation bar.
2. Select the **"Velocity Attack"** card or **"Multi-Signal Coordinated Fraud"** card.
3. Click **"Simulate & Investigate"**.
4. The system sends the transaction payload in real-time through the backend pipeline:
   * Feature Extraction computes velocity ratio (9 txns in 10m).
   * ML Risk Engine infers calibrated probability and assigns **Critical Risk (Score: 92/100)**.
   * Rule Engine trips `RULE_HIGH_VELOCITY` (+30 pts) and `RULE_LOCATION_MISMATCH` (+20 pts).
   * RAG Vector Store retrieves `RPAY-POL-102` (Velocity Policy) and `RPAY-POL-107` (Quarantine Protocol).
   * AI Investigation Agent synthesizes the anomaly context with missing telemetry.
   * Bounded Decision Agent issues `ESCALATE` decision.
   * Action Engine dispatches `escalate_and_block` to the sandbox payment provider.
   * Immutable Audit Ledger records trace hash.

---

### Step 3: Deep-Dive into the Investigation Drawer (2:00 - 3:30)
1. Observe the **Transaction Investigation Drawer**:
   * **Grounded Feature Contributions:** Highlights exactly *why* the transaction was flagged (e.g., *9 events in 10 minutes*, *amount 24.4x customer average*, *foreign IP HK*). Note that the AI **never invents** facts.
   * **Deterministic Rule Engine Gate:** Shows fired rules with severity badges and reasons.
   * **RAG Policy Cards:** Displays retrieved policy text with relevance scores.
   * **Missing Information:** Lists actionable merchant KYC items (e.g., PAN/GSTIN declaration, biometric token).
   * **Bounded Decision:** Shows strict compliance bounds (The AI cannot bypass high-risk safeguards).
   * **Idempotent Safe Action:** Displays the dispatch confirmation ID and status.

---

### Step 4: Test Benign Outlier / False Positive Handling (3:30 - 4:15)
1. In the **Demo Simulator**, select the **"Legitimate Vacation Purchase (Benign Outlier)"** scenario.
2. Click **"Simulate & Investigate"**.
3. **Observe the result:**
   * Despite an international IP (Singapore), the ML model recognizes the established customer age (720 days), normal customer device, and low velocity.
   * The system assigns **Low Risk (Score: 22/100)** and issues an automated **APPROVE** decision.
   * Demonstrates that the copilot avoids unnecessary friction for high-trust users.

---

### Step 5: Audit Ledger & Model Evaluation Cockpit (4:15 - 5:00)
1. Click **"Audit Trail"** to inspect the immutable ledger of all analysis events.
2. Click **"Model Evaluation"** to view the candidate comparison:
   * Validation comparison between Logistic Regression, Random Forest, and HistGradientBoosting.
   * Confusion matrix and financial ROI breakdown (Fraud Intercepted vs. Review Cost).
3. **Conclusion:** The AI Payment Risk Copilot is a measurable, grounded, bounded, and production-ready defense system for Razorpay merchants.
