import React from 'react';
import { ShieldCheck, AlertTriangle, ShieldAlert, Flame } from 'lucide-react';
import { RiskClass } from '../types';

interface RiskBadgeProps {
  riskClass: RiskClass;
  score?: number;
  size?: 'sm' | 'md' | 'lg';
  showScore?: boolean;
}

export const RiskBadge: React.FC<RiskBadgeProps> = ({
  riskClass,
  score,
  size = 'md',
  showScore = false,
}) => {
  const getBadgeStyle = () => {
    switch (riskClass) {
      case 'LOW':
        return {
          bg: 'bg-zinc-100 border-zinc-200 text-zinc-700',
          dot: 'bg-zinc-400',
          icon: ShieldCheck,
          label: 'LOW RISK',
        };
      case 'MEDIUM':
        return {
          bg: 'bg-zinc-100 border-zinc-300 text-zinc-800 font-medium',
          dot: 'bg-zinc-600',
          icon: AlertTriangle,
          label: 'MEDIUM RISK',
        };
      case 'HIGH':
        return {
          bg: 'bg-red-50 border-red-200 text-red-700 font-bold',
          dot: 'bg-red-500',
          icon: ShieldAlert,
          label: 'HIGH RISK',
        };
      case 'CRITICAL':
        return {
          bg: 'bg-orange-50 border-orange-200 text-orange-700 font-extrabold',
          dot: 'bg-orange-500 animate-pulse',
          icon: Flame,
          label: 'CRITICAL',
        };
    }
  };

  const style = getBadgeStyle();
  const Icon = style.icon;

  const sizeClasses = {
    sm: 'text-[10px] px-2 py-0.5 gap-1',
    md: 'text-xs px-2.5 py-1 gap-1.5',
    lg: 'text-sm px-3.5 py-1.5 gap-2 font-bold',
  }[size];

  const iconSizes = {
    sm: 'w-3 h-3',
    md: 'w-3.5 h-3.5',
    lg: 'w-4 h-4',
  }[size];

  return (
    <span
      className={`inline-flex items-center rounded-full border font-semibold tracking-wide ${style.bg} ${sizeClasses}`}
    >
      <Icon className={`${iconSizes} shrink-0`} />
      <span>{style.label}</span>
      {showScore && score !== undefined && (
        <span className="font-mono opacity-85 ml-0.5">({score})</span>
      )}
    </span>
  );
};
