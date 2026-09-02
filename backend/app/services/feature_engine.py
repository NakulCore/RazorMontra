import numpy as np
import pandas as pd
from typing import Dict, Any, List, Union

FEATURE_COLUMNS = [
    "amount",
    "amount_deviation",
    "amount_to_avg_ratio",
    "previous_transaction_count",
    "previous_failed_transactions",
    "transactions_last_10_minutes",
    "transactions_last_hour",
    "velocity_ratio",
    "failure_ratio",
    "new_device_num",
    "new_location_num",
    "geo_mismatch",
    "device_age",
    "account_age",
    "chargeback_history",
    "is_card",
    "is_upi",
    "is_high_amount_burst"
]

def extract_features_from_dict(data: Dict[str, Any]) -> Dict[str, float]:
    """
    Extracts numerical and engineering features from a single transaction dictionary.
    """
    amount = float(data.get("amount", 0.0))
    avg_amt = float(data.get("average_customer_amount", amount if amount > 0 else 100.0))
    if avg_amt <= 0:
        avg_amt = 100.0
    
    amount_deviation = float(data.get("amount_deviation", abs(amount - avg_amt) / avg_amt))
    amount_to_avg_ratio = amount / avg_amt

    prev_tx = int(data.get("previous_transaction_count", 0))
    prev_failed = int(data.get("previous_failed_transactions", 0))
    tx_10m = int(data.get("transactions_last_10_minutes", 0))
    tx_1h = int(data.get("transactions_last_hour", 0))

    velocity_ratio = tx_10m / (tx_1h + 1.0)
    failure_ratio = prev_failed / (prev_tx + prev_failed + 1.0)

    new_device = 1.0 if bool(data.get("new_device", False)) else 0.0
    new_location = 1.0 if bool(data.get("new_location", False)) else 0.0

    ip_country = str(data.get("ip_country", "IN"))
    cust_country = str(data.get("customer_country", "IN"))
    merch_country = str(data.get("merchant_country", "IN"))
    geo_mismatch = 1.0 if (ip_country != cust_country or ip_country != merch_country) else 0.0

    device_age = float(data.get("device_age", 0))
    account_age = float(data.get("account_age", 30))
    chargebacks = float(data.get("chargeback_history", 0))

    pm = str(data.get("payment_method", "card")).lower()
    is_card = 1.0 if "card" in pm else 0.0
    is_upi = 1.0 if "upi" in pm else 0.0

    is_high_amount_burst = 1.0 if (amount > 10000.0 and tx_10m >= 3) else 0.0

    return {
        "amount": amount,
        "amount_deviation": amount_deviation,
        "amount_to_avg_ratio": amount_to_avg_ratio,
        "previous_transaction_count": float(prev_tx),
        "previous_failed_transactions": float(prev_failed),
        "transactions_last_10_minutes": float(tx_10m),
        "transactions_last_hour": float(tx_1h),
        "velocity_ratio": float(velocity_ratio),
        "failure_ratio": float(failure_ratio),
        "new_device_num": new_device,
        "new_location_num": new_location,
        "geo_mismatch": geo_mismatch,
        "device_age": device_age,
        "account_age": account_age,
        "chargeback_history": chargebacks,
        "is_card": is_card,
        "is_upi": is_upi,
        "is_high_amount_burst": is_high_amount_burst
    }

def extract_features_df(df: pd.DataFrame) -> pd.DataFrame:
    """
    Transforms raw transactions DataFrame into engineered feature matrix X.
    """
    features_list = [extract_features_from_dict(row) for row in df.to_dict(orient="records")]
    return pd.DataFrame(features_list)[FEATURE_COLUMNS]
