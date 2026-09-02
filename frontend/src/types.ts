export type RiskClass = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
export type DecisionType = 'APPROVE' | 'VERIFY' | 'FLAG' | 'ESCALATE';
export type ActionType = 'approve' | 'request_verification' | 'flag' | 'escalate';

export interface Transaction {
  transaction_id: string;
  merchant_id: string;
  customer_id: string;
  timestamp: string;
  amount: number;
  currency: string;
  payment_method: string;
  device_id: string;
  device_age: number;
  ip_country: string;
  customer_country: string;
  merchant_country: string;
  previous_transaction_count: number;
  previous_failed_transactions: number;
  transactions_last_10_minutes: number;
  transactions_last_hour: number;
  average_customer_amount: number;
  amount_deviation: number;
  new_device: boolean;
  new_location: boolean;
  chargeback_history: number;
  account_age: number;
  is_fraud?: boolean;
}

export interface RuleResult {
  rule: string;
  triggered: boolean;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  reason: string;
  risk_points: number;
}

export interface FeatureContribution {
  feature: string;
  contribution_score: number;
  impact: 'POSITIVE' | 'NEGATIVE' | 'NEUTRAL';
  description: string;
}

export interface MLRiskOutput {
  risk_score: number;
  risk_probability: number;
  risk_class: RiskClass;
  risk_factors: string[];
  feature_contributions: FeatureContribution[];
  model_version: string;
}

export interface PolicyClause {
  policy_id: string;
  title: string;
  category: string;
  text: string;
  relevance_score: number;
}

export interface InvestigationOutput {
  summary: string;
  risk_factors: string[];
  missing_information: string[];
  recommended_next_step: string;
  confidence: number;
  agent_status: string;
}

export interface DecisionOutput {
  decision: DecisionType;
  reason: string;
  policy_ids: string[];
  risk_score: number;
  confidence: number;
  safeguard_applied: boolean;
}

export interface ActionExecutionResponse {
  action_id: string;
  transaction_id: string;
  action: ActionType;
  status: string;
  message: string;
  timestamp: string;
  provider: string;
}

export interface ComprehensiveRiskAnalysis {
  transaction: Transaction;
  ml_result: MLRiskOutput;
  rule_results: RuleResult[];
  rules_triggered_count: number;
  retrieved_policies: PolicyClause[];
  investigation: InvestigationOutput;
  decision: DecisionOutput;
  action: ActionExecutionResponse;
  audit_id: string;
  timestamp: string;
}

export interface AuditRecord {
  audit_id: string;
  transaction_id: string;
  timestamp: string;
  model_version: string;
  risk_score: number;
  risk_class: RiskClass;
  risk_factors: string[];
  rule_results: {
    rule: string;
    triggered: boolean;
    severity: string;
    reason: string;
    risk_points: number;
  }[];
  retrieved_policy_ids: string[];
  investigation_summary: string;
  decision: DecisionType;
  action: ActionType;
  status: string;
  raw_payload?: any;
}

export interface ModelMetrics {
  model_name: string;
  model_version: string;
  precision: number;
  recall: number;
  f1_score: number;
  accuracy: number;
  roc_auc: number;
  false_positive_rate: number;
  false_negative_rate: number;
  total_test_samples: number;
  fraud_samples: number;
  non_fraud_samples: number;
  fraud_value_detected: number;
  estimated_money_protected: number;
  false_positive_cost: number;
  false_negative_cost: number;
  threshold_used: number;
  evaluated_at: string;
  candidate_comparison?: Record<string, number>;
}

export interface SystemOverviewMetrics {
  total_transactions: number;
  high_risk_count: number;
  medium_risk_count: number;
  low_risk_count: number;
  flagged_count: number;
  verified_count: number;
  approved_count: number;
  escalated_count: number;
  total_volume_inr: number;
  estimated_money_protected: number;
  model_metrics?: ModelMetrics;
}

export interface DemoScenario {
  name: string;
  description: string;
  payload: Partial<Transaction>;
}
