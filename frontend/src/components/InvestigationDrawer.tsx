import React from 'react';
import {
  X,
  ShieldAlert,
  ShieldCheck,
  Cpu,
  AlertTriangle,
  FileText,
  CheckCircle,
  HelpCircle,
  Clock,
  Layers,
  Sparkles,
  ArrowRight,
  Send,
  Lock
} from 'lucide-react';
import { ComprehensiveRiskAnalysis, DecisionType } from '../types';

interface InvestigationDrawerProps {
  analysis: ComprehensiveRiskAnalysis | null;
  onClose: () => void;
}

export const InvestigationDrawer: React.FC<InvestigationDrawerProps> = ({ analysis, onClose }) => {
  if (!analysis) return null;

  const {
    transaction: tx,
    ml_result: ml,
    rule_results: rules,
    retrieved_policies: policies,
    investigation: inv,
    decision: dec,
    action: act,
    audit_id
  } = analysis;

  const triggeredRules = rules.filter((r) => r.triggered);

  const getScoreColor = (score: number) => {
    if (score >= 75) return 'text-rose-400 bg-rose-500/10 border-rose-500/30';
    if (score >= 40) return 'text-amber-400 bg-amber-500/10 border-amber-500/30';
    return 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30';
  };

  const getDecisionBadge = (decision: DecisionType) => {
    switch (decision) {
      case 'APPROVE':
        return <span className="px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs font-bold">APPROVE</span>;
      case 'VERIFY':
        return <span className="px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 text-xs font-bold">VERIFY (STEP-UP 2FA)</span>;
      case 'FLAG':
        return <span className="px-3 py-1 rounded-full bg-orange-500/20 text-orange-300 border border-orange-500/30 text-xs font-bold">FLAG FOR REVIEW</span>;
      case 'ESCALATE':
        return <span className="px-3 py-1 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/30 text-xs font-bold">ESCALATE & QUARANTINE</span>;
      default:
        return null;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-sm transition-opacity">
      <div className="w-full max-w-3xl bg-[#0c1527] border-l border-slate-800 h-full overflow-y-auto shadow-2xl flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-slate-800/80 sticky top-0 bg-[#0c1527]/95 backdrop-blur z-10 flex items-center justify-between">
          <div>
            <div className="flex items-center space-x-3">
              <span className="text-xl font-bold text-white tracking-tight">
                Transaction Investigation
              </span>
              <span className="mono-font text-xs font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                {tx.transaction_id}
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Initiated on {new Date(tx.timestamp).toLocaleString()} • Merchant: <strong className="text-slate-200">{tx.merchant_id}</strong>
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-6">
          {/* Section 1: Executive Summary & Decision Banner */}
          <div className="p-5 rounded-2xl bg-gradient-to-r from-slate-900 to-[#12213d] border border-slate-700/80 shadow-lg space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center space-x-3">
                <div className={`text-2xl font-black px-4 py-2 rounded-xl border ${getScoreColor(ml.risk_score)}`}>
                  {ml.risk_score}
                  <span className="text-xs font-semibold text-slate-400">/100</span>
                </div>
                <div>
                  <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Calculated Risk Level</div>
                  <div className="text-base font-bold text-white flex items-center gap-2">
                    <span>{ml.risk_class} RISK</span>
                    <span className="text-xs font-normal text-slate-400 font-mono">({(ml.risk_probability * 100).toFixed(1)}% prob)</span>
                  </div>
                </div>
              </div>

              <div className="text-right">
                <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Bounded Copilot Decision</div>
                {getDecisionBadge(dec.decision)}
              </div>
            </div>

            {/* AI Executive Summary */}
            <div className="pt-3 border-t border-slate-800">
              <div className="flex items-center space-x-2 text-xs font-semibold text-blue-400 mb-1">
                <Sparkles className="w-3.5 h-3.5 text-blue-400" />
                <span>AI Investigation Synthesis</span>
              </div>
              <p className="text-sm text-slate-200 leading-relaxed">{inv.summary}</p>
              <div className="mt-2 text-xs text-slate-400 flex items-center gap-1.5">
                <ArrowRight className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span><strong>Recommended Action:</strong> {inv.recommended_next_step}</span>
              </div>
            </div>
          </div>

          {/* Section 2: Transaction Snapshot Details */}
          <div className="rounded-xl bg-[#101b2f] border border-slate-800 p-4 space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
              <Layers className="w-3.5 h-3.5 text-slate-400" />
              <span>Payment Telemetry Snapshot</span>
            </h4>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div className="p-2.5 rounded-lg bg-slate-900/60 border border-slate-800/80">
                <span className="text-slate-400 block text-[11px]">Amount</span>
                <span className="font-bold text-white text-sm">₹{tx.amount.toLocaleString()}</span>
              </div>
              <div className="p-2.5 rounded-lg bg-slate-900/60 border border-slate-800/80">
                <span className="text-slate-400 block text-[11px]">Cust. Avg Baseline</span>
                <span className="font-medium text-slate-200">₹{tx.average_customer_amount.toLocaleString()}</span>
              </div>
              <div className="p-2.5 rounded-lg bg-slate-900/60 border border-slate-800/80">
                <span className="text-slate-400 block text-[11px]">Amount Deviation</span>
                <span className={`font-bold ${tx.amount_deviation > 3 ? 'text-rose-400' : 'text-slate-200'}`}>
                  {tx.amount_deviation.toFixed(1)}x
                </span>
              </div>
              <div className="p-2.5 rounded-lg bg-slate-900/60 border border-slate-800/80">
                <span className="text-slate-400 block text-[11px]">Payment Method</span>
                <span className="font-medium text-slate-200 uppercase">{tx.payment_method}</span>
              </div>
              <div className="p-2.5 rounded-lg bg-slate-900/60 border border-slate-800/80">
                <span className="text-slate-400 block text-[11px]">Customer Origin</span>
                <span className="font-medium text-slate-200">{tx.customer_country} (Cust: {tx.customer_id})</span>
              </div>
              <div className="p-2.5 rounded-lg bg-slate-900/60 border border-slate-800/80">
                <span className="text-slate-400 block text-[11px]">Origin IP Geo</span>
                <span className={`font-bold ${tx.ip_country !== tx.customer_country ? 'text-rose-400' : 'text-slate-200'}`}>
                  {tx.ip_country} {tx.ip_country !== tx.customer_country && '⚠️ Mismatch'}
                </span>
              </div>
              <div className="p-2.5 rounded-lg bg-slate-900/60 border border-slate-800/80">
                <span className="text-slate-400 block text-[11px]">10m Velocity</span>
                <span className={`font-bold ${tx.transactions_last_10_minutes >= 3 ? 'text-rose-400' : 'text-slate-200'}`}>
                  {tx.transactions_last_10_minutes} txns / 10m
                </span>
              </div>
              <div className="p-2.5 rounded-lg bg-slate-900/60 border border-slate-800/80">
                <span className="text-slate-400 block text-[11px]">Device Status</span>
                <span className={`font-medium ${tx.new_device ? 'text-amber-400' : 'text-slate-200'}`}>
                  {tx.new_device ? 'New (Unrecognized)' : `Known (${tx.device_age}d)`}
                </span>
              </div>
            </div>
          </div>

          {/* Section 3: Grounded Feature Contributions & Explainability */}
          <div className="rounded-xl bg-[#101b2f] border border-slate-800 p-4 space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center justify-between">
              <span className="flex items-center gap-2">
                <Cpu className="w-3.5 h-3.5 text-blue-400" />
                <span>Grounded ML Feature Attributions</span>
              </span>
              <span className="text-[10px] text-slate-500 font-mono">Model: {ml.model_version}</span>
            </h4>
            
            <div className="space-y-2">
              {ml.risk_factors.map((factor, idx) => (
                <div key={idx} className="p-2.5 rounded-lg bg-slate-900/80 border border-slate-800 text-xs text-slate-200 flex items-start gap-2.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-400 mt-1.5 shrink-0"></span>
                  <span className="leading-snug">{factor}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Section 4: Deterministic Rules Triggered */}
          <div className="rounded-xl bg-[#101b2f] border border-slate-800 p-4 space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
                <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
                <span>Deterministic Rule Engine ({triggeredRules.length} Fired)</span>
              </h4>
              <span className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-slate-400">Deterministic Safety Gate</span>
            </div>

            <div className="space-y-2">
              {rules.map((rule, idx) => (
                <div
                  key={idx}
                  className={`p-2.5 rounded-lg border text-xs flex items-center justify-between ${
                    rule.triggered
                      ? 'bg-rose-950/20 border-rose-500/30 text-rose-200'
                      : 'bg-slate-900/40 border-slate-800/60 text-slate-400'
                  }`}
                >
                  <div className="space-y-0.5">
                    <div className="font-semibold flex items-center gap-2">
                      <span>{rule.rule}</span>
                      {rule.triggered && (
                        <span className="text-[9px] uppercase px-1.5 py-0.2 rounded bg-rose-500/20 text-rose-300 border border-rose-500/30">
                          {rule.severity} Severity (+{rule.risk_points} pts)
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] opacity-80">{rule.reason}</p>
                  </div>
                  <div>
                    {rule.triggered ? (
                      <span className="text-xs font-bold text-rose-400">TRIGGERED</span>
                    ) : (
                      <span className="text-xs text-slate-500">PASSED</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Section 5: RAG Retrieved Policies */}
          <div className="rounded-xl bg-[#101b2f] border border-slate-800 p-4 space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
              <FileText className="w-3.5 h-3.5 text-purple-400" />
              <span>RAG Policy Retrieval ({policies.length} Clauses Matched)</span>
            </h4>
            <div className="space-y-2.5">
              {policies.map((pol, idx) => (
                <div key={idx} className="p-3 rounded-lg bg-slate-900/80 border border-purple-500/20 text-xs space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-purple-300">{pol.policy_id}: {pol.title}</span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-purple-500/20 text-purple-200 font-mono">
                      Relevance: {(pol.relevance_score * 100).toFixed(0)}%
                    </span>
                  </div>
                  <p className="text-slate-300 text-[11px] leading-relaxed">{pol.text}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Section 6: Action Execution & Immutable Audit Trace */}
          <div className="rounded-xl bg-slate-900/90 border border-slate-800 p-4 space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
              <Lock className="w-3.5 h-3.5 text-emerald-400" />
              <span>Idempotent Safe Action & Audit Ledger</span>
            </h4>
            <div className="p-3 rounded-lg bg-[#0b1322] border border-slate-800 text-xs space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Action Dispatched:</span>
                <span className="font-bold text-emerald-400 uppercase">{act.action}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Provider Status:</span>
                <span className="font-mono text-slate-200">{act.status} ({act.provider})</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Audit Trace ID:</span>
                <span className="font-mono text-xs text-blue-400">{audit_id}</span>
              </div>
              <p className="text-[11px] text-slate-400 pt-1 border-t border-slate-800">{act.message}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
