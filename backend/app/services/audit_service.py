import uuid
from typing import Dict, Any, List, Optional
from datetime import datetime, timezone
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, desc

from backend.app.models.schemas import (
    AuditRecord, MLRiskOutput, RuleResult, PolicyClause,
    InvestigationOutput, DecisionOutput, ActionExecutionResponse
)
from backend.app.models.db_models import DBAuditRecord

class AuditService:
    def __init__(self):
        # Fast in-memory audit store for low-latency queries and testing
        self._memory_store: Dict[str, AuditRecord] = {}

    async def record_audit(
        self,
        transaction: Dict[str, Any],
        ml_result: MLRiskOutput,
        rules: List[RuleResult],
        policies: List[PolicyClause],
        investigation: InvestigationOutput,
        decision: DecisionOutput,
        action: ActionExecutionResponse,
        db: Optional[AsyncSession] = None
    ) -> AuditRecord:
        """
        Creates an immutable audit trail record for a risk analysis event.
        """
        tx_id = str(transaction.get("transaction_id", f"txn_{uuid.uuid4().hex[:8]}"))
        audit_id = f"aud_{uuid.uuid4().hex[:12]}"
        now = datetime.now(timezone.utc)

        rule_data = [
            {
                "rule": r.rule,
                "triggered": r.triggered,
                "severity": r.severity.value,
                "reason": r.reason,
                "risk_points": r.risk_points
            }
            for r in rules
        ]

        record = AuditRecord(
            audit_id=audit_id,
            transaction_id=tx_id,
            timestamp=now,
            model_version=ml_result.model_version,
            risk_score=ml_result.risk_score,
            risk_class=ml_result.risk_class,
            risk_factors=ml_result.risk_factors,
            rule_results=rule_data,
            retrieved_policy_ids=[p.policy_id for p in policies],
            investigation_summary=investigation.summary,
            decision=decision.decision,
            action=action.action,
            status=action.status,
            raw_payload=transaction
        )

        # Store in memory
        self._memory_store[tx_id] = record

        # Persist to database if session provided
        if db is not None:
            try:
                db_record = DBAuditRecord(
                    audit_id=record.audit_id,
                    transaction_id=record.transaction_id,
                    timestamp=record.timestamp,
                    model_version=record.model_version,
                    risk_score=record.risk_score,
                    risk_class=record.risk_class.value,
                    risk_factors=record.risk_factors,
                    rule_results=record.rule_results,
                    retrieved_policy_ids=record.retrieved_policy_ids,
                    investigation_summary=record.investigation_summary,
                    decision=record.decision.value,
                    action=record.action.value,
                    status=record.status,
                    raw_payload=record.raw_payload
                )
                db.add(db_record)
                await db.commit()
            except Exception as e:
                print(f"Warning: Failed to persist audit to DB: {e}")

        return record

    async def get_by_transaction_id(
        self, transaction_id: str, db: Optional[AsyncSession] = None
    ) -> Optional[AuditRecord]:
        if transaction_id in self._memory_store:
            return self._memory_store[transaction_id]

        if db is not None:
            try:
                stmt = select(DBAuditRecord).where(DBAuditRecord.transaction_id == transaction_id)
                res = await db.execute(stmt)
                db_rec = res.scalar_one_or_none()
                if db_rec:
                    return AuditRecord.model_validate(db_rec)
            except Exception as e:
                print(f"Error fetching audit from DB: {e}")

        return None

    async def list_recent(
        self, limit: int = 50, db: Optional[AsyncSession] = None
    ) -> List[AuditRecord]:
        if db is not None:
            try:
                stmt = select(DBAuditRecord).order_by(desc(DBAuditRecord.timestamp)).limit(limit)
                res = await db.execute(stmt)
                db_recs = res.scalars().all()
                if db_recs:
                    return [AuditRecord.model_validate(r) for r in db_recs]
            except Exception as e:
                print(f"Error querying audit list from DB: {e}")

        return list(self._memory_store.values())[-limit:]

audit_service = AuditService()
