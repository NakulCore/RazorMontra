from typing import Dict, Any, Optional
from datetime import datetime, timezone
from backend.app.models.schemas import ActionExecutionResponse, ActionType, DecisionType
from backend.app.services.razorpay_provider import get_payment_provider, PaymentProvider

class ActionEngine:
    def __init__(self, provider: Optional[PaymentProvider] = None):
        self.provider = provider or get_payment_provider()
        self._action_history: Dict[str, ActionExecutionResponse] = {}

    async def execute_for_decision(
        self,
        transaction_id: str,
        decision: DecisionType,
        reason: str
    ) -> ActionExecutionResponse:
        """
        Idempotently executes the appropriate safe fintech action based on the agent's decision.
        """
        # Idempotency check: if action already recorded for this transaction, return cached result
        if transaction_id in self._action_history:
            cached = self._action_history[transaction_id]
            return cached

        # Map Decision to Action
        if decision == DecisionType.APPROVE:
            res = await self.provider.approve_transaction(transaction_id, reason)
            action_type = ActionType.APPROVE
        elif decision == DecisionType.VERIFY:
            res = await self.provider.request_stepup_verification(transaction_id)
            action_type = ActionType.REQUEST_VERIFICATION
        elif decision == DecisionType.FLAG:
            res = await self.provider.flag_for_review(transaction_id, reason)
            action_type = ActionType.FLAG
        elif decision == DecisionType.ESCALATE:
            res = await self.provider.escalate_and_block(transaction_id, reason)
            action_type = ActionType.ESCALATE
        else:
            res = await self.provider.flag_for_review(transaction_id, f"Unrecognized decision {decision}")
            action_type = ActionType.FLAG

        response = ActionExecutionResponse(
            action_id=res.get("action_id", f"act_{transaction_id}"),
            transaction_id=transaction_id,
            action=action_type,
            status=res.get("status", "COMPLETED"),
            message=res.get("message", "Action processed"),
            timestamp=datetime.now(timezone.utc),
            provider=res.get("provider", "MockPaymentProvider")
        )

        self._action_history[transaction_id] = response
        return response

action_engine = ActionEngine()
