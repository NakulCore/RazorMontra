from sqlalchemy import Column, String, Integer, Float, Boolean, DateTime, Text, JSON
from datetime import datetime, timezone
from backend.app.core.database import Base

class DBTransaction(Base):
    __tablename__ = "transactions"

    transaction_id = Column(String(64), primary_key=True, index=True)
    merchant_id = Column(String(64), index=True, nullable=False)
    customer_id = Column(String(64), index=True, nullable=False)
    timestamp = Column(DateTime, default=lambda: datetime.now(timezone.utc), index=True)
    amount = Column(Float, nullable=False)
    currency = Column(String(10), default="INR")
    payment_method = Column(String(32), default="card")
    device_id = Column(String(64), index=True)
    device_age = Column(Integer, default=0)
    ip_country = Column(String(10), default="IN")
    customer_country = Column(String(10), default="IN")
    merchant_country = Column(String(10), default="IN")
    previous_transaction_count = Column(Integer, default=0)
    previous_failed_transactions = Column(Integer, default=0)
    transactions_last_10_minutes = Column(Integer, default=0)
    transactions_last_hour = Column(Integer, default=0)
    average_customer_amount = Column(Float, default=0.0)
    amount_deviation = Column(Float, default=0.0)
    new_device = Column(Boolean, default=False)
    new_location = Column(Boolean, default=False)
    chargeback_history = Column(Integer, default=0)
    account_age = Column(Integer, default=30)
    is_fraud = Column(Boolean, nullable=True)

class DBAuditRecord(Base):
    __tablename__ = "audit_records"

    audit_id = Column(String(64), primary_key=True, index=True)
    transaction_id = Column(String(64), index=True, nullable=False)
    timestamp = Column(DateTime, default=lambda: datetime.now(timezone.utc), index=True)
    model_version = Column(String(32), nullable=False)
    risk_score = Column(Integer, nullable=False)
    risk_class = Column(String(16), nullable=False)
    risk_factors = Column(JSON, default=list)
    rule_results = Column(JSON, default=list)
    retrieved_policy_ids = Column(JSON, default=list)
    investigation_summary = Column(Text, nullable=False)
    decision = Column(String(32), nullable=False)
    action = Column(String(32), nullable=False)
    status = Column(String(32), nullable=False)
    raw_payload = Column(JSON, nullable=True)

class DBPolicy(Base):
    __tablename__ = "policies"

    policy_id = Column(String(64), primary_key=True, index=True)
    title = Column(String(255), nullable=False)
    category = Column(String(64), nullable=False)
    text = Column(Text, nullable=False)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
