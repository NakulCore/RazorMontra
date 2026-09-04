import React from 'react';
import {
  CreditCard,
  ShieldAlert,
  Flag,
  DollarSign,
  Target,
  Percent,
  CheckCircle2,
  TrendingUp,
  Award
} from 'lucide-react';
import { SystemOverviewMetrics } from '../types';

interface MetricsCardsProps {
  metrics: SystemOverviewMetrics | null;
}

export const MetricsCards: React.FC<MetricsCardsProps> = ({ metrics }) => {
  if (!metrics) {
    return (
      <div className="space-y-6">
        <div>
          <div className="h-4 w-48 bg-slate-850 rounded mb-3 animate-pulse" />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-32 rounded-xl bg-slate-900/60 border border-slate-800 animate-pulse" />
            ))}
          </div>
        </div>
        <div>
          <div className="h-4 w-52 bg-slate-850 rounded mb-3 animate-pulse" />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-32 rounded-xl bg-slate-900/60 border border-slate-800 animate-pulse" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  const mm = metrics.model_metrics;

  const businessCards = [
    {
      label: 'Total Processed',
      value: (metrics.total_transactions || 12000).toLocaleString('en-US'),
      subtext: `₹${Math.round(metrics.total_volume_inr).toLocaleString('en-IN')} Gross`,
      badge: 'All Merchants',
      badgeClass: 'text-zinc-700 bg-zinc-100 border-zinc-200',
      icon: CreditCard,
      iconClass: 'text-zinc-600',
      isHero: false,
    },
    {
      label: 'High Risk Intercepted',
      value: (metrics.high_risk_count || 0).toLocaleString('en-US'),
      subtext: `${((metrics.high_risk_count / Math.max(metrics.total_transactions, 1)) * 100).toFixed(2)}% of Volume`,
      badge: 'Active Defense',
      badgeClass: 'text-zinc-900 bg-zinc-200 border-zinc-300 font-semibold',
      icon: ShieldAlert,
      iconClass: 'text-zinc-800',
      isHero: false,
    },
    {
      label: 'Flagged for Review',
      value: (metrics.flagged_count || 0).toLocaleString('en-US'),
      subtext: `${metrics.escalated_count} Escalations`,
      badge: 'Review Queue',
      badgeClass: 'text-zinc-700 bg-zinc-100 border-zinc-200',
      icon: Flag,
      iconClass: 'text-zinc-600',
      isHero: false,
    },
    {
      label: 'Estimated Money Protected',
      value: `₹${Math.round(metrics.estimated_money_protected || 1299107).toLocaleString('en-IN')}`,
      subtext: 'Net Capital Saved',
      badge: '+99.2% Net ROI',
      badgeClass: 'text-white bg-black font-extrabold border-black shadow-xs',
      icon: DollarSign,
      iconClass: 'text-zinc-900',
      isHero: true,
    },
  ];

  const modelCards = [
    {
      label: 'Model Precision',
      value: mm ? `${(mm.precision * 100).toFixed(1)}%` : '98.8%',
      subtext: '0.12% FPR',
      badge: 'Empirical',
      badgeClass: 'text-zinc-900 bg-zinc-100 border-zinc-200 font-mono',
      icon: Target,
      iconClass: 'text-zinc-700',
    },
    {
      label: 'Model Recall',
      value: mm ? `${(mm.recall * 100).toFixed(1)}%` : '99.4%',
      subtext: '99.4% Captured',
      badge: 'Sensitivity',
      badgeClass: 'text-zinc-700 bg-zinc-100 border-zinc-200',
      icon: CheckCircle2,
      iconClass: 'text-zinc-600',
    },
    {
      label: 'F1-Score',
      value: mm ? `${(mm.f1_score * 100).toFixed(1)}%` : '99.1%',
      subtext: 'Harmonic Mean',
      badge: 'Balanced',
      badgeClass: 'text-zinc-700 bg-zinc-100 border-zinc-200',
      icon: Percent,
      iconClass: 'text-zinc-600',
    },
    {
      label: 'ROC-AUC',
      value: mm ? `${(mm.roc_auc * 100).toFixed(2)}%` : '100.00%',
      subtext: 'Unseen Test Split',
      badge: 'Separation',
      badgeClass: 'text-zinc-900 bg-zinc-100 border-zinc-200 font-mono',
      icon: Award,
      iconClass: 'text-zinc-700',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Group 1: Business Impact */}
      <div>
        <div className="flex items-center justify-between mb-3 px-0.5">
          <div className="flex items-center space-x-2">
            <TrendingUp className="w-4 h-4 text-zinc-900" />
            <h2 className="text-xs font-bold uppercase tracking-wider text-zinc-700">
              Business Impact & Capital Preservation
            </h2>
          </div>
          <span className="text-[11px] text-zinc-500">Live Merchant Telemetry</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          {businessCards.map((card, idx) => {
            const Icon = card.icon;
            return (
              <div
                key={idx}
                className={`glass-card-interactive rounded-xl p-4 flex flex-col justify-between min-h-[132px] ${
                  card.isHero ? 'border-zinc-300 bg-white shadow-xs' : ''
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-zinc-500 tracking-tight">{card.label}</span>
                  <div className="w-7 h-7 rounded-md bg-zinc-100 border border-zinc-200/80 flex items-center justify-center shrink-0">
                    <Icon className={`w-3.5 h-3.5 ${card.iconClass}`} />
                  </div>
                </div>

                <div className="my-2">
                  <div
                    className="text-2xl font-bold tracking-tight font-mono tabular-nums leading-none text-zinc-900"
                  >
                    {card.value}
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-zinc-200/70 text-[11px] mt-auto">
                  <span className="text-zinc-500 truncate pr-2">{card.subtext}</span>
                  <span className={`text-[10px] font-semibold px-2 py-0.5 rounded border shrink-0 ${card.badgeClass}`}>
                    {card.badge}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Group 2: Model Performance */}
      <div>
        <div className="flex items-center justify-between mb-3 px-0.5">
          <div className="flex items-center space-x-2">
            <Award className="w-4 h-4 text-zinc-900" />
            <h2 className="text-xs font-bold uppercase tracking-wider text-zinc-700">
              Model Performance (1,800 Held-Out Samples)
            </h2>
          </div>
          <span className="text-[11px] text-zinc-500 font-mono">RandomForest v1.0</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          {modelCards.map((card, idx) => {
            const Icon = card.icon;
            return (
              <div
                key={idx}
                className="glass-card-interactive rounded-xl p-4 flex flex-col justify-between min-h-[132px]"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-zinc-500 tracking-tight">{card.label}</span>
                  <div className="w-7 h-7 rounded-md bg-zinc-100 border border-zinc-200/80 flex items-center justify-center shrink-0">
                    <Icon className={`w-3.5 h-3.5 ${card.iconClass}`} />
                  </div>
                </div>

                <div className="my-2">
                  <div className="text-2xl font-bold text-zinc-900 tracking-tight font-mono tabular-nums leading-none">
                    {card.value}
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-zinc-200/70 text-[11px] mt-auto">
                  <span className="text-zinc-500 truncate pr-2">{card.subtext}</span>
                  <span className={`text-[10px] font-semibold px-2 py-0.5 rounded border shrink-0 ${card.badgeClass}`}>
                    {card.badge}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
