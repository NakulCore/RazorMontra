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

@pytest.mark.asyncio
async def test_demo_simulator_and_seed_api():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        # Get all demo scenarios
        sc_res = await client.get("/api/v1/demo/scenarios")
        assert sc_res.status_code == 200
        scenarios = sc_res.json()
        assert len(scenarios) >= 5
        assert "NORMAL_PAYMENT" in scenarios
        assert "VELOCITY_ATTACK" in scenarios

        # Test seeding 10 demo transactions
        seed_res = await client.post("/api/v1/demo/seed?count=10")
        assert seed_res.status_code == 200
        assert seed_res.json()["count"] == 10

@pytest.mark.asyncio
async def test_razorpay_webhook_endpoint():
    import hmac
    import hashlib
    import json
    from backend.app.core.config import settings

    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        status_res = await client.get("/api/v1/webhooks/razorpay")
        assert status_res.status_code == 200
        assert status_res.json()["status"] == "ready"

        webhook_body = {
            "entity": "event",
            "event": "payment.authorized",
            "payload": {
                "payment": {
                    "entity": {
                        "id": "pay_test_unit_123",
                        "amount": 150000,
                        "currency": "INR",
                        "status": "authorized",
                        "method": "upi",
                        "email": "test.eval@razorpay.com"
                    }
                }
            }
        }
        raw_bytes = json.dumps(webhook_body).encode("utf-8")
        sig = hmac.new(
            settings.RAZORPAY_WEBHOOK_SECRET.encode("utf-8"),
            raw_bytes,
            hashlib.sha256
        ).hexdigest()

        res = await client.post(
            "/api/v1/webhooks/razorpay",
            content=raw_bytes,
            headers={"x-razorpay-signature": sig, "Content-Type": "application/json"}
        )
        assert res.status_code == 200
        assert res.json()["event"] == "payment.authorized"
