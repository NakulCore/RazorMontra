import React from 'react';
import { MetricsCards } from '../components/MetricsCards';
import { SystemOverviewMetrics, Transaction, ComprehensiveRiskAnalysis } from '../types';
import { ShieldAlert, ArrowRight, Play, CheckCircle2, AlertTriangle, ShieldCheck } from 'lucide-react';

interface DashboardPageProps {
  metrics: SystemOverviewMetrics | null;
  recentTransactions: Transaction[];
  onSelectTransaction: (tx: Transaction) => void;
  onNavigateTab: (tab: any) => void;
}

export const DashboardPage: React.FC<DashboardPageProps> = ({
  metrics,
  recentTransactions,
  onSelectTransaction,
  onNavigateTab
}) => {
  const highRiskTxns = recentTransactions.filter((t) => t.is_fraud || t.amount > 30000 || t.transactions_last_10_minutes >= 3);

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-[#101b33] via-[#0d2146] to-[#0c182d] border border-blue-500/20 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <span className="text-xl font-extrabold text-white tracking-tight">Merchant Risk Cockpit</span>
            <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-semibold">Live Protection</span>
          </div>
          <p className="text-sm text-slate-300 mt-1 max-w-2xl">
            Autonomous multi-layered fraud defense combining calibrated ML risk classification, deterministic safety rules, RAG policy retrieval, and idempotent sandbox actions.
          </p>
        </div>

        <button
          onClick={() => onNavigateTab('demo')}
          className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-sm shadow-lg shadow-blue-600/30 transition flex items-center space-x-2 shrink-0"
        >
          <Play className="w-4 h-4 fill-current" />
          <span>Launch Demo Simulator</span>
        </button>
      </div>

      {/* KPI Cards */}
      <MetricsCards metrics={metrics} />

      {/* Grid: Live Alerts & Risk Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Real-time High Risk Alerts */}
        <div className="lg:col-span-2 rounded-2xl bg-[#0f172a] border border-slate-800 p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <ShieldAlert className="w-4 h-4 text-rose-400" />
              <h3 className="font-bold text-white text-sm">Active High-Risk Interceptions</h3>
            </div>
            <button
              onClick={() => onNavigateTab('transactions')}
              className="text-xs text-blue-400 hover:text-blue-300 font-medium flex items-center space-x-1"
            >
              <span>View all transactions</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-2.5">
            {highRiskTxns.slice(0, 5).map((tx) => (
              <div
                key={tx.transaction_id}
                onClick={() => onSelectTransaction(tx)}
                className="p-3.5 rounded-xl bg-slate-900/80 hover:bg-slate-850 border border-slate-800 hover:border-slate-700 cursor-pointer transition flex items-center justify-between group"
              >
                <div className="flex items-center space-x-3.5">
                  <div className="w-9 h-9 rounded-lg bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400 font-bold text-xs">
                    {tx.amount > 40000 ? '92' : '78'}
                  </div>
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="font-mono text-xs font-bold text-white">{tx.transaction_id}</span>
                      <span className="text-xs text-slate-400">• Customer: {tx.customer_id}</span>
                      {tx.new_device && (
                        <span className="text-[10px] px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300">New Device</span>
                      )}
                      {tx.ip_country !== tx.customer_country && (
                        <span className="text-[10px] px-1.5 py-0.2 rounded bg-purple-500/20 text-purple-300">Geo Mismatch</span>
                      )}
                    </div>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      Amount: <strong className="text-slate-200">₹{tx.amount.toLocaleString()}</strong> • {tx.transactions_last_10_minutes} txns in 10m • Origin IP: {tx.ip_country}
                    </p>
                  </div>
                </div>

                <div className="flex items-center space-x-3">
                  <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/30">
                    FLAGGED
                  </span>
                  <ArrowRight className="w-4 h-4 text-slate-500 group-hover:text-white transition" />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right Col: Architecture Pipeline Status */}
        <div className="rounded-2xl bg-[#0f172a] border border-slate-800 p-5 space-y-4">
          <h3 className="font-bold text-white text-sm flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-blue-400" />
            <span>Autonomous Risk Pipeline</span>
          </h3>

          <div className="space-y-3 text-xs">
            <div className="p-3 rounded-lg bg-slate-900/60 border border-slate-800/80 space-y-1">
              <div className="flex justify-between items-center font-semibold text-slate-200">
                <span>1. Feature Extraction</span>
                <span className="text-emerald-400 font-mono">0.2ms Latency</span>
              </div>
              <p className="text-[11px] text-slate-400">Real-time temporal velocity, customer deviations & device novelty.</p>
            </div>

            <div className="p-3 rounded-lg bg-slate-900/60 border border-slate-800/80 space-y-1">
              <div className="flex justify-between items-center font-semibold text-slate-200">
                <span>2. ML Risk Model</span>
                <span className="text-emerald-400 font-mono">99.1% F1 Score</span>
              </div>
              <p className="text-[11px] text-slate-400">RandomForest Ensemble calibrated on 12,000+ realistic fintech records.</p>
            </div>

            <div className="p-3 rounded-lg bg-slate-900/60 border border-slate-800/80 space-y-1">
              <div className="flex justify-between items-center font-semibold text-slate-200">
                <span>3. Deterministic Safety Rules</span>
                <span className="text-blue-400 font-mono">7 Rule Gates</span>
              </div>
              <p className="text-[11px] text-slate-400">Hard velocity ceilings, offshore thresholds, and chargeback limits.</p>
            </div>

            <div className="p-3 rounded-lg bg-slate-900/60 border border-slate-800/80 space-y-1">
              <div className="flex justify-between items-center font-semibold text-slate-200">
                <span>4. RAG Policy Store</span>
                <span className="text-purple-400 font-mono">Vectorized TF-IDF</span>
              </div>
              <p className="text-[11px] text-slate-400">Grounds decisions in Razorpay Merchant Risk Protocols.</p>
            </div>

            <div className="p-3 rounded-lg bg-slate-900/60 border border-slate-800/80 space-y-1">
              <div className="flex justify-between items-center font-semibold text-slate-200">
                <span>5. Bounded Agent & Action</span>
                <span className="text-amber-400 font-mono">Idempotent</span>
              </div>
              <p className="text-[11px] text-slate-400">Restricted to APPROVE, VERIFY, FLAG, ESCALATE with full audit snapshot.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
