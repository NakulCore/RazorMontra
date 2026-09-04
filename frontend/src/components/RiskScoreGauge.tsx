import React from 'react';

interface RiskScoreGaugeProps {
  score: number;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showLabel?: boolean;
}

export const RiskScoreGauge: React.FC<RiskScoreGaugeProps> = ({
  score,
  size = 'md',
  showLabel = false,
}) => {
  const clampedScore = Math.max(0, Math.min(100, score));

  // Determine monochrome config based on fintech risk thresholds (Apple Light theme)
  const getColor = (s: number) => {
    if (s >= 90) return { stroke: '#f97316', fill: 'rgba(249, 115, 22, 0.08)', text: 'text-orange-600 font-black', label: 'CRITICAL' };
    if (s >= 75) return { stroke: '#ef4444', fill: 'rgba(239, 68, 68, 0.08)', text: 'text-red-600 font-bold', label: 'HIGH' };
    if (s >= 40) return { stroke: 'rgba(0, 0, 0, 0.5)', fill: 'transparent', text: 'text-zinc-700 font-semibold', label: 'MEDIUM' };
    return { stroke: 'rgba(0, 0, 0, 0.2)', fill: 'transparent', text: 'text-zinc-500 font-medium', label: 'LOW' };
  };

  const color = getColor(clampedScore);

  const dimMap = {
    sm: { size: 36, strokeWidth: 3.5, textSize: 'text-[11px] font-bold', radius: 14 },
    md: { size: 48, strokeWidth: 4, textSize: 'text-xs font-extrabold', radius: 19 },
    lg: { size: 68, strokeWidth: 5, textSize: 'text-lg font-black', radius: 28 },
    xl: { size: 88, strokeWidth: 6, textSize: 'text-2xl font-black', radius: 36 },
  }[size];

  const circumference = 2 * Math.PI * dimMap.radius;
  const strokeDashoffset = circumference - (clampedScore / 100) * circumference;

  return (
    <div className="inline-flex flex-col items-center justify-center">
      <div className="relative flex items-center justify-center" style={{ width: dimMap.size, height: dimMap.size }}>
        <svg
          className="transform -rotate-90"
          width={dimMap.size}
          height={dimMap.size}
        >
          {/* Background Track */}
          <circle
            cx={dimMap.size / 2}
            cy={dimMap.size / 2}
            r={dimMap.radius}
            stroke="rgba(0, 0, 0, 0.08)"
            strokeWidth={dimMap.strokeWidth}
            fill="transparent"
          />
          {/* Progress Indicator */}
          <circle
            cx={dimMap.size / 2}
            cy={dimMap.size / 2}
            r={dimMap.radius}
            stroke={color.stroke}
            strokeWidth={dimMap.strokeWidth}
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            fill={color.fill}
            className="transition-all duration-700 ease-out"
          />
        </svg>
        <span className={`absolute font-mono ${dimMap.textSize} ${color.text} tracking-tighter`}>
          {clampedScore}
        </span>
      </div>
      {showLabel && (
        <span className={`text-[9px] font-bold tracking-wider mt-1 uppercase ${color.text}`}>
          {color.label}
        </span>
      )}
    </div>
  );
};
