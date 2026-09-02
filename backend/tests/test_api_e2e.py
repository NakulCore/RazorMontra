import pytest
from httpx import AsyncClient, ASGITransport
from backend.app.main import app

@pytest.mark.asyncio
async def test_health_and_root_endpoints():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        res = await client.get("/health")
        assert res.status_code == 200
        data = res.json()
        assert data["status"] == "OK"
        assert data["policies_indexed"] > 0

@pytest.mark.asyncio
async def test_end_to_end_risk_pipeline_api():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        payload = {
            "merchant_id": "merch_e2e_01",
            "customer_id": "cust_e2e_01",
            "amount": 75000.0,
            "currency": "INR",
            "payment_method": "card",
            "device_id": "dev_test_e2e",
            "device_age": 0,
            "ip_country": "RU",
            "customer_country": "IN",
            "merchant_country": "IN",
            "previous_transaction_count": 5,
            "previous_failed_transactions": 3,
            "transactions_last_10_minutes": 6,
            "transactions_last_hour": 10,
            "average_customer_amount": 2000.0,
            "amount_deviation": 36.5,
            "new_device": True,
            "new_location": True,
            "chargeback_history": 1,
            "account_age": 45
        }
        res = await client.post("/api/v1/risk/analyze", json=payload)
        assert res.status_code == 200
        data = res.json()

        # Verify full pipeline outputs
        assert "transaction" in data
        assert "ml_result" in data
        assert "rule_results" in data
        assert "retrieved_policies" in data
        assert "investigation" in data
        assert "decision" in data
        assert "action" in data
        assert "audit_id" in data

        assert data["ml_result"]["risk_score"] >= 60
        assert data["decision"]["decision"] in ["FLAG", "ESCALATE", "VERIFY"]
        assert len(data["retrieved_policies"]) > 0
        assert len(data["rule_results"]) > 0

@pytest.mark.asyncio
async def test_metrics_api():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        res = await client.get("/api/v1/metrics")
        assert res.status_code == 200
        metrics = res.json()
        assert "total_transactions" in metrics
        assert "model_metrics" in metrics
        if metrics["model_metrics"]:
            assert metrics["model_metrics"]["precision"] > 0.8
            assert metrics["model_metrics"]["recall"] > 0.8
