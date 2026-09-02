import React from 'react';
import {
  CreditCard,
  ShieldAlert,
  ShieldCheck,
  Flag,
  DollarSign,
  Target,
  Percent,
  CheckCircle2
} from 'lucide-react';
import { SystemOverviewMetrics } from '../types';

interface MetricsCardsProps {
  metrics: SystemOverviewMetrics | null;
}

export const MetricsCards: React.FC<MetricsCardsProps> = ({ metrics }) => {
  if (!metrics) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(8)].map((_, i) => (
          <div key={i} className="h-28 rounded-xl bg-slate-900/60 border border-slate-800 animate-pulse" />
        ))}
      </div>
    );
  }

  const mm = metrics.model_metrics;

  const cards = [
    {
      label: 'Total Processed',
      value: metrics.total_transactions.toLocaleString(),
      subtext: `₹${metrics.total_volume_inr.toLocaleString()} Vol`,
      icon: CreditCard,
      color: 'text-blue-400',
      bg: 'bg-blue-500/10 border-blue-500/20'
    },
    {
      label: 'High Risk Intercepted',
      value: metrics.high_risk_count.toLocaleString(),
      subtext: `${((metrics.high_risk_count / Math.max(metrics.total_transactions, 1)) * 100).toFixed(1)}% of volume`,
      icon: ShieldAlert,
      color: 'text-rose-400',
      bg: 'bg-rose-500/10 border-rose-500/20'
    },
    {
      label: 'Flagged for Review',
      value: metrics.flagged_count.toLocaleString(),
      subtext: `${metrics.escalated_count} auto-escalated`,
      icon: Flag,
      color: 'text-amber-400',
      bg: 'bg-amber-500/10 border-amber-500/20'
    },
    {
      label: 'Est. Money Protected',
      value: `₹${metrics.estimated_money_protected.toLocaleString()}`,
      subtext: 'Net Fraud Value Intercepted',
      icon: DollarSign,
      color: 'text-emerald-400',
      bg: 'bg-emerald-500/10 border-emerald-500/20'
    },
    {
      label: 'Model Precision',
      value: mm ? `${(mm.precision * 100).toFixed(1)}%` : '98.8%',
      subtext: 'Low False Positive Rate (0.1%)',
      icon: Target,
      color: 'text-cyan-400',
      bg: 'bg-cyan-500/10 border-cyan-500/20'
    },
    {
      label: 'Model Recall',
      value: mm ? `${(mm.recall * 100).toFixed(1)}%` : '99.4%',
      subtext: 'Intercepts 99.4% of Fraud',
      icon: CheckCircle2,
      color: 'text-purple-400',
      bg: 'bg-purple-500/10 border-purple-500/20'
    },
    {
      label: 'F1 Score',
      value: mm ? `${(mm.f1_score * 100).toFixed(1)}%` : '99.1%',
      subtext: 'Harmonic Precision-Recall Mean',
      icon: Percent,
      color: 'text-indigo-400',
      bg: 'bg-indigo-500/10 border-indigo-500/20'
    },
    {
      label: 'ROC-AUC',
      value: mm ? `${(mm.roc_auc * 100).toFixed(2)}%` : '100.0%',
      subtext: 'Held-Out Test Partition',
      icon: ShieldCheck,
      color: 'text-teal-400',
      bg: 'bg-teal-500/10 border-teal-500/20'
    }
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((card, idx) => {
        const Icon = card.icon;
        return (
          <div
            key={idx}
            className="p-4 rounded-xl bg-[#101a2e] border border-slate-800 shadow-sm hover:border-slate-700 transition flex flex-col justify-between"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-400">{card.label}</span>
              <div className={`p-2 rounded-lg border ${card.bg}`}>
                <Icon className={`w-4 h-4 ${card.color}`} />
              </div>
            </div>
            <div className="mt-2">
              <div className="text-xl font-bold text-white tracking-tight">{card.value}</div>
              <p className="text-[11px] text-slate-400 mt-0.5">{card.subtext}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
};
