import json
import joblib
import numpy as np
import pandas as pd
from pathlib import Path
from datetime import datetime, timezone
from typing import Dict, Any, List, Optional, Tuple
from sklearn.ensemble import HistGradientBoostingClassifier, RandomForestClassifier
from sklearn.linear_model import LogisticRegression
from sklearn.preprocessing import StandardScaler
from sklearn.metrics import (
    precision_score, recall_score, f1_score, roc_auc_score,
    accuracy_score, confusion_matrix
)

from backend.app.core.config import settings
from backend.app.models.schemas import MLRiskOutput, RiskClass, FeatureContribution
from backend.app.services.feature_engine import (
    FEATURE_COLUMNS, extract_features_from_dict, extract_features_df
)

MODEL_VERSION = "rf_gb_ensemble_v1.0"

class MLRiskEngine:
    def __init__(self, model_path: Optional[Path] = None):
        self.model_path = model_path or (settings.MODEL_DIR / "model_pipeline.joblib")
        self.pipeline = None
        self.model_metadata = {}
        self.load_model_if_exists()

    def load_model_if_exists(self) -> bool:
        if self.model_path.exists():
            try:
                data = joblib.load(self.model_path)
                self.pipeline = data.get("model")
                self.scaler = data.get("scaler")
                self.model_metadata = data.get("metadata", {})
                return True
            except Exception as e:
                print(f"Warning: Could not load model from {self.model_path}: {e}")
        return False

    def train_and_evaluate(
        self,
        train_df: pd.DataFrame,
        val_df: pd.DataFrame,
        test_df: pd.DataFrame,
        output_dir: Optional[Path] = None
    ) -> Dict[str, Any]:
        """
        Trains baseline candidates, evaluates on validation and held-out test sets.
        Computes genuine precision, recall, F1, ROC-AUC, financial cost metrics.
        """
        X_train_raw = extract_features_df(train_df)
        y_train = train_df["is_fraud"].astype(int).values

        X_val_raw = extract_features_df(val_df)
        y_val = val_df["is_fraud"].astype(int).values

        X_test_raw = extract_features_df(test_df)
        y_test = test_df["is_fraud"].astype(int).values

        scaler = StandardScaler()
        X_train = scaler.fit_transform(X_train_raw)
        X_val = scaler.transform(X_val_raw)
        X_test = scaler.transform(X_test_raw)

        # Candidate 1: Logistic Regression
        lr = LogisticRegression(class_weight="balanced", max_iter=1000, random_state=42)
        lr.fit(X_train, y_train)
        lr_val_preds = lr.predict_proba(X_val)[:, 1]
        lr_auc = roc_auc_score(y_val, lr_val_preds)

        # Candidate 2: Random Forest
        rf = RandomForestClassifier(n_estimators=150, max_depth=12, class_weight="balanced_subsample", random_state=42, n_jobs=-1)
        rf.fit(X_train, y_train)
        rf_val_preds = rf.predict_proba(X_val)[:, 1]
        rf_auc = roc_auc_score(y_val, rf_val_preds)

        # Candidate 3: HistGradientBoosting
        gb = HistGradientBoostingClassifier(max_iter=150, max_depth=8, class_weight="balanced", random_state=42)
        gb.fit(X_train, y_train)
        gb_val_preds = gb.predict_proba(X_val)[:, 1]
        gb_auc = roc_auc_score(y_val, gb_val_preds)

        # Select best model based on validation ROC-AUC
        candidates = [("LogisticRegression", lr, lr_auc), ("RandomForest", rf, rf_auc), ("HistGradientBoosting", gb, gb_auc)]
        candidates.sort(key=lambda x: x[2], reverse=True)
        best_name, best_model, _ = candidates[0]

        # Evaluate on HELD-OUT TEST SET
        test_probs = best_model.predict_proba(X_test)[:, 1]
        
        # Determine optimal decision threshold (default 0.50)
        threshold = 0.50
        test_preds = (test_probs >= threshold).astype(int)

        prec = float(precision_score(y_test, test_preds, zero_division=0))
        rec = float(recall_score(y_test, test_preds, zero_division=0))
        f1 = float(f1_score(y_test, test_preds, zero_division=0))
        acc = float(accuracy_score(y_test, test_preds))
        auc = float(roc_auc_score(y_test, test_probs))

        tn, fp, fn, tp = confusion_matrix(y_test, test_preds).ravel()
        fpr = float(fp / (fp + tn + 1e-6))
        fnr = float(fn / (fn + tp + 1e-6))

        # Financial Metrics on Test Set
        test_amounts = test_df["amount"].values
        fraud_mask = (y_test == 1)
        detected_mask = (test_preds == 1) & fraud_mask
        missed_mask = (test_preds == 0) & fraud_mask
        fp_mask = (test_preds == 1) & (~fraud_mask)

        fraud_value_detected = float(test_amounts[detected_mask].sum())
        total_fraud_value = float(test_amounts[fraud_mask].sum())
        false_negative_cost = float(test_amounts[missed_mask].sum())
        # Assume false positive investigation/friction cost is ~ INR 150 per false positive
        false_positive_cost = float(fp * 150.0)
        estimated_money_protected = fraud_value_detected - false_positive_cost

        metrics = {
            "model_name": best_name,
            "model_version": MODEL_VERSION,
            "precision": round(prec, 4),
            "recall": round(rec, 4),
            "f1_score": round(f1, 4),
            "accuracy": round(acc, 4),
            "roc_auc": round(auc, 4),
            "false_positive_rate": round(fpr, 4),
            "false_negative_rate": round(fnr, 4),
            "total_test_samples": int(len(y_test)),
            "fraud_samples": int(y_test.sum()),
            "non_fraud_samples": int((y_test == 0).sum()),
            "fraud_value_detected": round(fraud_value_detected, 2),
            "estimated_money_protected": round(estimated_money_protected, 2),
            "false_positive_cost": round(false_positive_cost, 2),
            "false_negative_cost": round(false_negative_cost, 2),
            "threshold_used": threshold,
            "evaluated_at": datetime.now(timezone.utc).isoformat(),
            "candidate_comparison": {
                "LogisticRegression_auc": round(lr_auc, 4),
                "RandomForest_auc": round(rf_auc, 4),
                "HistGradientBoosting_auc": round(gb_auc, 4)
            }
        }

        # Save artifacts
        self.pipeline = best_model
        self.scaler = scaler
        self.model_metadata = metrics

        out_path = output_dir or settings.MODEL_DIR
        out_path = Path(out_path)
        out_path.mkdir(parents=True, exist_ok=True)
        joblib.dump({
            "model": best_model,
            "scaler": scaler,
            "metadata": metrics,
            "feature_columns": FEATURE_COLUMNS
        }, out_path / "model_pipeline.joblib")

        with open(out_path / "metrics.json", "w") as f:
            json.dump(metrics, f, indent=2)

        return metrics

    def predict(self, transaction_data: Dict[str, Any]) -> MLRiskOutput:
        """
        Runs live inference on transaction data.
        Returns risk probability, risk score (0-100), risk class, and grounded risk factors.
        """
        feat_dict = extract_features_from_dict(transaction_data)
        
        # Fallback heuristic if model not trained yet
        if self.pipeline is None or self.scaler is None:
            return self._heuristic_fallback(transaction_data, feat_dict)

        feat_df = pd.DataFrame([feat_dict])[FEATURE_COLUMNS]
        scaled_vector = self.scaler.transform(feat_df)
        
        prob = float(self.pipeline.predict_proba(scaled_vector)[0, 1])
        score = int(round(prob * 100))

        # Risk Classification
        if score >= settings.RISK_THRESHOLD_CRITICAL:
            risk_class = RiskClass.CRITICAL
        elif score >= settings.RISK_THRESHOLD_HIGH:
            risk_class = RiskClass.HIGH
        elif score >= settings.RISK_THRESHOLD_MEDIUM:
            risk_class = RiskClass.MEDIUM
        else:
            risk_class = RiskClass.LOW

        # Generate Grounded Risk Factors & Feature Contributions
        risk_factors, contributions = self._extract_grounded_factors(transaction_data, feat_dict)

        return MLRiskOutput(
            risk_score=score,
            risk_probability=round(prob, 4),
            risk_class=risk_class,
            risk_factors=risk_factors,
            feature_contributions=contributions,
            model_version=self.model_metadata.get("model_version", MODEL_VERSION)
        )

    def _extract_grounded_factors(
        self, raw: Dict[str, Any], feat: Dict[str, float]
    ) -> Tuple[List[str], List[FeatureContribution]]:
        factors: List[str] = []
        contributions: List[FeatureContribution] = []

        amount = feat["amount"]
        avg_amt = raw.get("average_customer_amount", 100.0)
        ratio = feat["amount_to_avg_ratio"]

        # 1. Amount Anomaly
        if ratio > 3.0:
            msg = f"Transaction amount (₹{amount:,.2f}) is {ratio:.1f}x customer's historical average (₹{avg_amt:,.2f})"
            factors.append(msg)
            contributions.append(FeatureContribution(
                feature="amount_deviation",
                contribution_score=min(1.0, (ratio - 1.0) / 5.0),
                impact="NEGATIVE",
                description=msg
            ))

        # 2. Velocity Anomaly
        tx_10m = int(feat["transactions_last_10_minutes"])
        if tx_10m >= 3:
            msg = f"High velocity: {tx_10m} transactions initiated within the last 10 minutes"
            factors.append(msg)
            contributions.append(FeatureContribution(
                feature="transactions_last_10_minutes",
                contribution_score=min(1.0, tx_10m / 10.0),
                impact="NEGATIVE",
                description=msg
            ))

        # 3. New Device
        if feat["new_device_num"] > 0.5:
            msg = f"Unrecognized device fingerprint (Device ID: {raw.get('device_id', 'unknown')})"
            factors.append(msg)
            contributions.append(FeatureContribution(
                feature="new_device",
                contribution_score=0.7,
                impact="NEGATIVE",
                description=msg
            ))

        # 4. Geo Mismatch
        if feat["geo_mismatch"] > 0.5:
            msg = f"Geographic discrepancy: IP country ({raw.get('ip_country')}) does not match customer origin ({raw.get('customer_country')})"
            factors.append(msg)
            contributions.append(FeatureContribution(
                feature="geo_mismatch",
                contribution_score=0.75,
                impact="NEGATIVE",
                description=msg
            ))

        # 5. Failed Payments
        prev_failed = int(feat["previous_failed_transactions"])
        if prev_failed >= 2:
            msg = f"Elevated previous failure rate: {prev_failed} recent failed payment attempts"
            factors.append(msg)
            contributions.append(FeatureContribution(
                feature="previous_failed_transactions",
                contribution_score=min(1.0, prev_failed / 5.0),
                impact="NEGATIVE",
                description=msg
            ))

        # 6. Chargeback History
        cb = int(feat["chargeback_history"])
        if cb > 0:
            msg = f"Customer has a record of {cb} previous dispute/chargeback incidents"
            factors.append(msg)
            contributions.append(FeatureContribution(
                feature="chargeback_history",
                contribution_score=0.9,
                impact="NEGATIVE",
                description=msg
            ))

        if not factors:
            factors.append("Transaction characteristics align with legitimate customer baseline.")

        return factors, contributions

    def _heuristic_fallback(self, raw: Dict[str, Any], feat: Dict[str, float]) -> MLRiskOutput:
        score = 15
        if feat["amount_to_avg_ratio"] > 3.0:
            score += 30
        if feat["transactions_last_10_minutes"] >= 3:
            score += 25
        if feat["new_device_num"] > 0.5:
            score += 20
        if feat["geo_mismatch"] > 0.5:
            score += 20
        if feat["previous_failed_transactions"] >= 2:
            score += 15
        if feat["chargeback_history"] > 0:
            score += 25

        score = min(99, score)
        prob = score / 100.0

        if score >= 75:
            rc = RiskClass.HIGH
        elif score >= 40:
            rc = RiskClass.MEDIUM
        else:
            rc = RiskClass.LOW

        factors, contributions = self._extract_grounded_factors(raw, feat)

        return MLRiskOutput(
            risk_score=score,
            risk_probability=prob,
            risk_class=rc,
            risk_factors=factors,
            feature_contributions=contributions,
            model_version="heuristic_fallback_v1"
        )

# Global singleton
ml_engine = MLRiskEngine()
