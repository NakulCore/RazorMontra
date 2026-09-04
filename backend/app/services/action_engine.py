from typing import Dict, Any, Optional
from datetime import datetime, timezone
from backend.app.models.schemas import ActionExecutionResponse, ActionType, DecisionType
from backend.app.services.razorpay_provider import get_payment_provider, PaymentProvider

class ActionEngine:
    def __init__(self, provider: Optional[PaymentProvider] = None):
        self._custom_provider = provider
        self._action_history: Dict[str, ActionExecutionResponse] = {}

    @property
    def provider(self) -> PaymentProvider:
        if self._custom_provider:
            return self._custom_provider
        return get_payment_provider()

    async def execute_for_decision(
        self,
        transaction_id: str,
        decision: DecisionType,
        reason: str,
        amount: float = 0.0,
        currency: str = "INR",
        force: bool = False
    ) -> ActionExecutionResponse:
        """
        Idempotently executes the appropriate safe fintech action based on the agent's decision.
        If force=True, re-executes and overrides cached action.
        """
        # Idempotency check: if action already recorded for this transaction, return cached result
        if not force and transaction_id in self._action_history:
            cached = self._action_history[transaction_id]
            return cached

        prov = self.provider

        # Map Decision to Action
        if decision == DecisionType.APPROVE:
            res = await prov.approve_transaction(transaction_id, reason, amount=amount, currency=currency)
            action_type = ActionType.APPROVE
        elif decision == DecisionType.VERIFY:
            res = await prov.request_stepup_verification(transaction_id, method="3DS_OTP", amount=amount, currency=currency)
            action_type = ActionType.REQUEST_VERIFICATION
        elif decision == DecisionType.FLAG:
            res = await prov.flag_for_review(transaction_id, reason, amount=amount, currency=currency)
            action_type = ActionType.FLAG
        elif decision == DecisionType.ESCALATE:
            res = await prov.escalate_and_block(transaction_id, reason, amount=amount, currency=currency)
            action_type = ActionType.ESCALATE
        else:
            res = await prov.flag_for_review(transaction_id, f"Unrecognized decision {decision}", amount=amount, currency=currency)
            action_type = ActionType.FLAG

        response = ActionExecutionResponse(
            action_id=res.get("action_id", f"act_{transaction_id}"),
            transaction_id=transaction_id,
            action=action_type,
            status=res.get("status", "COMPLETED"),
            message=res.get("message", "Action processed"),
            timestamp=datetime.now(timezone.utc),
            provider=res.get("provider", prov.provider_name)
        )

        self._action_history[transaction_id] = response
        return response

action_engine = ActionEngine()
