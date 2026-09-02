import pytest
from backend.app.services.ml_engine import MLRiskEngine
from backend.app.services.rag_engine import PolicyRAGEngine
from backend.app.services.investigation_agent import InvestigationAgent
from backend.app.services.decision_agent import BoundedDecisionAgent
from backend.app.models.schemas import MLRiskOutput, RiskClass, DecisionType
from pathlib import Path

def test_ml_fallback_when_model_file_missing():
    engine = MLRiskEngine(model_path=Path("/non/existent/path/model.joblib"))
    assert engine.pipeline is None
    pred = engine.predict({
        "amount": 80000.0,
        "average_customer_amount": 1000.0,
        "transactions_last_10_minutes": 6,
        "new_device": True
    })
    assert pred.risk_score >= 50
    assert pred.model_version == "heuristic_fallback_v1"

def test_rag_fallback_when_empty_directory():
    rag = PolicyRAGEngine(policy_dir=Path("/non/existent/policies/dir"))
    results = rag.search("high amount", top_k=2)
    assert len(results) > 0
    assert results[0].policy_id.startswith("RPAY-POL")

def test_investigation_agent_handles_sparse_payload():
    sparse_tx = {"amount": 500.0}
    ml = MLRiskOutput(risk_score=10, risk_probability=0.10, risk_class=RiskClass.LOW, risk_factors=["Normal baseline"], model_version="v1")
    agent = InvestigationAgent()
    inv = agent.investigate(sparse_tx, ml, [], [])
    assert inv.agent_status == "SUCCESS"
    assert "Score: 10/100" in inv.summary

def test_bounded_decision_agent_safety_guardrail_override():
    # Attempting to give APPROVE when score is Critical / 95
    ml_critical = MLRiskOutput(risk_score=95, risk_probability=0.95, risk_class=RiskClass.CRITICAL, risk_factors=["Extremely high risk"], model_version="v1")
    agent = BoundedDecisionAgent()
    dec = agent.decide(ml_critical, [], [], "High risk event")
    assert dec.decision in [DecisionType.ESCALATE, DecisionType.FLAG]
    assert dec.decision != DecisionType.APPROVE
