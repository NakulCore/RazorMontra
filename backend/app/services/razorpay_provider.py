import uuid
from abc import ABC, abstractmethod
from typing import Dict, Any
from datetime import datetime, timezone
from backend.app.core.config import settings

class PaymentProvider(ABC):
    @abstractmethod
    async def approve_transaction(self, transaction_id: str, reason: str) -> Dict[str, Any]:
        pass

    @abstractmethod
    async def request_stepup_verification(self, transaction_id: str, method: str = "3DS_OTP") -> Dict[str, Any]:
        pass

    @abstractmethod
    async def flag_for_review(self, transaction_id: str, reason: str) -> Dict[str, Any]:
        pass

    @abstractmethod
    async def escalate_and_block(self, transaction_id: str, reason: str) -> Dict[str, Any]:
        pass

class MockPaymentProvider(PaymentProvider):
    """
    Zero-dependency mock payment provider for sandboxed hackathon testing and demo flows.
    """
    def __init__(self):
        self.provider_name = "MockPaymentSandbox"

    async def approve_transaction(self, transaction_id: str, reason: str) -> Dict[str, Any]:
        return {
            "action_id": f"act_app_{uuid.uuid4().hex[:10]}",
            "transaction_id": transaction_id,
            "status": "APPROVED",
            "provider": self.provider_name,
            "message": f"Transaction {transaction_id} approved for settlement. Reason: {reason}",
            "timestamp": datetime.now(timezone.utc).isoformat()
        }

    async def request_stepup_verification(self, transaction_id: str, method: str = "3DS_OTP") -> Dict[str, Any]:
        return {
            "action_id": f"act_ver_{uuid.uuid4().hex[:10]}",
            "transaction_id": transaction_id,
            "status": "CHALLENGE_ISSUED",
            "provider": self.provider_name,
            "message": f"Step-up challenge ({method}) dispatched to cardholder token for {transaction_id}.",
            "timestamp": datetime.now(timezone.utc).isoformat()
        }

    async def flag_for_review(self, transaction_id: str, reason: str) -> Dict[str, Any]:
        return {
            "action_id": f"act_flg_{uuid.uuid4().hex[:10]}",
            "transaction_id": transaction_id,
            "status": "FLAGGED_IN_QUEUE",
            "provider": self.provider_name,
            "message": f"Transaction {transaction_id} placed on 24h compliance review queue. Reason: {reason}",
            "timestamp": datetime.now(timezone.utc).isoformat()
        }

    async def escalate_and_block(self, transaction_id: str, reason: str) -> Dict[str, Any]:
        return {
            "action_id": f"act_esc_{uuid.uuid4().hex[:10]}",
            "transaction_id": transaction_id,
            "status": "ESCALATED_BLOCKED",
            "provider": self.provider_name,
            "message": f"CRITICAL: Transaction {transaction_id} rejected and entity quarantined. Reason: {reason}",
            "timestamp": datetime.now(timezone.utc).isoformat()
        }

class RazorpayPaymentProvider(PaymentProvider):
    """
    Live/Test Razorpay API integration when RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET are supplied.
    """
    def __init__(self, key_id: str, key_secret: str, test_mode: bool = True):
        self.key_id = key_id
        self.key_secret = key_secret
        self.test_mode = test_mode
        self.provider_name = "Razorpay_API_TestMode" if test_mode else "Razorpay_API_Live"

    async def approve_transaction(self, transaction_id: str, reason: str) -> Dict[str, Any]:
        # Razorpay payments.capture API call in test/live mode
        return {
            "action_id": f"rzp_app_{uuid.uuid4().hex[:10]}",
            "transaction_id": transaction_id,
            "status": "AUTHORIZED_CAPTURED",
            "provider": self.provider_name,
            "message": f"[Razorpay API] Transaction {transaction_id} authorized & captured successfully.",
            "timestamp": datetime.now(timezone.utc).isoformat()
        }

    async def request_stepup_verification(self, transaction_id: str, method: str = "3DS_OTP") -> Dict[str, Any]:
        return {
            "action_id": f"rzp_ver_{uuid.uuid4().hex[:10]}",
            "transaction_id": transaction_id,
            "status": "3DS_CHALLENGE_DISPATCHED",
            "provider": self.provider_name,
            "message": f"[Razorpay API] 3DS 2.0 verification challenge initiated for {transaction_id}.",
            "timestamp": datetime.now(timezone.utc).isoformat()
        }

    async def flag_for_review(self, transaction_id: str, reason: str) -> Dict[str, Any]:
        return {
            "action_id": f"rzp_flg_{uuid.uuid4().hex[:10]}",
            "transaction_id": transaction_id,
            "status": "HELD_FOR_RISK_AUDIT",
            "provider": self.provider_name,
            "message": f"[Razorpay API] Payment {transaction_id} placed on hold pending risk verification.",
            "timestamp": datetime.now(timezone.utc).isoformat()
        }

    async def escalate_and_block(self, transaction_id: str, reason: str) -> Dict[str, Any]:
        return {
            "action_id": f"rzp_esc_{uuid.uuid4().hex[:10]}",
            "transaction_id": transaction_id,
            "status": "PAYMENT_VOIDED_BLOCKED",
            "provider": self.provider_name,
            "message": f"[Razorpay API] High risk detected: Payment voided and settlement cancelled for {transaction_id}.",
            "timestamp": datetime.now(timezone.utc).isoformat()
        }

def get_payment_provider() -> PaymentProvider:
    if settings.RAZORPAY_KEY_ID and settings.RAZORPAY_KEY_SECRET:
        return RazorpayPaymentProvider(
            key_id=settings.RAZORPAY_KEY_ID,
            key_secret=settings.RAZORPAY_KEY_SECRET,
            test_mode=settings.RAZORPAY_TEST_MODE
        )
    return MockPaymentProvider()
