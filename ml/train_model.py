import sys
from pathlib import Path

# Add project root to sys.path
BASE_DIR = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(BASE_DIR))

from backend.app.core.config import settings
from backend.app.services.generator import generate_synthetic_dataset
from backend.app.services.ml_engine import MLRiskEngine

def main():
    print("=" * 60)
    print("🚀 GENERATING 12,000+ REALISTIC FINTECH TRANSACTIONS...")
    print("=" * 60)
    
    df, train_df, val_df, test_df = generate_synthetic_dataset(
        n_samples=12000,
        fraud_ratio=0.085,
        seed=42,
        output_dir=settings.SYNTHETIC_DATA_DIR
    )
    
    print(f"Total Transactions: {len(df):,}")
    print(f"  - Train Set: {len(train_df):,} ({(len(train_df)/len(df))*100:.1f}%)")
    print(f"  - Val Set:   {len(val_df):,} ({(len(val_df)/len(df))*100:.1f}%)")
    print(f"  - Test Set:  {len(test_df):,} ({(len(test_df)/len(df))*100:.1f}%)")
    print(f"  - Fraud Rate: {(df['is_fraud'].sum()/len(df))*100:.2f}%")

    print("\n" + "=" * 60)
    print("🤖 TRAINING & EVALUATING ML RISK MODELS ON HELD-OUT DATA...")
    print("=" * 60)

    engine = MLRiskEngine()
    metrics = engine.train_and_evaluate(train_df, val_df, test_df, output_dir=settings.MODEL_DIR)

    print(f"\n🏆 Best Model Selected: {metrics['model_name']}")
    print(f"   Precision:             {metrics['precision']:.4f}")
    print(f"   Recall:                {metrics['recall']:.4f}")
    print(f"   F1-Score:              {metrics['f1_score']:.4f}")
    print(f"   Accuracy:              {metrics['accuracy']:.4f}")
    print(f"   ROC-AUC:               {metrics['roc_auc']:.4f}")
    print(f"   False Positive Rate:   {metrics['false_positive_rate']:.4f}")
    print(f"   False Negative Rate:   {metrics['false_negative_rate']:.4f}")
    print(f"   Fraud Value Detected:  ₹{metrics['fraud_value_detected']:,.2f}")
    print(f"   Est. Money Protected:  ₹{metrics['estimated_money_protected']:,.2f}")
    print("=" * 60)
    print("✅ Model training & artifacts successfully persisted!")

if __name__ == "__main__":
    main()
