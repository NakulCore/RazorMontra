import random
import uuid
import numpy as np
import pandas as pd
from datetime import datetime, timedelta, timezone
from pathlib import Path
from typing import Tuple, List, Dict, Any

COUNTRIES = ["IN", "IN", "IN", "IN", "IN", "US", "GB", "AE", "SG", "DE"]
PAYMENT_METHODS = ["card", "upi", "netbanking", "wallet"]

def generate_synthetic_dataset(
    n_samples: int = 12000,
    fraud_ratio: float = 0.085,
    seed: int = 42,
    output_dir: Path = None
) -> Tuple[pd.DataFrame, pd.DataFrame, pd.DataFrame, pd.DataFrame]:
    """
    Generates a realistic fintech transaction dataset with subtle patterns, edge cases,
    false-positive traps (legitimate vacations, holiday shopping, new phone upgrades),
    and sophisticated fraud schemes.
    """
    np.random.seed(seed)
    random.seed(seed)

    base_time = datetime(2026, 1, 1, 0, 0, 0, tzinfo=timezone.utc)
    records: List[Dict[str, Any]] = []

    # 2,500 distinct customer personas
    customers = [f"cust_{i:05d}" for i in range(1, 2501)]
    merchants = [f"merch_{i:04d}" for i in range(1, 251)]
    
    customer_baselines = {}
    for c in customers:
        avg_amt = float(np.random.lognormal(mean=6.8, sigma=0.85))
        avg_amt = max(150.0, min(avg_amt, 45000.0))
        customer_baselines[c] = {
            "avg_amount": avg_amt,
            "home_country": "IN" if random.random() < 0.88 else random.choice(["US", "GB", "AE", "SG"]),
            "account_age": random.randint(15, 1500),
            "primary_device": f"dev_{c}_{random.randint(1, 2)}",
            "device_age": random.randint(45, 900),
            "base_tx_count": random.randint(5, 200),
            "chargeback_history": 1 if random.random() < 0.04 else (2 if random.random() < 0.01 else 0)
        }

    merchant_countries = {m: "IN" if random.random() < 0.92 else "SG" for m in merchants}

    n_fraud = int(n_samples * fraud_ratio)
    n_legit = n_samples - n_fraud
    
    # 1. Generate Legitimate Transactions (including benign edge-case outliers)
    for i in range(n_legit):
        cust = random.choice(customers)
        merch = random.choice(merchants)
        base = customer_baselines[cust]

        # Natural noise & occasional benign big purchases (e.g. buying laptop, festival gift)
        is_benign_outlier = random.random() < 0.05
        is_benign_travel = random.random() < 0.03
        is_phone_upgrade = random.random() < 0.04

        if is_benign_outlier:
            amount = round(float(base["avg_amount"] * random.uniform(2.8, 5.5)), 2)
        else:
            amount = max(50.0, np.random.normal(loc=base["avg_amount"], scale=base["avg_amount"] * 0.35))
            amount = round(float(amount), 2)

        amount_dev = round(float(abs(amount - base["avg_amount"]) / (base["avg_amount"] + 1e-5)), 3)

        time_offset_secs = random.randint(0, 60 * 86400)
        tx_time = base_time + timedelta(seconds=time_offset_secs)

        if is_phone_upgrade:
            new_dev = True
            device_id = f"dev_{cust}_new"
            device_age = random.randint(1, 10)
        else:
            new_dev = False
            device_id = base["primary_device"]
            device_age = base["device_age"]

        if is_benign_travel:
            new_loc = True
            ip_country = random.choice(["US", "GB", "AE", "SG", "TH", "FR"])
        else:
            new_loc = False
            ip_country = base["home_country"]

        # Benign network drops can cause 1-2 failed attempts
        prev_failed = int(np.random.choice([0, 1, 2, 3], p=[0.88, 0.08, 0.03, 0.01]))
        # Quick successive buys during flash sales
        tx_10m = int(np.random.choice([0, 1, 2, 3, 4], p=[0.85, 0.10, 0.03, 0.015, 0.005]))
        tx_1h = tx_10m + int(np.random.choice([0, 1, 2], p=[0.80, 0.15, 0.05]))
        prev_tx_cnt = base["base_tx_count"] + random.randint(0, 30)

        records.append({
            "transaction_id": f"txn_legit_{i:06d}",
            "merchant_id": merch,
            "customer_id": cust,
            "timestamp": tx_time.isoformat(),
            "amount": amount,
            "currency": "INR",
            "payment_method": random.choice(PAYMENT_METHODS),
            "device_id": device_id,
            "device_age": device_age,
            "ip_country": ip_country,
            "customer_country": base["home_country"],
            "merchant_country": merchant_countries[merch],
            "previous_transaction_count": prev_tx_cnt,
            "previous_failed_transactions": prev_failed,
            "transactions_last_10_minutes": tx_10m,
            "transactions_last_hour": tx_1h,
            "average_customer_amount": round(base["avg_amount"], 2),
            "amount_deviation": amount_dev,
            "new_device": new_dev,
            "new_location": new_loc,
            "chargeback_history": base["chargeback_history"],
            "account_age": base["account_age"],
            "is_fraud": False,
            "fraud_type": "BENIGN_OUTLIER" if (is_benign_outlier or is_benign_travel) else "NONE"
        })

    # 2. Generate Fraud Transactions across realistic archetypes with realistic boundary noise
    fraud_archetypes = [
        "VELOCITY_ATTACK",
        "HIGH_VALUE_SPIKE",
        "NEW_DEVICE_TAKEOVER",
        "GEO_ANOMALY_BOT",
        "CARD_TESTING_BURST",
        "CHARGEBACK_RECIDIVIST",
        "SUBTLE_ACCOUNT_DRAIN"
    ]

    for i in range(n_fraud):
        archetype = random.choice(fraud_archetypes)
        cust = random.choice(customers)
        merch = random.choice(merchants)
        base = customer_baselines[cust]

        time_offset_secs = random.randint(0, 60 * 86400)
        tx_time = base_time + timedelta(seconds=time_offset_secs)
        
        amount = base["avg_amount"]
        payment_method = random.choice(["card", "upi"])
        new_dev = False
        device_id = base["primary_device"]
        device_age = base["device_age"]
        new_loc = False
        ip_country = base["home_country"]
        prev_failed = 0
        tx_10m = 0
        tx_1h = 1
        chargebacks = base["chargeback_history"]

        if archetype == "VELOCITY_ATTACK":
            tx_10m = random.randint(4, 12)
            tx_1h = tx_10m + random.randint(2, 8)
            amount = round(float(base["avg_amount"] * random.uniform(1.2, 2.8)), 2)
            prev_failed = random.randint(1, 4)
            new_dev = random.random() < 0.4

        elif archetype == "HIGH_VALUE_SPIKE":
            amount = round(float(base["avg_amount"] * random.uniform(3.5, 9.0) + random.uniform(5000, 35000)), 2)
            new_dev = random.random() < 0.7
            if new_dev:
                device_id = f"dev_takeover_{random.randint(1000, 9999)}"
                device_age = random.randint(0, 5)

        elif archetype == "NEW_DEVICE_TAKEOVER":
            new_dev = True
            device_id = f"dev_unknown_{uuid.uuid4().hex[:8]}"
            device_age = random.randint(0, 3)
            amount = round(float(base["avg_amount"] * random.uniform(2.2, 4.8)), 2)
            new_loc = random.random() < 0.8
            if new_loc:
                ip_country = random.choice(["RU", "NG", "VN", "US", "CN", "RO"])
            prev_failed = random.randint(1, 4)

        elif archetype == "GEO_ANOMALY_BOT":
            new_loc = True
            ip_country = random.choice(["RO", "UA", "BR", "ID", "PH", "VN"])
            tx_10m = random.randint(2, 6)
            tx_1h = tx_10m + random.randint(2, 5)
            amount = round(float(base["avg_amount"] * random.uniform(1.5, 3.5)), 2)

        elif archetype == "CARD_TESTING_BURST":
            prev_failed = random.randint(3, 7)
            tx_10m = random.randint(3, 8)
            amount = round(float(random.choice([49.0, 99.0, 199.0, 14999.0, 29999.0])), 2)
            new_dev = random.random() < 0.75
            device_age = 0

        elif archetype == "CHARGEBACK_RECIDIVIST":
            chargebacks = random.randint(2, 4)
            amount = round(float(base["avg_amount"] * random.uniform(1.8, 4.0)), 2)
            prev_failed = random.randint(1, 3)

        elif archetype == "SUBTLE_ACCOUNT_DRAIN":
            # Subtle fraud: standard amounts, no extreme velocity, but from an unverified device with 2 prior failure attempts
            new_dev = True
            device_id = f"dev_subtle_{random.randint(100, 999)}"
            device_age = 2
            amount = round(float(base["avg_amount"] * random.uniform(1.1, 2.0)), 2)
            prev_failed = random.randint(2, 4)
            tx_10m = random.randint(1, 3)

        amount_dev = round(float(abs(amount - base["avg_amount"]) / (base["avg_amount"] + 1e-5)), 3)

        records.append({
            "transaction_id": f"txn_fraud_{i:06d}",
            "merchant_id": merch,
            "customer_id": cust,
            "timestamp": tx_time.isoformat(),
            "amount": amount,
            "currency": "INR",
            "payment_method": payment_method,
            "device_id": device_id,
            "device_age": device_age,
            "ip_country": ip_country,
            "customer_country": base["home_country"],
            "merchant_country": merchant_countries[merch],
            "previous_transaction_count": base["base_tx_count"],
            "previous_failed_transactions": prev_failed,
            "transactions_last_10_minutes": tx_10m,
            "transactions_last_hour": tx_1h,
            "average_customer_amount": round(base["avg_amount"], 2),
            "amount_deviation": amount_dev,
            "new_device": new_dev,
            "new_location": new_loc,
            "chargeback_history": chargebacks,
            "account_age": base["account_age"],
            "is_fraud": True,
            "fraud_type": archetype
        })

    df = pd.DataFrame(records)
    df = df.sample(frac=1.0, random_state=seed).reset_index(drop=True)

    n = len(df)
    n_train = int(n * 0.70)
    n_val = int(n * 0.15)
    
    train_df = df.iloc[:n_train].copy().reset_index(drop=True)
    val_df = df.iloc[n_train:n_train + n_val].copy().reset_index(drop=True)
    test_df = df.iloc[n_train + n_val:].copy().reset_index(drop=True)

    if output_dir:
        output_dir = Path(output_dir)
        output_dir.mkdir(parents=True, exist_ok=True)
        df.to_csv(output_dir / "transactions_full.csv", index=False)
        train_df.to_csv(output_dir / "train.csv", index=False)
        val_df.to_csv(output_dir / "val.csv", index=False)
        test_df.to_csv(output_dir / "test.csv", index=False)

    return df, train_df, val_df, test_df
