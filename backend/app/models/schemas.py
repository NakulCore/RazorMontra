from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field, ConfigDict
from datetime import datetime
from enum import Enum

class RiskClass(str, Enum):
    LOW = "LOW"
    MEDIUM = "MEDIUM"
    HIGH = "HIGH"
    CRITICAL = "CRITICAL"

class DecisionType(str, Enum):
    APPROVE = "APPROVE"
    VERIFY = "VERIFY"
    FLAG = "FLAG"
    ESCALATE = "ESCALATE"

class ActionType(str, Enum):
    APPROVE = "approve"
    VERIFY = "verify"
    REQUEST_VERIFICATION = "request_verification"
    FLAG = "flag"
    ESCALATE = "escalate"

class PaymentMethod(str, Enum):
    CARD = "card"
    UPI = "upi"
    NETBANKING = "netbanking"
    WALLET = "wallet"

# --- Transaction Schemas ---
class TransactionBase(BaseModel):
    merchant_id: str
    customer_id: str
    amount: float
    currency: str = "INR"
    payment_method: str = "card"
    device_id: str
    device_age: int = 0
    ip_country: str = "IN"
    customer_country: str = "IN"
    merchant_country: str = "IN"
    previous_transaction_count: int = 0
    previous_failed_transactions: int = 0
    transactions_last_10_minutes: int = 0
    transactions_last_hour: int = 0
    average_customer_amount: float = 0.0
    amount_deviation: float = 0.0
    new_device: bool = False
    new_location: bool = False
    chargeback_history: int = 0
    account_age: int = 30

class TransactionCreate(TransactionBase):
    transaction_id: Optional[str] = None
    timestamp: Optional[datetime] = None
    is_fraud: Optional[bool] = None

class TransactionResponse(TransactionBase):
    transaction_id: str
    timestamp: datetime
    is_fraud: Optional[bool] = None

    model_config = ConfigDict(from_attributes=True)

# --- Rule Engine Schemas ---
class RuleSeverity(str, Enum):
    LOW = "LOW"
    MEDIUM = "MEDIUM"
    HIGH = "HIGH"
    CRITICAL = "CRITICAL"

class RuleResult(BaseModel):
    rule: str
    triggered: bool
    severity: RuleSeverity
    reason: str
    risk_points: int = 0

# --- ML & Explainability Schemas ---
class FeatureContribution(BaseModel):
    feature: str
    contribution_score: float
    impact: str  # POSITIVE / NEGATIVE / NEUTRAL
    description: str

class MLRiskOutput(BaseModel):
    risk_score: int = Field(ge=0, le=100, description="Risk score 0-100")
    risk_probability: float = Field(ge=0.0, le=1.0, description="Calibrated risk probability")
    risk_class: RiskClass
    risk_factors: List[str]
    feature_contributions: List[FeatureContribution] = []
    model_version: str

# --- Policy & RAG Schemas ---
class PolicyClause(BaseModel):
    policy_id: str
    title: str
    category: str
    text: str
    relevance_score: float = 1.0

class PolicySearchRequest(BaseModel):
    query: str
    top_k: int = 3

# --- AI Agents Schemas ---
class InvestigationOutput(BaseModel):
    summary: str
    risk_factors: List[str]
    missing_information: List[str]
    recommended_next_step: str
    confidence: float = Field(ge=0.0, le=1.0)
    agent_status: str = "SUCCESS"

class DecisionOutput(BaseModel):
    decision: DecisionType
    reason: str
    policy_ids: List[str]
    risk_score: int
    confidence: float
    safeguard_applied: bool = False

# --- Action Schemas ---
class ActionExecutionRequest(BaseModel):
    transaction_id: str
    action: ActionType
    reason: str
    amount: Optional[float] = 0.0
    currency: Optional[str] = "INR"
    executed_by: str = "copilot_agent"

class ActionExecutionResponse(BaseModel):
    action_id: str
    transaction_id: str
    action: ActionType
    status: str
    message: str
    timestamp: datetime
    provider: str

# --- Comprehensive Analysis & Audit ---
class ComprehensiveRiskAnalysis(BaseModel):
    transaction: TransactionResponse
    ml_result: MLRiskOutput
    rule_results: List[RuleResult]
    rules_triggered_count: int
    retrieved_policies: List[PolicyClause]
    investigation: InvestigationOutput
    decision: DecisionOutput
    action: ActionExecutionResponse
    audit_id: str
    timestamp: datetime

class AuditRecord(BaseModel):
    audit_id: str
    transaction_id: str
    timestamp: datetime
    model_version: str
    risk_score: int
    risk_class: RiskClass
    risk_factors: List[str]
    rule_results: List[Dict[str, Any]]
    retrieved_policy_ids: List[str]
    investigation_summary: str
    decision: DecisionType
    action: ActionType
    status: str
    raw_payload: Optional[Dict[str, Any]] = None

    model_config = ConfigDict(from_attributes=True)

class ModelMetrics(BaseModel):
    model_name: str
    model_version: str
    precision: float
    recall: float
    f1_score: float
    accuracy: float
    roc_auc: float
    false_positive_rate: float
    false_negative_rate: float
    total_test_samples: int
    fraud_samples: int
    non_fraud_samples: int
    true_negatives: int = 0
    false_positives: int = 0
    false_negatives: int = 0
    true_positives: int = 0
    confusion_matrix: List[List[int]] = []
    total_fraud_value: float = 0.0
    fraud_value_detected: float = 0.0
    false_negative_cost: float = 0.0
    false_positive_cost: float = 0.0
    estimated_money_protected: float = 0.0
    threshold_used: float = 0.50
    evaluated_at: str = ""
    candidate_comparison: Dict[str, float] = {}
    boundary_errors: Dict[str, List[Dict[str, Any]]] = {}

class SystemOverviewMetrics(BaseModel):
    total_transactions: int
    high_risk_count: int
    medium_risk_count: int
    low_risk_count: int
    flagged_count: int
    verified_count: int
    approved_count: int
    escalated_count: int
    total_volume_inr: float
    estimated_money_protected: float
    model_metrics: Optional[ModelMetrics] = None
