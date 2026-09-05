import React from 'react';
import { MetricsCards } from '../components/MetricsCards';
import { SystemOverviewMetrics, Transaction, NavTab } from '../types';
import {
  ShieldAlert,
  ArrowRight,
  Play,
  Layers,
  Cpu,
  ShieldCheck,
  Sparkles,
  CheckCircle2,
  ChevronRight
} from 'lucide-react';
import { RiskDistributionChart, VolumeTrendChart, FinancialImpactChart } from '../components/FintechCharts';
import { RiskScoreGauge } from '../components/RiskScoreGauge';
import { DecisionBadge } from '../components/DecisionBadge';

interface DashboardPageProps {
  metrics: SystemOverviewMetrics | null;
  recentTransactions: Transaction[];
  onSelectTransaction: (tx: Transaction) => void;
  onNavigateTab: (tab: NavTab) => void;
}

export const DashboardPage: React.FC<DashboardPageProps> = ({
  metrics,
  recentTransactions,
  onSelectTransaction,
  onNavigateTab,
}) => {
  // Filter for transactions that have elevated risk signals
  const highRiskTxns = recentTransactions.filter(
    (t) => t.is_fraud || t.amount > 30000 || t.transactions_last_10_minutes >= 2 || t.new_location || t.previous_failed_transactions > 0
  );

  const pipelineNodes = [
    { label: 'TRANSACTION', sub: 'Telemetry Ingest', icon: Layers },
    { label: 'ML RISK', sub: 'Ensemble Model', icon: Cpu },
    { label: 'RULES', sub: '7 Safety Gates', icon: ShieldCheck },
    { label: 'AI INVESTIGATION', sub: 'RAG Grounded', icon: Sparkles },
    { label: 'DECISION', sub: 'Bounded Action', icon: CheckCircle2 },
  ];

  return (
    <div className="space-y-6">
      {/* Dashboard Hero Section - Compact, Proportional & Aligned */}
      <div className="glass-card rounded-2xl p-6 border border-zinc-200/80">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5">
          {/* Left Column: Title, Description, and Pipeline */}
          <div className="space-y-3.5 flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-3.5">
              <div className="flex items-center gap-3">
                <img
                  src="https://img.logo.dev/razorpay.com?token=live_6a1a28fd-6420-4492-aeb0-b297461d9de2&size=512&retina=true&format=png"
                  alt="Razorpay"
                  className="w-10 h-10 rounded-xl object-contain bg-white border border-zinc-200/90 p-1.5 shadow-xs shrink-0"
                />
                <div>
                  <div className="flex items-center gap-2">
                    <h1 className="text-xl sm:text-2xl font-black text-zinc-900 tracking-tight leading-none">
                      RazorMontra
                    </h1>
                  </div>
                  <span className="text-[11px] font-medium text-zinc-500 block mt-0.5">
                    AI Financial Intelligence for Merchants
                  </span>
                </div>
              </div>
              <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-zinc-100 text-zinc-800 border border-zinc-300 tracking-wider uppercase font-mono shrink-0 ml-auto sm:ml-0">
                Live Defense Active
              </span>
            </div>

            <p className="text-xs text-zinc-600 leading-relaxed max-w-2xl">
              Autonomous multi-layered payment risk investigation, deterministic rule enforcement, and safe decision intelligence for Razorpay merchants.
            </p>

            {/* Pipeline Flow - Uniform Dimensions, Contained Scrollable Region */}
            <div className="pt-1">
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 max-w-full [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
                {pipelineNodes.map((node, i) => {
                  const NodeIcon = node.icon;
                  return (
                    <React.Fragment key={i}>
                      <div className="w-28 sm:w-32 h-14 px-2 py-1.5 rounded-xl bg-zinc-50 border border-zinc-200/80 hover:border-zinc-300 transition-colors flex flex-col justify-center items-center text-center shrink-0">
                        <div className="flex items-center gap-1 text-zinc-700 mb-0.5">
                          <NodeIcon className="w-3 h-3 text-zinc-900" />
                          <span className="text-[10px] font-bold text-zinc-900 tracking-tight leading-none">
                            {node.label}
                          </span>
                        </div>
                        <span className="text-[9px] text-zinc-500 leading-none font-mono">
                          {node.sub}
                        </span>
                      </div>
                      {i < pipelineNodes.length - 1 && (
                        <ChevronRight className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
                      )}
                    </React.Fragment>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Right Column: CTA Buttons - Apple Design System */}
          <div className="flex flex-col sm:w-48 gap-2.5 shrink-0 justify-center">
            <button
              onClick={() => onNavigateTab('demo')}
              className="w-full h-9 px-4 rounded-xl bg-black hover:bg-zinc-800 text-white font-semibold text-xs transition flex items-center justify-center gap-2 shadow-xs active:scale-98"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>Launch Demo</span>
            </button>

            <button
              onClick={() => onNavigateTab('transactions')}
              className="w-full h-9 px-4 rounded-xl bg-white hover:bg-zinc-50 text-zinc-900 font-medium text-xs border border-zinc-300 transition flex items-center justify-center gap-1.5 shadow-xs"
            >
              <span>View Live Transactions</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Grouped Metric Cards (Business Impact & Model Performance) */}
      <MetricsCards metrics={metrics} onNavigateTab={onNavigateTab} />

      {/* Visual Analytics Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6 items-stretch">
        <div className="lg:col-span-2">
          <VolumeTrendChart transactions={recentTransactions} />
        </div>
        <div className="lg:col-span-1">
          <RiskDistributionChart metrics={metrics} />
        </div>
      </div>

      {/* Active Risk Interceptions Feed & Financial ROI */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6 items-stretch">
        {/* Left Col(s): Live Risk Interceptions Feed */}
        <div className="lg:col-span-2 glass-card rounded-xl p-5 space-y-3.5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center space-x-2">
                <ShieldAlert className="w-4 h-4 text-zinc-900" />
                <h3 className="text-xs font-bold text-zinc-900 uppercase tracking-wider">
                  Active Risk Interceptions
                </h3>
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-orange-500 text-white border border-orange-500 shadow-2xs">
                  {highRiskTxns.length} Critical
                </span>
              </div>
              <button
                onClick={() => onNavigateTab('transactions')}
                className="text-xs text-zinc-600 hover:text-zinc-900 font-medium flex items-center space-x-1 transition"
              >
                <span>View all</span>
                <ArrowRight className="w-3 h-3" />
              </button>
            </div>

            <div className="space-y-2">
              {highRiskTxns.slice(0, 5).map((tx) => {
                let approxScore = 45;
                let signals: string[] = [];
                let decision: 'APPROVE' | 'VERIFY' | 'FLAG' | 'ESCALATE' = 'VERIFY';

                if (tx.is_fraud || tx.transactions_last_10_minutes >= 4) {
                  approxScore = 94;
                  signals.push('HIGH VELOCITY');
                  decision = 'ESCALATE';
                } else if (tx.amount > 35000) {
                  approxScore = 82;
                  signals.push('AMOUNT SPIKE');
                  decision = 'FLAG';
                }
                if (tx.new_device) signals.push('NEW DEVICE');
                if (tx.ip_country !== tx.customer_country) signals.push('GEO MISMATCH');
                if (tx.previous_failed_transactions > 0) signals.push('FAILURES OBSERVED');

                return (
                  <div
                    key={tx.transaction_id}
                    onClick={() => onSelectTransaction(tx)}
                    className="p-3 rounded-xl bg-zinc-50 hover:bg-zinc-100/80 border border-zinc-200/80 hover:border-zinc-300 cursor-pointer transition-all duration-150 flex flex-col sm:flex-row sm:items-center justify-between gap-3 group"
                  >
                    <div className="flex items-center space-x-3">
                      <RiskScoreGauge score={approxScore} size="sm" />
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-mono text-xs font-semibold text-zinc-900 group-hover:text-black transition">
                            {tx.transaction_id}
                          </span>
                          <span className="text-xs font-mono font-bold text-zinc-900 tabular-nums">
                            ₹{Math.round(tx.amount).toLocaleString('en-IN')}
                          </span>
                          <span className="text-[11px] text-zinc-500">
                            • Cust: {tx.customer_id}
                          </span>
                        </div>

                        {/* Signals Badges */}
                        <div className="flex flex-wrap gap-1 mt-1">
                          {signals.slice(0, 3).map((sig, sidx) => (
                            <span
                              key={sidx}
                              className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-white text-zinc-700 border border-zinc-200"
                            >
                              {sig}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between sm:justify-end space-x-3 shrink-0">
                      <DecisionBadge decision={decision} size="sm" />
                      <span className="text-[11px] font-mono text-zinc-500">
                        {new Date(tx.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                      <ChevronRight className="w-3.5 h-3.5 text-zinc-400 group-hover:text-zinc-900 transition-colors" />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right Col: Financial Impact ROI */}
        <div className="lg:col-span-1">
          <FinancialImpactChart metrics={metrics} onNavigateTab={onNavigateTab} />
        </div>
      </div>
    </div>
  );
};
