import uuid
from typing import Dict, Any, Optional
from datetime import datetime, timezone
from sqlalchemy.ext.asyncio import AsyncSession

from backend.app.models.schemas import (
    ComprehensiveRiskAnalysis, TransactionResponse, TransactionCreate,
    MLRiskOutput, RuleResult, InvestigationOutput, DecisionOutput, ActionExecutionResponse
)
from backend.app.services.ml_engine import ml_engine
from backend.app.services.rule_engine import rule_engine
from backend.app.services.rag_engine import rag_engine
from backend.app.services.investigation_agent import investigation_agent
from backend.app.services.decision_agent import decision_agent
from backend.app.services.action_engine import action_engine
from backend.app.services.audit_service import audit_service

class RiskCopilotPipeline:
    def __init__(self):
        self.ml_engine = ml_engine
        self.rule_engine = rule_engine
        self.rag_engine = rag_engine
        self.investigation_agent = investigation_agent
        self.decision_agent = decision_agent
        self.action_engine = action_engine
        self.audit_service = audit_service

    async def analyze_transaction(
        self,
        tx_dict: Dict[str, Any],
        db: Optional[AsyncSession] = None,
        auto_execute_action: bool = True
    ) -> ComprehensiveRiskAnalysis:
        """
        Executes the complete defense-in-depth AI risk workflow:
        Transaction -> Feature Extraction -> ML Model -> Rules -> RAG -> AI Agent -> Decision -> Action -> Audit
        """
        # Ensure transaction_id and timestamp
        tx_id = str(tx_dict.get("transaction_id") or f"txn_{uuid.uuid4().hex[:10]}")
        tx_dict["transaction_id"] = tx_id
        if "timestamp" not in tx_dict or not tx_dict["timestamp"]:
            tx_dict["timestamp"] = datetime.now(timezone.utc).isoformat()

        # 1. ML Risk Prediction & Grounded Feature Attributions
        ml_result: MLRiskOutput = self.ml_engine.predict(tx_dict)

        # 2. Deterministic Rule Evaluation
        rules = self.rule_engine.evaluate(tx_dict)
        triggered_rules_count = sum(1 for r in rules if r.triggered)

        # 3. RAG Policy Knowledge Retrieval
        retrieved_policies = self.rag_engine.retrieve_for_transaction(tx_dict, ml_result.risk_factors)

        # 4. AI Investigation Agent Synthesis
        investigation = self.investigation_agent.investigate(
            transaction=tx_dict,
            ml_result=ml_result,
            rules=rules,
            policies=retrieved_policies
        )

        # 5. Bounded Decision Agent
        decision = self.decision_agent.decide(
            ml_result=ml_result,
            rules=rules,
            policies=retrieved_policies,
            investigation_summary=investigation.summary
        )

        # 6. Safe Action Execution (Idempotent)
        if auto_execute_action:
            action_res = await self.action_engine.execute_for_decision(
                transaction_id=tx_id,
                decision=decision.decision,
                reason=decision.reason
            )
        else:
            action_res = ActionExecutionResponse(
                action_id=f"act_dry_{tx_id}",
                transaction_id=tx_id,
                action=decision.decision.value.lower(),
                status="PENDING_MANUAL_DISPATCH",
                message="Action pending manual dispatch",
                timestamp=datetime.now(timezone.utc),
                provider="DryRun"
            )

        # 7. Immutable Audit Trail Snapshot
        audit_record = await self.audit_service.record_audit(
            transaction=tx_dict,
            ml_result=ml_result,
            rules=rules,
            policies=retrieved_policies,
            investigation=investigation,
            decision=decision,
            action=action_res,
            db=db
        )

        # Format Transaction Response
        tx_response = TransactionResponse(
            transaction_id=tx_id,
            merchant_id=str(tx_dict.get("merchant_id", "merch_0001")),
            customer_id=str(tx_dict.get("customer_id", "cust_0001")),
            timestamp=datetime.fromisoformat(str(tx_dict["timestamp"]).replace("Z", "+00:00")),
            amount=float(tx_dict.get("amount", 0.0)),
            currency=str(tx_dict.get("currency", "INR")),
            payment_method=str(tx_dict.get("payment_method", "card")),
            device_id=str(tx_dict.get("device_id", "dev_unknown")),
            device_age=int(tx_dict.get("device_age", 0)),
            ip_country=str(tx_dict.get("ip_country", "IN")),
            customer_country=str(tx_dict.get("customer_country", "IN")),
            merchant_country=str(tx_dict.get("merchant_country", "IN")),
            previous_transaction_count=int(tx_dict.get("previous_transaction_count", 0)),
            previous_failed_transactions=int(tx_dict.get("previous_failed_transactions", 0)),
            transactions_last_10_minutes=int(tx_dict.get("transactions_last_10_minutes", 0)),
            transactions_last_hour=int(tx_dict.get("transactions_last_hour", 0)),
            average_customer_amount=float(tx_dict.get("average_customer_amount", 0.0)),
            amount_deviation=float(tx_dict.get("amount_deviation", 0.0)),
            new_device=bool(tx_dict.get("new_device", False)),
            new_location=bool(tx_dict.get("new_location", False)),
            chargeback_history=int(tx_dict.get("chargeback_history", 0)),
            account_age=int(tx_dict.get("account_age", 30)),
            is_fraud=tx_dict.get("is_fraud")
        )

        return ComprehensiveRiskAnalysis(
            transaction=tx_response,
            ml_result=ml_result,
            rule_results=rules,
            rules_triggered_count=triggered_rules_count,
            retrieved_policies=retrieved_policies,
            investigation=investigation,
            decision=decision,
            action=action_res,
            audit_id=audit_record.audit_id,
            timestamp=datetime.now(timezone.utc)
        )

pipeline_service = RiskCopilotPipeline()
