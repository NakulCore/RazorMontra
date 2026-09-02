#!/usr/bin/env bash
set -e

echo "============================================================"
echo "🛡️  STARTING RAZORPAY AI PAYMENT RISK COPILOT"
echo "============================================================"

# Navigate to script directory
cd "$(dirname "$0")"

# Check Python environment
if [ ! -d ".venv" ]; then
    echo "Creating python virtual environment..."
    python3 -m venv .venv
    source .venv/bin/activate
    pip install -r backend/requirements.txt
else
    source .venv/bin/activate
fi

# Check if model is trained
if [ ! -f "ml/artifacts/model_pipeline.joblib" ]; then
    echo "Training ML risk models on 12,000 synthetic transactions..."
    python ml/train_model.py
fi

# Build frontend if dist doesn't exist
if [ ! -d "frontend/dist" ]; then
    echo "Building frontend dashboard..."
    cd frontend && corepack pnpm install && corepack pnpm build && cd ..
fi

echo "============================================================"
echo "🚀 Starting FastAPI Application Server on http://localhost:8000"
echo "📖 API Swagger Docs: http://localhost:8000/docs"
echo "🖥️  Merchant Dashboard: http://localhost:8000"
echo "============================================================"

export PYTHONPATH=.
python -m uvicorn backend.app.main:app --host 0.0.0.0 --port 8000 --reload
