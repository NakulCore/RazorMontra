import pytest
from backend.app.services.generator import generate_synthetic_dataset

def test_generate_synthetic_dataset():
    df, train, val, test = generate_synthetic_dataset(n_samples=200, fraud_ratio=0.10, seed=123)
    assert len(df) == 200
    assert len(train) == 140
    assert len(val) == 30
    assert len(test) == 30
    assert "is_fraud" in df.columns
    assert "amount" in df.columns
    assert "device_id" in df.columns
    assert df["is_fraud"].sum() > 0
