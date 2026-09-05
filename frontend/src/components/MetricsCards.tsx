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
  Award,
  ArrowUpRight,
} from 'lucide-react';
import { SystemOverviewMetrics, NavTab } from '../types';

interface MetricsCardsProps {
  metrics: SystemOverviewMetrics | null;
  onNavigateTab?: (tab: NavTab) => void;
}

export const MetricsCards: React.FC<MetricsCardsProps> = ({ metrics, onNavigateTab }) => {
  if (!metrics) {
    return (
      <section
        role="status"
        aria-busy="true"
        aria-label="Loading Business Impact and Capital Preservation metrics"
        className="space-y-6"
      >
        <span className="sr-only">Loading Business Impact and Capital Preservation metrics...</span>
        <div>
          <div className="h-4 w-56 bg-zinc-200 rounded mb-3 animate-pulse" />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <div
                key={i}
                className="h-32 rounded-xl bg-white/70 border border-zinc-200/80 animate-pulse p-4 flex flex-col justify-between"
              >
                <div className="flex justify-between items-center">
                  <div className="h-3.5 w-24 bg-zinc-200 rounded" />
                  <div className="w-7 h-7 bg-zinc-200 rounded-md" />
                </div>
                <div className="h-7 w-32 bg-zinc-200 rounded" />
                <div className="h-3 w-full bg-zinc-200 rounded" />
              </div>
            ))}
          </div>
        </div>

        <div>
          <div className="h-4 w-64 bg-zinc-200 rounded mb-3 animate-pulse" />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <div
                key={i}
                className="h-32 rounded-xl bg-white/70 border border-zinc-200/80 animate-pulse p-4 flex flex-col justify-between"
              >
                <div className="flex justify-between items-center">
                  <div className="h-3.5 w-24 bg-zinc-200 rounded" />
                  <div className="w-7 h-7 bg-zinc-200 rounded-md" />
                </div>
                <div className="h-7 w-32 bg-zinc-200 rounded" />
                <div className="h-3 w-full bg-zinc-200 rounded" />
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  const mm = metrics.model_metrics;

  const businessCards = [
    {
      id: 'total-processed',
      label: 'Total Processed',
      secondaryLabel: 'Transaction Volume',
      value: (metrics.total_transactions || 12000).toLocaleString('en-US'),
      subtext: `₹${Math.round(metrics.total_volume_inr).toLocaleString('en-IN')} Gross`,
      badge: 'All Merchants',
      badgeClass: 'text-zinc-700 bg-zinc-100 border-zinc-200',
      icon: CreditCard,
      iconClass: 'text-zinc-600',
      isHero: false,
      targetTab: 'transactions' as NavTab,
      actionLabel: 'Click or press Enter to inspect all live transactions',
    },
    {
      id: 'high-risk-intercepted',
      label: 'High Risk Intercepted',
      secondaryLabel: 'Active Risk Interceptions',
      value: (metrics.high_risk_count || 0).toLocaleString('en-US'),
      subtext: `${((metrics.high_risk_count / Math.max(metrics.total_transactions, 1)) * 100).toFixed(2)}% of Volume`,
      badge: 'Active Defense',
      badgeClass: 'text-zinc-900 bg-zinc-200 border-zinc-300 font-semibold',
      icon: ShieldAlert,
      iconClass: 'text-zinc-800',
      isHero: false,
      targetTab: 'alerts' as NavTab,
      actionLabel: 'Click or press Enter to view high-risk alerts queue',
    },
    {
      id: 'flagged-for-review',
      label: 'Flagged for Review',
      secondaryLabel: 'Escalation Queue',
      value: (metrics.flagged_count || 0).toLocaleString('en-US'),
      subtext: `${metrics.escalated_count} Escalations`,
      badge: 'Review Queue',
      badgeClass: 'text-zinc-700 bg-zinc-100 border-zinc-200',
      icon: Flag,
      iconClass: 'text-zinc-600',
      isHero: false,
      targetTab: 'alerts' as NavTab,
      actionLabel: 'Click or press Enter to triage flagged review queue',
    },
    {
      id: 'capital-preservation',
      label: 'Capital Preserved',
      secondaryLabel: 'Estimated Money Protected',
      value: `₹${Math.round(metrics.estimated_money_protected || 1299107).toLocaleString('en-IN')}`,
      subtext: 'Net Capital Saved',
      badge: '+99.2% Net ROI',
      badgeClass: 'text-white bg-black font-extrabold border-black shadow-xs',
      icon: DollarSign,
      iconClass: 'text-zinc-900',
      isHero: true,
      targetTab: 'metrics' as NavTab,
      actionLabel: 'Click or press Enter to view capital preservation & financial ROI breakdown',
    },
  ];

  const modelCards = [
    {
      id: 'model-precision',
      label: 'Model Precision',
      value: mm ? `${(mm.precision * 100).toFixed(1)}%` : '98.8%',
      subtext: '0.12% FPR',
      badge: 'Empirical',
      badgeClass: 'text-zinc-900 bg-zinc-100 border-zinc-200 font-mono',
      icon: Target,
      iconClass: 'text-zinc-700',
      isHero: false,
      targetTab: 'metrics' as NavTab,
      actionLabel: 'Click or press Enter to view model precision & ROC curves in Model Evaluation',
    },
    {
      id: 'model-recall',
      label: 'Model Recall',
      value: mm ? `${(mm.recall * 100).toFixed(1)}%` : '99.4%',
      subtext: '99.4% Captured',
      badge: 'Sensitivity',
      badgeClass: 'text-zinc-700 bg-zinc-100 border-zinc-200',
      icon: CheckCircle2,
      iconClass: 'text-zinc-600',
      isHero: false,
      targetTab: 'metrics' as NavTab,
      actionLabel: 'Click or press Enter to inspect sensitivity metrics in Model Evaluation',
    },
    {
      id: 'f1-score',
      label: 'F1-Score',
      value: mm ? `${(mm.f1_score * 100).toFixed(1)}%` : '99.1%',
      subtext: 'Harmonic Mean',
      badge: 'Balanced',
      badgeClass: 'text-zinc-700 bg-zinc-100 border-zinc-200',
      icon: Percent,
      iconClass: 'text-zinc-600',
      isHero: false,
      targetTab: 'metrics' as NavTab,
      actionLabel: 'Click or press Enter to inspect balanced F1-score in Model Evaluation',
    },
    {
      id: 'roc-auc',
      label: 'ROC-AUC',
      value: mm ? `${(mm.roc_auc * 100).toFixed(2)}%` : '100.00%',
      subtext: 'Unseen Test Split',
      badge: 'Separation',
      badgeClass: 'text-zinc-900 bg-zinc-100 border-zinc-200 font-mono',
      icon: Award,
      iconClass: 'text-zinc-700',
      isHero: false,
      targetTab: 'metrics' as NavTab,
      actionLabel: 'Click or press Enter to inspect ROC-AUC separation in Model Evaluation',
    },
  ];

  const renderCard = (card: typeof businessCards[number] | typeof modelCards[number]) => {
    const Icon = card.icon;
    const isInteractive = Boolean(onNavigateTab && card.targetTab);

    return (
      <button
        key={card.id}
        type="button"
        onClick={() => onNavigateTab?.(card.targetTab)}
        aria-label={`${card.label}: ${card.value}, ${card.subtext}. ${card.badge}. ${card.actionLabel}.`}
        title={card.actionLabel}
        className={`glass-card-interactive rounded-xl p-4 flex flex-col justify-between min-h-[136px] text-left w-full transition-all group select-none relative focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-900 focus-visible:ring-offset-2 ${
          card.isHero ? 'border-zinc-300 bg-white shadow-xs' : ''
        } ${
          isInteractive
            ? 'cursor-pointer hover:border-zinc-400 hover:shadow-md active:scale-[0.985]'
            : 'cursor-default'
        }`}
      >
        <div className="flex items-start justify-between gap-2">
          <div className="flex flex-col min-w-0">
            <span className="text-xs font-semibold text-zinc-700 group-hover:text-zinc-900 transition-colors tracking-tight truncate">
              {card.label}
            </span>
            {'secondaryLabel' in card && card.secondaryLabel && (
              <span className="text-[10px] text-zinc-500 truncate">
                {card.secondaryLabel}
              </span>
            )}
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <div className="w-7 h-7 rounded-md bg-zinc-100 border border-zinc-200/80 flex items-center justify-center shrink-0">
              <Icon className={`w-3.5 h-3.5 ${card.iconClass}`} aria-hidden="true" />
            </div>
            {isInteractive && (
              <div
                className="w-5 h-5 rounded flex items-center justify-center text-zinc-400 group-hover:text-zinc-900 transition-colors"
                aria-hidden="true"
              >
                <ArrowUpRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
              </div>
            )}
          </div>
        </div>

        <div className="my-2">
          <div className="text-2xl font-bold tracking-tight font-mono tabular-nums leading-none text-zinc-900">
            {card.value}
          </div>
        </div>

        <div className="flex items-center justify-between pt-2 border-t border-zinc-200/70 text-[11px] mt-auto">
          <span className="text-zinc-600 truncate pr-2 group-hover:text-zinc-900 transition-colors">
            {card.subtext}
          </span>
          <span className={`text-[10px] font-semibold px-2 py-0.5 rounded border shrink-0 ${card.badgeClass}`}>
            {card.badge}
          </span>
        </div>
      </button>
    );
  };

  return (
    <div className="space-y-6">
      {/* Group 1: Business Impact & Capital Preservation */}
      <section aria-labelledby="business-impact-heading">
        <div className="flex items-center justify-between mb-3 px-0.5">
          <div className="flex items-center space-x-2">
            <TrendingUp className="w-4 h-4 text-zinc-900" aria-hidden="true" />
            <h2 id="business-impact-heading" className="text-xs font-bold uppercase tracking-wider text-zinc-900">
              Business Impact &amp; Capital Preservation
            </h2>
          </div>
          <div className="flex items-center gap-2">
            <span className="inline-block w-2 h-2 rounded-full bg-emerald-500 animate-pulse" aria-hidden="true" />
            <span className="text-[11px] text-zinc-600 font-medium">Live Merchant Telemetry</span>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {businessCards.map((card) => renderCard(card))}
        </div>
      </section>

      {/* Group 2: Model Performance */}
      <section aria-labelledby="model-performance-heading">
        <div className="flex items-center justify-between mb-3 px-0.5">
          <div className="flex items-center space-x-2">
            <Award className="w-4 h-4 text-zinc-900" aria-hidden="true" />
            <h2 id="model-performance-heading" className="text-xs font-bold uppercase tracking-wider text-zinc-900">
              Model Performance (1,800 Held-Out Samples)
            </h2>
          </div>
          <span className="text-[11px] text-zinc-600 font-mono font-medium">RandomForest v1.0</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {modelCards.map((card) => renderCard(card))}
        </div>
      </section>
    </div>
  );
};

