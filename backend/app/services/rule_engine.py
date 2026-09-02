from typing import Dict, Any, List
from backend.app.models.schemas import RuleResult, RuleSeverity

class RuleConfig:
    HIGH_AMOUNT_ABSOLUTE_INR: float = 50000.0
    HIGH_AMOUNT_DEVIATION_RATIO: float = 3.5
    HIGH_VELOCITY_10M: int = 4
    HIGH_VELOCITY_1H: int = 7
    REPEATED_FAILURES_THRESHOLD: int = 2
    NEW_DEVICE_AGE_DAYS: int = 3
    OFFSHORE_HIGH_VALUE_INR: float = 20000.0

class RuleEngine:
    def __init__(self, config: RuleConfig = None):
        self.config = config or RuleConfig()

    def evaluate(self, transaction: Dict[str, Any]) -> List[RuleResult]:
        results: List[RuleResult] = []

        amount = float(transaction.get("amount", 0.0))
        avg_amount = float(transaction.get("average_customer_amount", 100.0))
        if avg_amount <= 0:
            avg_amount = 100.0
        ratio = amount / avg_amount

        tx_10m = int(transaction.get("transactions_last_10_minutes", 0))
        tx_1h = int(transaction.get("transactions_last_hour", 0))
        prev_failed = int(transaction.get("previous_failed_transactions", 0))
        new_device = bool(transaction.get("new_device", False))
        device_age = int(transaction.get("device_age", 0))
        new_loc = bool(transaction.get("new_location", False))
        ip_country = str(transaction.get("ip_country", "IN"))
        cust_country = str(transaction.get("customer_country", "IN"))
        chargebacks = int(transaction.get("chargeback_history", 0))

        # 1. HIGH_AMOUNT Rule
        if amount >= self.config.HIGH_AMOUNT_ABSOLUTE_INR or ratio >= self.config.HIGH_AMOUNT_DEVIATION_RATIO:
            results.append(RuleResult(
                rule="RULE_HIGH_AMOUNT",
                triggered=True,
                severity=RuleSeverity.HIGH if ratio >= 5.0 or amount >= 100000 else RuleSeverity.MEDIUM,
                reason=f"Transaction value ₹{amount:,.2f} exceeds threshold ({ratio:.1f}x customer average).",
                risk_points=25
            ))
        else:
            results.append(RuleResult(
                rule="RULE_HIGH_AMOUNT",
                triggered=False,
                severity=RuleSeverity.LOW,
                reason="Amount is within standard historical variance.",
                risk_points=0
            ))

        # 2. HIGH_VELOCITY Rule
        if tx_10m >= self.config.HIGH_VELOCITY_10M or tx_1h >= self.config.HIGH_VELOCITY_1H:
            results.append(RuleResult(
                rule="RULE_HIGH_VELOCITY",
                triggered=True,
                severity=RuleSeverity.HIGH if tx_10m >= 6 else RuleSeverity.MEDIUM,
                reason=f"Velocity trigger: {tx_10m} txns in 10m / {tx_1h} txns in 1h.",
                risk_points=30
            ))
        else:
            results.append(RuleResult(
                rule="RULE_HIGH_VELOCITY",
                triggered=False,
                severity=RuleSeverity.LOW,
                reason="Transaction frequency is within normal limits.",
                risk_points=0
            ))

        # 3. NEW_DEVICE Rule
        if new_device and device_age <= self.config.NEW_DEVICE_AGE_DAYS:
            results.append(RuleResult(
                rule="RULE_NEW_DEVICE",
                triggered=True,
                severity=RuleSeverity.MEDIUM,
                reason=f"First-time device access detected (Device age: {device_age} days).",
                risk_points=15
            ))
        else:
            results.append(RuleResult(
                rule="RULE_NEW_DEVICE",
                triggered=False,
                severity=RuleSeverity.LOW,
                reason="Known customer device fingerprint.",
                risk_points=0
            ))

        # 4. LOCATION_MISMATCH Rule
        if new_loc or (ip_country != cust_country):
            results.append(RuleResult(
                rule="RULE_LOCATION_MISMATCH",
                triggered=True,
                severity=RuleSeverity.HIGH if (ip_country in ["RU", "NG", "VN", "RO", "UA", "BR"] and cust_country == "IN") else RuleSeverity.MEDIUM,
                reason=f"IP country ({ip_country}) does not match registered customer country ({cust_country}).",
                risk_points=20
            ))
        else:
            results.append(RuleResult(
                rule="RULE_LOCATION_MISMATCH",
                triggered=False,
                severity=RuleSeverity.LOW,
                reason="Geographic origin matches customer profile.",
                risk_points=0
            ))

        # 5. REPEATED_FAILURES Rule
        if prev_failed >= self.config.REPEATED_FAILURES_THRESHOLD:
            results.append(RuleResult(
                rule="RULE_REPEATED_FAILURES",
                triggered=True,
                severity=RuleSeverity.HIGH if prev_failed >= 4 else RuleSeverity.MEDIUM,
                reason=f"{prev_failed} failed payment attempts observed prior to current authorization.",
                risk_points=20
            ))
        else:
            results.append(RuleResult(
                rule="RULE_REPEATED_FAILURES",
                triggered=False,
                severity=RuleSeverity.LOW,
                reason="No preceding failure pattern detected.",
                risk_points=0
            ))

        # 6. CHARGEBACK_HISTORY Rule
        if chargebacks > 0:
            results.append(RuleResult(
                rule="RULE_CHARGEBACK_HISTORY",
                triggered=True,
                severity=RuleSeverity.CRITICAL if chargebacks >= 2 else RuleSeverity.HIGH,
                reason=f"Account has {chargebacks} recorded prior chargeback/dispute incidents.",
                risk_points=35
            ))
        else:
            results.append(RuleResult(
                rule="RULE_CHARGEBACK_HISTORY",
                triggered=False,
                severity=RuleSeverity.LOW,
                reason="Clean customer dispute history.",
                risk_points=0
            ))

        # 7. OFFSHORE_HIGH_VALUE Rule
        if (ip_country != cust_country) and (amount >= self.config.OFFSHORE_HIGH_VALUE_INR):
            results.append(RuleResult(
                rule="RULE_OFFSHORE_HIGH_VALUE",
                triggered=True,
                severity=RuleSeverity.CRITICAL,
                reason=f"Cross-border transaction of ₹{amount:,.2f} originates outside domestic jurisdiction.",
                risk_points=40
            ))

        return results

rule_engine = RuleEngine()
