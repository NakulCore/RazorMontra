from typing import List, Dict, Any
from backend.app.models.schemas import DecisionOutput, DecisionType, MLRiskOutput, RuleResult, PolicyClause

class BoundedDecisionAgent:
    def decide(
        self,
        ml_result: MLRiskOutput,
        rules: List[RuleResult],
        policies: List[PolicyClause],
        investigation_summary: str
    ) -> DecisionOutput:
        """
        Executes bounded decision logic adhering to strict regulatory, compliance,
        and fraud thresholds.
        """
        score = ml_result.risk_score
        triggered_rules = [r for r in rules if r.triggered]
        policy_ids = [p.policy_id for p in policies]

        critical_rule = any(r.severity.value == "CRITICAL" for r in triggered_rules)
        high_rule = any(r.severity.value == "HIGH" for r in triggered_rules)
        rule_count = len(triggered_rules)

        safeguard_applied = False

        # 1. Critical Escalation Bounds
        if score >= 85 or critical_rule or (rule_count >= 3):
            decision = DecisionType.ESCALATE
            reason = f"High-severity risk pattern (Score: {score}/100, {rule_count} rule violations). Immediate escalation mandatory under {', '.join(policy_ids[:2])}."
            confidence = 0.96

        # 2. High Risk / Flagging Bounds
        elif score >= 70 or (high_rule and score >= 50):
            decision = DecisionType.FLAG
            reason = f"Elevated fraud probability (Score: {score}/100). Flagged for asynchronous analyst review under {', '.join(policy_ids[:2])}."
            confidence = 0.92

        # 3. Medium Risk / Verification Challenge Bounds
        elif score >= 35 or rule_count >= 1:
            decision = DecisionType.VERIFY
            reason = f"Medium risk anomaly detected (Score: {score}/100). Step-up 3DS/OTP verification required pursuant to policy {policy_ids[0] if policy_ids else 'RPAY-POL-105'}."
            confidence = 0.90

        # 4. Low Risk Approval Bounds
        else:
            decision = DecisionType.APPROVE
            reason = f"Low risk profile (Score: {score}/100, 0 rule violations). Authorized for frictionless checkout."
            confidence = 0.98

        # --- Deterministic Safety Guardrail Check ---
        # The AI cannot approve high risk transactions
        if (score >= 60 or critical_rule) and decision == DecisionType.APPROVE:
            decision = DecisionType.VERIFY
            safeguard_applied = True
            reason = f"[SAFEGUARD OVERRIDE] Risk score {score} prohibited automated approval. Stepped up to verification."

        return DecisionOutput(
            decision=decision,
            reason=reason,
            policy_ids=policy_ids,
            risk_score=score,
            confidence=confidence,
            safeguard_applied=safeguard_applied
        )

decision_agent = BoundedDecisionAgent()
