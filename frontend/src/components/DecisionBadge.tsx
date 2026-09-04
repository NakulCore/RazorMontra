import React from 'react';
import { CheckCircle2, ShieldAlert, AlertTriangle, ArrowUpRight } from 'lucide-react';
import { DecisionType } from '../types';

interface DecisionBadgeProps {
  decision: DecisionType;
  size?: 'sm' | 'md' | 'lg' | 'hero';
  showSubtitle?: boolean;
}

export const DecisionBadge: React.FC<DecisionBadgeProps> = ({
  decision,
  size = 'md',
  showSubtitle = false,
}) => {
  const getConfig = () => {
    switch (decision) {
      case 'APPROVE':
        return {
          label: 'APPROVE',
          sub: 'Frictionless checkout authorized',
          icon: CheckCircle2,
          bg: 'bg-zinc-100 border-zinc-200 text-zinc-800 font-semibold',
          textColor: 'text-zinc-900',
        };
      case 'VERIFY':
        return {
          label: 'VERIFY',
          sub: 'Step-up 2FA verification required',
          icon: AlertTriangle,
          bg: 'bg-zinc-100 border-zinc-200 text-zinc-800 font-semibold',
          textColor: 'text-zinc-900',
        };
      case 'FLAG':
        return {
          label: 'FLAG',
          sub: 'Frozen for compliance team review',
          icon: ShieldAlert,
          bg: 'bg-zinc-200 border-zinc-300 text-zinc-900 font-semibold',
          textColor: 'text-zinc-900',
        };
      case 'ESCALATE':
        return {
          label: 'ESCALATE',
          sub: 'Immediate quarantine & settlement halt',
          icon: ArrowUpRight,
          bg: 'bg-black border-black text-white font-bold shadow-xs',
          textColor: 'text-white',
        };
    }
  };

  const config = getConfig();
  const Icon = config.icon;

  if (size === 'hero') {
    return (
      <div className={`p-4 rounded-xl border ${config.bg} flex items-center justify-between gap-4 backdrop-blur-md`}>
        <div className="flex items-center space-x-3">
          <div className="p-2.5 rounded-lg bg-white/5 border border-white/15">
            <Icon className={`w-6 h-6 ${config.textColor}`} />
          </div>
          <div>
            <div className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
              Copilot Decision
            </div>
            <div className={`text-xl font-black tracking-tight ${config.textColor}`}>
              {config.label}
            </div>
          </div>
        </div>
        {showSubtitle && (
          <div className="text-right text-xs text-zinc-300 hidden sm:block max-w-[200px] leading-snug">
            {config.sub}
          </div>
        )}
      </div>
    );
  }

  const sizeClasses = {
    sm: 'text-[10px] px-2 py-0.5 gap-1 font-semibold',
    md: 'text-xs px-2.5 py-1 gap-1.5 font-bold',
    lg: 'text-sm px-3.5 py-1.5 gap-2 font-black',
  }[size];

  const iconSizes = {
    sm: 'w-3 h-3',
    md: 'w-3.5 h-3.5',
    lg: 'w-4 h-4',
  }[size];

  return (
    <span
      className={`inline-flex items-center rounded-lg border uppercase tracking-wider ${config.bg} ${sizeClasses}`}
    >
      <Icon className={iconSizes} />
      <span>{config.label}</span>
    </span>
  );
};
