import pytest
import asyncio
from backend.app.services.decision_agent import decision_agent
from backend.app.services.investigation_agent import investigation_agent
from backend.app.services.action_engine import action_engine
from backend.app.services.audit_service import audit_service
from backend.app.models.schemas import MLRiskOutput, RiskClass, RuleResult, RuleSeverity, PolicyClause, DecisionType

@pytest.mark.asyncio
async def test_bounded_decision_agent():
    ml_high = MLRiskOutput(
        risk_score=92,
        risk_probability=0.92,
        risk_class=RiskClass.CRITICAL,
        risk_factors=["Severe amount spike", "Velocity attack"],
        model_version="test_v1"
    )
    rules = [
        RuleResult(rule="RULE_HIGH_VELOCITY", triggered=True, severity=RuleSeverity.HIGH, reason="Velocity spike", risk_points=30)
    ]
    policies = [
        PolicyClause(policy_id="RPAY-POL-102", title="Velocity", category="VELOCITY", text="Rate limit", relevance_score=0.9)
    ]
    dec = decision_agent.decide(ml_high, rules, policies, "High risk burst")
    assert dec.decision in [DecisionType.ESCALATE, DecisionType.FLAG]
    assert dec.risk_score == 92

@pytest.mark.asyncio
async def test_action_engine_idempotency():
    tx_id = "test_txn_idempotent_1"
    res1 = await action_engine.execute_for_decision(tx_id, DecisionType.APPROVE, "Normal payment")
    res2 = await action_engine.execute_for_decision(tx_id, DecisionType.APPROVE, "Normal payment")
    assert res1.action_id == res2.action_id
    assert res1.status == res2.status
