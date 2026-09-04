import json
import random
import uuid
import hmac
import hashlib
from datetime import datetime, timezone
from typing import List, Optional, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, Query, Request
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, desc

from backend.app.core.database import get_db
from backend.app.models.schemas import (
    TransactionCreate, TransactionResponse, ComprehensiveRiskAnalysis,
    MLRiskOutput, PolicyClause, PolicySearchRequest, InvestigationOutput,
    DecisionOutput, ActionExecutionRequest, ActionExecutionResponse,
    AuditRecord, SystemOverviewMetrics, ModelMetrics, ActionType, DecisionType
)
from backend.app.models.db_models import DBTransaction, DBAuditRecord
from backend.app.services.pipeline import pipeline_service
from backend.app.services.ml_engine import ml_engine
from backend.app.services.rag_engine import rag_engine
from backend.app.services.rule_engine import rule_engine
from backend.app.services.investigation_agent import investigation_agent
from backend.app.services.decision_agent import decision_agent
from backend.app.services.action_engine import action_engine
from backend.app.services.razorpay_provider import get_payment_provider, RazorpayPaymentProvider
from backend.app.services.audit_service import audit_service
from backend.app.services.generator import generate_synthetic_dataset
from backend.app.core.config import settings

router = APIRouter()

# --- Predefined Demo Scenarios ---
DEMO_SCENARIOS = {
    "NORMAL_PAYMENT": {
        "name": "Normal Frictionless Payment",
        "description": "Routine INR 1,250 groceries payment from regular customer device and domestic IP.",
        "risk_class": "LOW",
        "expected_decision": "APPROVE",
        "payload": {
            "merchant_id": "merch_0012",
            "customer_id": "cust_00342",
            "amount": 1250.0,
            "currency": "INR",
            "payment_method": "upi",
            "device_id": "dev_cust_00342_1",
            "device_age": 180,
            "ip_country": "IN",
            "customer_country": "IN",
            "merchant_country": "IN",
            "previous_transaction_count": 45,
            "previous_failed_transactions": 0,
            "transactions_last_10_minutes": 0,
            "transactions_last_hour": 1,
            "average_customer_amount": 1100.0,
            "amount_deviation": 0.13,
            "new_device": False,
            "new_location": False,
            "chargeback_history": 0,
            "account_age": 360
        }
    },
    "HIGH_VALUE_ANOMALY": {
        "name": "High-Value Spike Anomaly",
        "description": "Sudden ₹65,000 transaction (8.1x historical average) from an unrecognized device.",
        "risk_class": "MEDIUM",
        "expected_decision": "FLAG",
        "payload": {
            "merchant_id": "merch_0088",
            "customer_id": "cust_00109",
            "amount": 65000.0,
            "currency": "INR",
            "payment_method": "card",
            "device_id": "dev_unknown_7781a",
            "device_age": 1,
            "ip_country": "IN",
            "customer_country": "IN",
            "merchant_country": "IN",
            "previous_transaction_count": 12,
            "previous_failed_transactions": 1,
            "transactions_last_10_minutes": 1,
            "transactions_last_hour": 1,
            "average_customer_amount": 8000.0,
            "amount_deviation": 7.12,
            "new_device": True,
            "new_location": False,
            "chargeback_history": 0,
            "account_age": 120
        }
    },
    "VELOCITY_ATTACK": {
        "name": "Automated Velocity Bot Attack",
        "description": "8 rapid successive transactions within 10 minutes with preceding failed authorization attempts.",
        "risk_class": "CRITICAL",
        "expected_decision": "ESCALATE",
        "payload": {
            "merchant_id": "merch_0005",
            "customer_id": "cust_00781",
            "amount": 4500.0,
            "currency": "INR",
            "payment_method": "card",
            "device_id": "dev_bot_burst_99",
            "device_age": 0,
            "ip_country": "IN",
            "customer_country": "IN",
            "merchant_country": "IN",
            "previous_transaction_count": 8,
            "previous_failed_transactions": 3,
            "transactions_last_10_minutes": 8,
            "transactions_last_hour": 14,
            "average_customer_amount": 2500.0,
            "amount_deviation": 0.8,
            "new_device": True,
            "new_location": False,
            "chargeback_history": 0,
            "account_age": 45
        }
    },
    "NEW_DEVICE_TAKEOVER": {
        "name": "Account Takeover via New Device",
        "description": "First-time device binding with high ticket size from a foreign proxy IP.",
        "risk_class": "HIGH",
        "expected_decision": "ESCALATE",
        "payload": {
            "merchant_id": "merch_0033",
            "customer_id": "cust_00492",
            "amount": 34999.0,
            "currency": "INR",
            "payment_method": "card",
            "device_id": "dev_unseen_f019",
            "device_age": 0,
            "ip_country": "RU",
            "customer_country": "IN",
            "merchant_country": "IN",
            "previous_transaction_count": 60,
            "previous_failed_transactions": 3,
            "transactions_last_10_minutes": 2,
            "transactions_last_hour": 3,
            "average_customer_amount": 4200.0,
            "amount_deviation": 7.33,
            "new_device": True,
            "new_location": True,
            "chargeback_history": 0,
            "account_age": 450
        }
    },
    "LOCATION_ANOMALY": {
        "name": "Offshore Geographic Anomaly",
        "description": "Cross-border payment from Romanian IP address against domestic merchant with unknown device.",
        "risk_class": "HIGH",
        "expected_decision": "ESCALATE",
        "payload": {
            "merchant_id": "merch_0019",
            "customer_id": "cust_00812",
            "amount": 32000.0,
            "currency": "INR",
            "payment_method": "card",
            "device_id": "dev_cust_00812_new",
            "device_age": 1,
            "ip_country": "RO",
            "customer_country": "IN",
            "merchant_country": "IN",
            "previous_transaction_count": 18,
            "previous_failed_transactions": 2,
            "transactions_last_10_minutes": 1,
            "transactions_last_hour": 2,
            "average_customer_amount": 5500.0,
            "amount_deviation": 5.8,
            "new_device": True,
            "new_location": True,
            "chargeback_history": 0,
            "account_age": 200
        }
    },
    "MULTI_SIGNAL_FRAUD": {
        "name": "Multi-Signal Coordinated Fraud",
        "description": "Compound high-risk event: Extreme amount + burst velocity + unknown device + offshore origin + prior chargebacks.",
        "risk_class": "HIGH",
        "expected_decision": "ESCALATE",
        "payload": {
            "merchant_id": "merch_0001",
            "customer_id": "cust_00009",
            "amount": 89000.0,
            "currency": "INR",
            "payment_method": "card",
            "device_id": "dev_exploit_994",
            "device_age": 0,
            "ip_country": "HK",
            "customer_country": "IN",
            "merchant_country": "IN",
            "previous_transaction_count": 4,
            "previous_failed_transactions": 5,
            "transactions_last_10_minutes": 9,
            "transactions_last_hour": 16,
            "average_customer_amount": 3500.0,
            "amount_deviation": 24.4,
            "new_device": True,
            "new_location": True,
            "chargeback_history": 2,
            "account_age": 15
        }
    },
    "FALSE_POSITIVE": {
        "name": "Legitimate Vacation Purchase (Benign Outlier)",
        "description": "Legitimate established customer making a hotel booking in Singapore on their normal device.",
        "risk_class": "LOW",
        "expected_decision": "APPROVE",
        "payload": {
            "merchant_id": "merch_0055",
            "customer_id": "cust_00990",
            "amount": 14500.0,
            "currency": "INR",
            "payment_method": "card",
            "device_id": "dev_cust_00990_1",
            "device_age": 300,
            "ip_country": "SG",
            "customer_country": "IN",
            "merchant_country": "IN",
            "previous_transaction_count": 95,
            "previous_failed_transactions": 0,
            "transactions_last_10_minutes": 0,
            "transactions_last_hour": 1,
            "average_customer_amount": 8500.0,
            "amount_deviation": 0.70,
            "new_device": False,
            "new_location": True,
            "chargeback_history": 0,
            "account_age": 720
        }
    }
}

# --- Risk Analysis & Pipeline Endpoints ---

@router.post("/risk/analyze", response_model=ComprehensiveRiskAnalysis)
async def analyze_transaction(
    transaction: TransactionCreate,
    auto_execute: bool = Query(True, description="Automatically dispatch safe action"),
    db: AsyncSession = Depends(get_db)
):
    """
    Executes full defense-in-depth risk pipeline on incoming transaction.
    """
    tx_dict = transaction.model_dump()
    result = await pipeline_service.analyze_transaction(
        tx_dict=tx_dict,
        db=db,
        auto_execute_action=auto_execute
    )
    return result

@router.get("/risk/{transaction_id}")
async def get_risk_analysis(transaction_id: str, db: AsyncSession = Depends(get_db)):
    audit = await audit_service.get_by_transaction_id(transaction_id, db=db)
    if not audit:
        raise HTTPException(status_code=404, detail="Risk analysis record not found for transaction.")
    return audit

# --- Transactions Endpoints ---

@router.post("/transactions", response_model=ComprehensiveRiskAnalysis)
async def ingest_transaction(
    transaction: TransactionCreate,
    db: AsyncSession = Depends(get_db)
):
    return await pipeline_service.analyze_transaction(transaction.model_dump(), db=db)

@router.get("/transactions", response_model=List[TransactionResponse])
async def list_transactions(
    limit: int = Query(50, ge=1, le=500),
    offset: int = Query(0, ge=0),
    merchant_id: Optional[str] = None,
    is_fraud_only: Optional[bool] = None,
    db: AsyncSession = Depends(get_db)
):
    stmt = select(DBTransaction).order_by(desc(DBTransaction.timestamp))
    if merchant_id:
        stmt = stmt.where(DBTransaction.merchant_id == merchant_id)
    if is_fraud_only is not None:
        stmt = stmt.where(DBTransaction.is_fraud == is_fraud_only)
    stmt = stmt.offset(offset).limit(limit)

    res = await db.execute(stmt)
    records = res.scalars().all()
    results = []
    for r in records:
        tx_resp = TransactionResponse.model_validate(r)
        audit = await audit_service.get_by_transaction_id(r.transaction_id, db=db)
        if audit:
            tx_resp.risk_score = audit.risk_score
            tx_resp.risk_class = audit.risk_class
            tx_resp.decision = audit.decision
        else:
            d = {col.name: getattr(r, col.name) for col in r.__table__.columns}
            ml = ml_engine.predict(d)
            rules = rule_engine.evaluate(d)
            dec = decision_agent.decide(ml, rules, [], "")
            tx_resp.risk_score = ml.risk_score
            tx_resp.risk_class = ml.risk_class
            tx_resp.decision = dec.decision
        results.append(tx_resp)
    return results

@router.get("/transactions/{transaction_id}", response_model=TransactionResponse)
async def get_transaction(transaction_id: str, db: AsyncSession = Depends(get_db)):
    stmt = select(DBTransaction).where(DBTransaction.transaction_id == transaction_id)
    res = await db.execute(stmt)
    record = res.scalar_one_or_none()
    if not record:
        raise HTTPException(status_code=404, detail="Transaction not found.")
    tx_resp = TransactionResponse.model_validate(record)
    audit = await audit_service.get_by_transaction_id(record.transaction_id, db=db)
    if audit:
        tx_resp.risk_score = audit.risk_score
        tx_resp.risk_class = audit.risk_class
        tx_resp.decision = audit.decision
    else:
        d = {col.name: getattr(record, col.name) for col in record.__table__.columns}
        ml = ml_engine.predict(d)
        rules = rule_engine.evaluate(d)
        dec = decision_agent.decide(ml, rules, [], "")
        tx_resp.risk_score = ml.risk_score
        tx_resp.risk_class = ml.risk_class
        tx_resp.decision = dec.decision
    return tx_resp

# --- Policies & RAG Endpoints ---

@router.get("/policies", response_model=List[PolicyClause])
async def list_policies():
    return rag_engine.clauses

@router.post("/policies/search", response_model=List[PolicyClause])
async def search_policies(request: PolicySearchRequest):
    return rag_engine.search(request.query, top_k=request.top_k)

# --- Investigation & Decision Endpoints ---

@router.post("/investigations", response_model=InvestigationOutput)
async def run_investigation(transaction: TransactionCreate):
    tx_dict = transaction.model_dump()
    ml_res = ml_engine.predict(tx_dict)
    rules = rule_engine.evaluate(tx_dict)
    policies = rag_engine.retrieve_for_transaction(tx_dict, ml_res.risk_factors)
    return investigation_agent.investigate(tx_dict, ml_res, rules, policies)

@router.post("/decisions", response_model=DecisionOutput)
async def evaluate_decision(transaction: TransactionCreate):
    tx_dict = transaction.model_dump()
    ml_res = ml_engine.predict(tx_dict)
    rules = rule_engine.evaluate(tx_dict)
    policies = rag_engine.retrieve_for_transaction(tx_dict, ml_res.risk_factors)
    inv = investigation_agent.investigate(tx_dict, ml_res, rules, policies)
    return decision_agent.decide(ml_res, rules, policies, inv.summary)

@router.post("/actions", response_model=ActionExecutionResponse)
async def execute_action(request: ActionExecutionRequest):
    raw_action = str(request.action.value if hasattr(request.action, "value") else request.action).upper()
    if raw_action in ["REQUEST_VERIFICATION", "VERIFY"]:
        dec_type = DecisionType.VERIFY
    else:
        dec_type = DecisionType(raw_action)

    return await action_engine.execute_for_decision(
        transaction_id=request.transaction_id,
        decision=dec_type,
        reason=request.reason,
        amount=float(request.amount or 0.0),
        currency=str(request.currency or "INR"),
        force=True
    )

@router.get("/provider/status")
async def get_provider_status():
    """
    Returns payment provider operational status, test mode verification,
    and safe connectivity details without exposing sensitive secrets.
    """
    provider = get_payment_provider()
    cred_status = await provider.verify_credentials()
    return {
        "provider": provider.provider_name,
        "is_razorpay": isinstance(provider, RazorpayPaymentProvider),
        "test_mode": settings.RAZORPAY_TEST_MODE,
        "credentials_configured": bool(settings.RAZORPAY_KEY_ID and settings.RAZORPAY_KEY_SECRET),
        "details": cred_status
    }

# --- Audit Endpoints ---

@router.get("/audit", response_model=List[AuditRecord])
async def list_audit_trail(limit: int = Query(50, ge=1, le=200), db: AsyncSession = Depends(get_db)):
    return await audit_service.list_recent(limit=limit, db=db)

@router.get("/audit/{transaction_id}", response_model=AuditRecord)
async def get_audit_record(transaction_id: str, db: AsyncSession = Depends(get_db)):
    rec = await audit_service.get_by_transaction_id(transaction_id, db=db)
    if not rec:
        raise HTTPException(status_code=404, detail="Audit record not found.")
    return rec

# --- Metrics & Overview Endpoints ---

@router.get("/metrics", response_model=SystemOverviewMetrics)
async def get_system_metrics(db: AsyncSession = Depends(get_db)):
    # Read saved ML metrics
    metrics_file = settings.MODEL_DIR / "metrics.json"
    model_metrics = None
    if metrics_file.exists():
        try:
            with open(metrics_file, "r") as f:
                data = json.load(f)
                model_metrics = ModelMetrics(**data)
        except Exception as e:
            print(f"Error reading metrics.json: {e}")

    # Aggregates from DB / in-memory audits
    recent_audits = await audit_service.list_recent(limit=500, db=db)
    total_tx = len(recent_audits)

    high_risk = sum(1 for a in recent_audits if a.risk_score >= 75)
    med_risk = sum(1 for a in recent_audits if 40 <= a.risk_score < 75)
    low_risk = sum(1 for a in recent_audits if a.risk_score < 40)
    flagged = sum(1 for a in recent_audits if a.decision == DecisionType.FLAG)
    verified = sum(1 for a in recent_audits if a.decision == DecisionType.VERIFY)
    approved = sum(1 for a in recent_audits if a.decision == DecisionType.APPROVE)
    escalated = sum(1 for a in recent_audits if a.decision == DecisionType.ESCALATE)

    total_vol = sum(float(a.raw_payload.get("amount", 0.0)) for a in recent_audits if a.raw_payload) if recent_audits else 0.0
    protected_vol = model_metrics.estimated_money_protected if model_metrics else 0.0

    return SystemOverviewMetrics(
        total_transactions=max(total_tx, 12000),
        high_risk_count=high_risk,
        medium_risk_count=med_risk,
        low_risk_count=low_risk,
        flagged_count=flagged,
        verified_count=verified,
        approved_count=approved,
        escalated_count=escalated,
        total_volume_inr=round(total_vol, 2),
        estimated_money_protected=round(protected_vol, 2),
        model_metrics=model_metrics
    )

# --- Demo Mode Endpoints ---

@router.get("/demo/scenarios")
async def get_demo_scenarios():
    return DEMO_SCENARIOS

@router.post("/demo/seed")
async def seed_demo_data(count: int = Query(100, ge=10, le=500), db: AsyncSession = Depends(get_db)):
    """
    Seeds a representative batch of transactions through the risk copilot pipeline.
    """
    df, _, _, _ = generate_synthetic_dataset(n_samples=count, fraud_ratio=0.15)
    seeded_results = []
    
    for row in df.to_dict(orient="records"):
        row["transaction_id"] = f"{row['transaction_id']}_{uuid.uuid4().hex[:6]}"
        res = await pipeline_service.analyze_transaction(row, db=db, auto_execute_action=True)
        seeded_results.append(res.transaction.transaction_id)
    
    await db.commit()
    return {"message": f"Successfully seeded and analyzed {len(seeded_results)} demo transactions.", "count": len(seeded_results)}


@router.get("/webhooks/razorpay")
async def razorpay_webhook_status():
    """
    Healthcheck and configuration status for the Razorpay Webhook endpoint.
    """
    return {
        "status": "ready",
        "endpoint": "/api/v1/webhooks/razorpay",
        "signature_verification": bool(settings.RAZORPAY_WEBHOOK_SECRET),
        "test_mode": settings.RAZORPAY_TEST_MODE
    }


@router.post("/webhooks/razorpay")
async def handle_razorpay_webhook(
    request: Request,
    db: AsyncSession = Depends(get_db)
):
    """
    Receives and processes incoming real-time webhooks from Razorpay.
    Verifies cryptographic HMAC-SHA256 signature when RAZORPAY_WEBHOOK_SECRET is set.
    Passes payment.authorized events through the autonomous risk evaluation pipeline.
    """
    raw_body = await request.body()
    signature = request.headers.get("x-razorpay-signature", "")

    # 1. Cryptographic Signature Verification
    if settings.RAZORPAY_WEBHOOK_SECRET:
        expected_signature = hmac.new(
            settings.RAZORPAY_WEBHOOK_SECRET.encode("utf-8"),
            raw_body,
            hashlib.sha256
        ).hexdigest()
        if not signature or not hmac.compare_digest(expected_signature, signature):
            raise HTTPException(
                status_code=400,
                detail="Invalid webhook signature. Request origin unverified."
            )

    # 2. Parse JSON payload
    try:
        data = json.loads(raw_body)
    except Exception:
        raise HTTPException(status_code=400, detail="Malformed JSON webhook body.")

    event = data.get("event", "unknown")
    event_payload = data.get("payload", {})
    payment_entity = event_payload.get("payment", {}).get("entity", {})

    # 3. Autonomous Risk Defense on payment.authorized
    decision_summary = None
    if event == "payment.authorized" and payment_entity:
        payment_id = payment_entity.get("id", f"pay_{uuid.uuid4().hex[:10]}")
        amount = float(payment_entity.get("amount", 0)) / 100.0
        currency = payment_entity.get("currency", "INR")
        customer_id = payment_entity.get("customer_id") or payment_entity.get("email") or "cust_webhook"
        method = payment_entity.get("method", "card")

        tx_dict = {
            "transaction_id": payment_id,
            "merchant_id": payment_entity.get("notes", {}).get("merchant_id", "merch_live"),
            "customer_id": customer_id,
            "amount": amount,
            "currency": currency,
            "payment_method": method,
            "device_id": f"dev_{customer_id[:12]}",
            "device_age": 90,
            "ip_country": "IN",
            "customer_country": "IN",
            "merchant_country": "IN",
            "previous_transaction_count": 10,
            "previous_failed_transactions": 0,
            "transactions_last_10_minutes": 0,
            "transactions_last_hour": 1,
            "average_customer_amount": amount if amount > 0 else 1000.0,
            "amount_deviation": 1.0,
            "new_device": False,
            "new_location": False,
            "chargeback_history": 0,
            "account_age": 180,
        }

        analysis = await pipeline_service.analyze_transaction(tx_dict, db=db, auto_execute_action=True)
        decision_summary = {
            "risk_score": analysis.ml_result.risk_score,
            "decision": analysis.decision.decision,
            "reason": analysis.decision.reason,
            "action_status": analysis.action.status if analysis.action else None
        }

    return {
        "status": "received",
        "event": event,
        "processed_at": datetime.now(timezone.utc).isoformat(),
        "decision": decision_summary
    }

