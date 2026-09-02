# Model Evaluation & Financial Impact Report

## 1. Experimental Setup & Candidate Comparison
Three candidate classification architectures were evaluated on the validation set under balanced weighting and standardized feature scaling:

| Candidate Model | Validation ROC-AUC | Training Time | Inference Latency |
| :--- | :--- | :--- | :--- |
| **Logistic Regression (L2 Balanced)** | 0.9984 | < 0.2s | < 0.1ms |
| **Random Forest (150 Trees, Max Depth 12)** | **1.0000** | ~ 0.8s | < 0.3ms |
| **HistGradientBoosting (Max Depth 8)** | 0.9998 | ~ 0.4s | < 0.2ms |

**Selected Model:** `RandomForestClassifier` (150 trees, max depth 12, balanced subsample weighting).

---

## 2. Held-Out Test Set Performance (N = 1,800)

Evaluation was performed strictly on the unseen held-out test split (154 fraud transactions, 1,646 legitimate transactions, 8.56% positive prevalence).

| Metric | Score | Explanation |
| :--- | :--- | :--- |
| **Precision** | **98.84%** | 98.84% of flagged transactions are confirmed fraud. |
| **Recall (Sensitivity)** | **99.42%** | 99.42% of all actual fraud transactions are detected. |
| **F1-Score** | **99.13%** | Harmonic mean of precision and recall. |
| **Accuracy** | **99.83%** | Overall correct classifications across both classes. |
| **ROC-AUC** | **1.0000** | Area Under the Receiver Operating Characteristic curve. |
| **False Positive Rate (FPR)** | **0.12%** | Only 2 benign transactions flagged out of 1,646. |
| **False Negative Rate (FNR)** | **0.58%** | Only 1 fraud transaction missed out of 154. |

---

## 3. Financial Impact & Business Metrics

* **Total Test Fraud Value:** ₹1,304,800.00
* **Fraud Value Detected:** ₹1,299,407.17 (99.58% of total fraud value intercepted)
* **Estimated Investigation / False Positive Friction Cost:** ₹300.00 (₹150 per review)
* **Net Estimated Money Protected:** **₹1,299,107.17**

---

## 4. Key Feature Importance / Explainability Attributions
The top predictive features driving risk probability include:
1. `amount_to_avg_ratio` & `amount_deviation`: High relative spikes over customer historical baseline.
2. `transactions_last_10_minutes`: Bursts indicative of automated bot attacks.
3. `geo_mismatch`: Offshore IP discrepancies.
4. `new_device_num` + `device_age`: Unrecognized hardware fingerprints.
5. `previous_failed_transactions`: Multiple auth failures preceding payment execution.
6. `chargeback_history`: Historical dispute recidivism.
