import pytest
from backend.app.services.ml_engine import ml_engine
from backend.app.services.rule_engine import rule_engine
from backend.app.services.rag_engine import rag_engine

def test_ml_inference():
    sample_tx = {
        "amount": 75000.0,
        "average_customer_amount": 2000.0,
        "transactions_last_10_minutes": 5,
        "transactions_last_hour": 8,
        "previous_failed_transactions": 3,
        "new_device": True,
        "new_location": True,
        "ip_country": "RU",
        "customer_country": "IN",
        "merchant_country": "IN",
        "chargeback_history": 1,
        "device_age": 0,
        "account_age": 30
    }
    pred = ml_engine.predict(sample_tx)
    assert 0 <= pred.risk_score <= 100
    assert 0.0 <= pred.risk_probability <= 1.0
    assert pred.risk_class in ["HIGH", "CRITICAL"]
    assert len(pred.risk_factors) > 0

def test_rule_engine_triggers():
    tx = {
        "amount": 90000.0,
        "average_customer_amount": 1000.0,
        "transactions_last_10_minutes": 7,
        "transactions_last_hour": 10,
        "new_device": True,
        "device_age": 1,
        "ip_country": "RU",
        "customer_country": "IN",
        "previous_failed_transactions": 3,
        "chargeback_history": 2
    }
    rules = rule_engine.evaluate(tx)
    triggered_names = [r.rule for r in rules if r.triggered]
    assert "RULE_HIGH_AMOUNT" in triggered_names
    assert "RULE_HIGH_VELOCITY" in triggered_names
    assert "RULE_NEW_DEVICE" in triggered_names
    assert "RULE_LOCATION_MISMATCH" in triggered_names
    assert "RULE_REPEATED_FAILURES" in triggered_names
    assert "RULE_CHARGEBACK_HISTORY" in triggered_names

def test_rag_policy_retrieval():
    results = rag_engine.search("high amount extreme transaction limits", top_k=2)
    assert len(results) > 0
    assert any("High-Value" in r.title or "Limits" in r.category or "RPAY-POL" in r.policy_id for r in results)
