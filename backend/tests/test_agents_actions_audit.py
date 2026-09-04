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
    res1 = await action_engine.execute_for_decision(tx_id, DecisionType.APPROVE, "Normal payment", amount=1500.0, currency="INR")
    res2 = await action_engine.execute_for_decision(tx_id, DecisionType.APPROVE, "Normal payment", amount=1500.0, currency="INR")
    assert res1.action_id == res2.action_id
    assert res1.status == res2.status

@pytest.mark.asyncio
async def test_mock_payment_provider_actions():
    from backend.app.services.razorpay_provider import MockPaymentProvider
    mock = MockPaymentProvider()
    assert mock.provider_name == "MockPaymentSandbox"
    
    app_res = await mock.approve_transaction("txn_01", "Normal")
    assert app_res["status"] == "APPROVED"
    assert "txn_01" in app_res["message"]

    ver_res = await mock.request_stepup_verification("txn_02", method="3DS_OTP")
    assert ver_res["status"] == "CHALLENGE_ISSUED"

    flg_res = await mock.flag_for_review("txn_03", "Medium risk")
    assert flg_res["status"] == "FLAGGED_IN_QUEUE"

    esc_res = await mock.escalate_and_block("txn_04", "Bot velocity")
    assert esc_res["status"] == "ESCALATED_BLOCKED"

    status = await mock.verify_credentials()
    assert status["configured"] is False
    assert status["connected"] is False

def test_razorpay_provider_guardrail_rejects_live_key_in_test_mode():
    from backend.app.services.razorpay_provider import RazorpayPaymentProvider
    with pytest.raises(ValueError, match="SAFETY GUARDRAIL"):
        RazorpayPaymentProvider(
            key_id="rzp_live_1234567890abcdef",
            key_secret="secret_live_12345",
            test_mode=True
        )

@pytest.mark.asyncio
async def test_razorpay_provider_handles_invalid_credentials_gracefully():
    from backend.app.services.razorpay_provider import RazorpayPaymentProvider
    # Using dummy test key format to test actual API response code without crash
    rzp = RazorpayPaymentProvider(
        key_id="rzp_test_invalid000000",
        key_secret="invalidsecret000000",
        test_mode=True
    )
    assert rzp.provider_name == "Razorpay_API_TestMode"
    
    # verify_credentials should report 401/error without raising exception
    status = await rzp.verify_credentials()
    assert status["configured"] is True
    assert status["connected"] is False
    assert "Authentication failed" in status.get("error", "") or status.get("status_code") == 401
