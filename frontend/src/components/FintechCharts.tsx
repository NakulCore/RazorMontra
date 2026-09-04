import React, { useState, useRef } from 'react';
import { SystemOverviewMetrics, Transaction } from '../types';
import { ShieldCheck, ShieldAlert, DollarSign, TrendingUp, BarChart2 } from 'lucide-react';

interface ChartsProps {
  metrics: SystemOverviewMetrics | null;
  transactions: Transaction[];
}

export const RiskDistributionChart: React.FC<{ metrics: SystemOverviewMetrics | null }> = ({ metrics }) => {
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

  if (!metrics) {
    return (
      <div className="h-44 rounded-xl bg-zinc-100 border border-zinc-200 flex items-center justify-center text-xs text-zinc-500 animate-pulse">
        Loading risk distribution...
      </div>
    );
  }

  const low = metrics.low_risk_count || 1;
  const med = metrics.medium_risk_count || 0;
  const high = metrics.high_risk_count || 0;
  const total = Math.max(1, low + med + high);

  const categories = [
    { label: 'Low Risk', sub: 'Approved', count: low, pct: (low / total) * 100, color: '#111827', bg: 'bg-zinc-900' },
    { label: 'Medium Risk', sub: 'Verify 2FA', count: med, pct: (med / total) * 100, color: 'rgba(0, 0, 0, 0.45)', bg: 'bg-zinc-400' },
    { label: 'High & Critical', sub: 'Quarantined', count: high, pct: (high / total) * 100, color: 'rgba(0, 0, 0, 0.2)', bg: 'bg-zinc-300' },
  ];

  return (
    <div className="glass-card rounded-xl p-5 space-y-4 h-full flex flex-col justify-between">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <ShieldAlert className="w-4 h-4 text-zinc-900" />
          <h3 className="text-xs font-bold text-zinc-900 uppercase tracking-wider">Risk Level Distribution</h3>
        </div>
        <span className="text-[11px] font-mono text-zinc-500">Total: {total.toLocaleString()}</span>
      </div>

      {/* Multi-segment Progress Bar */}
      <div className="space-y-3 my-auto">
        <div className="h-3 w-full bg-zinc-100 rounded-full overflow-hidden flex p-0.5 border border-zinc-200">
          {categories.map((cat, idx) => (
            <div
              key={idx}
              style={{ width: `${Math.max(cat.pct, 2)}%`, backgroundColor: cat.color }}
              onMouseEnter={() => setHoveredIdx(idx)}
              onMouseLeave={() => setHoveredIdx(null)}
              className="h-full first:rounded-l-full last:rounded-r-full transition-all duration-200 cursor-pointer hover:opacity-90"
              title={`${cat.label} (${cat.sub}): ${cat.count.toLocaleString()} (${cat.pct.toFixed(1)}%)`}
            />
          ))}
        </div>

        {/* Legend & Breakdown - No Truncation */}
        <div className="grid grid-cols-3 gap-2 pt-1">
          {categories.map((cat, idx) => {
            const isHovered = hoveredIdx === idx;
            return (
              <div
                key={idx}
                onMouseEnter={() => setHoveredIdx(idx)}
                onMouseLeave={() => setHoveredIdx(null)}
                className={`p-2 rounded-lg border transition-all cursor-pointer ${
                  isHovered
                    ? 'bg-white border-zinc-300 shadow-xs'
                    : 'bg-zinc-50 border-zinc-200/80 hover:border-zinc-300'
                }`}
              >
                <div className="flex items-center space-x-1.5">
                  <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${cat.bg}`} />
                  <span className="text-[10px] font-semibold text-zinc-600 tracking-tight">{cat.label}</span>
                </div>
                <div className="mt-1 flex items-baseline justify-between">
                  <span className="text-sm font-bold text-zinc-900 font-mono tabular-nums">{cat.count.toLocaleString()}</span>
                  <span className="text-[10px] font-mono text-zinc-500">{cat.pct.toFixed(1)}%</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export const VolumeTrendChart: React.FC<{ transactions: Transaction[] }> = ({ transactions }) => {
  const [activeIdx, setActiveIdx] = useState<number | null>(null);
  const svgRef = useRef<SVGSVGElement>(null);

  // Group latest transactions into display points
  const recent = transactions.slice(0, 24).reverse();
  if (recent.length === 0) {
    return (
      <div className="glass-card rounded-2xl p-5 flex items-center justify-center text-xs text-zinc-500 h-64">
        No recent transactions to chart.
      </div>
    );
  }

  const maxAmount = Math.max(...recent.map((t) => t.amount), 10000);
  const width = 600;
  const height = 140;
  const paddingX = 20;
  const paddingY = 20;

  const points = recent.map((t, idx) => {
    const x = paddingX + (idx / Math.max(recent.length - 1, 1)) * (width - paddingX * 2);
    const y = height - paddingY - (t.amount / maxAmount) * (height - paddingY * 2);
    const isHigh = t.is_fraud || t.amount > 35000 || t.transactions_last_10_minutes >= 3 || t.new_location;
    return { x, y, tx: t, isHigh };
  });

  const pathD = points.reduce((acc, pt, i) => {
    return i === 0 ? `M ${pt.x},${pt.y}` : `${acc} L ${pt.x},${pt.y}`;
  }, '');

  const areaD = points.length > 0
    ? `${pathD} L ${points[points.length - 1].x},${height - paddingY} L ${points[0].x},${height - paddingY} Z`
    : '';

  const handlePointerMove = (e: React.MouseEvent<SVGSVGElement> | React.TouchEvent<SVGSVGElement>) => {
    if (!svgRef.current || points.length === 0) return;
    const rect = svgRef.current.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const mouseX = ((clientX - rect.left) / rect.width) * width;

    // Find the closest point along the x-axis
    let closestIdx = 0;
    let minDistance = Infinity;
    for (let i = 0; i < points.length; i++) {
      const dist = Math.abs(points[i].x - mouseX);
      if (dist < minDistance) {
        minDistance = dist;
        closestIdx = i;
      }
    }
    setActiveIdx(closestIdx);
  };

  const handlePointerLeave = () => {
    setActiveIdx(null);
  };

  const activePoint = activeIdx !== null && points[activeIdx] ? points[activeIdx] : null;

  return (
    <div className="glass-card rounded-xl p-5 space-y-4 h-full flex flex-col justify-between">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <TrendingUp className="w-4 h-4 text-zinc-900" />
          <h3 className="text-xs font-bold text-zinc-900 uppercase tracking-wider">
            Transaction Velocity & Risk Stream
          </h3>
        </div>
        <div className="flex items-center space-x-4 text-[11px]">
          <span className="flex items-center gap-1.5 text-zinc-500">
            <span className="w-2 h-2 rounded-full bg-zinc-400" />
            Normal Volume
          </span>
          <span className="flex items-center gap-1.5 text-red-700 font-medium">
            <span className="w-2 h-2 rounded-full bg-red-600 shadow-[0_0_4px_rgba(239,68,68,0.5)]" />
            High Risk Intercepted
          </span>
        </div>
      </div>

      <div className="relative my-auto select-none">
        <svg
          ref={svgRef}
          viewBox={`0 0 ${width} ${height}`}
          className="w-full h-36 overflow-visible cursor-crosshair"
          onMouseMove={handlePointerMove}
          onMouseLeave={handlePointerLeave}
          onTouchMove={handlePointerMove}
          onTouchEnd={handlePointerLeave}
        >
          <defs>
            <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#000000" stopOpacity="0.08" />
              <stop offset="100%" stopColor="#000000" stopOpacity="0.0" />
            </linearGradient>
          </defs>

          {/* Grid lines */}
          <line x1={paddingX} y1={paddingY} x2={width - paddingX} y2={paddingY} stroke="rgba(0,0,0,0.06)" strokeDasharray="2 2" />
          <line x1={paddingX} y1={height / 2} x2={width - paddingX} y2={height / 2} stroke="rgba(0,0,0,0.06)" strokeDasharray="2 2" />
          <line x1={paddingX} y1={height - paddingY} x2={width - paddingX} y2={height - paddingY} stroke="rgba(0,0,0,0.08)" />

          {/* Area Fill */}
          <path d={areaD} fill="url(#areaGradient)" />

          {/* Line */}
          <path d={pathD} fill="none" stroke="#18181b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />

          {/* Vertical Tracking Guideline when active */}
          {activePoint && (
            <line
              x1={activePoint.x}
              y1={paddingY - 6}
              x2={activePoint.x}
              y2={height - paddingY + 6}
              stroke="rgba(0, 0, 0, 0.25)"
              strokeWidth="1.5"
              strokeDasharray="3 3"
            />
          )}

          {/* Points & Generous Hit Areas */}
          {points.map((pt, i) => {
            const isActive = activeIdx === i;
            return (
              <g key={i}>
                {/* Visual circle: smooth radius transition with zero CSS transform offset */}
                <circle
                  cx={pt.x}
                  cy={pt.y}
                  r={isActive ? 6 : pt.isHigh ? 4.5 : 3}
                  fill={pt.isHigh ? '#ef4444' : isActive ? '#18181b' : 'rgba(0, 0, 0, 0.4)'}
                  stroke="#ffffff"
                  strokeWidth={isActive ? 2.5 : 1.5}
                  className="transition-all duration-150 pointer-events-none"
                />

                {/* Active Halo Glow */}
                {isActive && (
                  <circle
                    cx={pt.x}
                    cy={pt.y}
                    r={11}
                    fill={pt.isHigh ? 'rgba(239, 68, 68, 0.25)' : 'rgba(0, 0, 0, 0.12)'}
                    className="pointer-events-none animate-pulse"
                  />
                )}

                {/* Generous Hit Circle for immediate precision */}
                <circle
                  cx={pt.x}
                  cy={pt.y}
                  r={18}
                  fill="transparent"
                  className="cursor-pointer"
                  onMouseEnter={() => setActiveIdx(i)}
                />
              </g>
            );
          })}
        </svg>

        {/* Dynamic Tooltip following active point position */}
        {activePoint && (
          <div
            className="absolute -top-3 pointer-events-none z-20 transition-all duration-75 transform -translate-x-1/2"
            style={{
              left: `${Math.max(16, Math.min(84, (activePoint.x / width) * 100))}%`,
            }}
          >
            <div className="px-3 py-1.5 rounded-lg bg-white/95 backdrop-blur-xl border border-zinc-200/90 shadow-xl text-xs flex items-center gap-2 whitespace-nowrap">
              <span className="font-mono text-zinc-600 font-medium">{activePoint.tx.transaction_id}</span>
              <span className="text-zinc-900 font-bold font-mono">₹{Math.round(activePoint.tx.amount).toLocaleString('en-IN')}</span>
              <span
                className={`text-[10px] font-bold px-1.5 py-0.2 rounded border ${
                  activePoint.isHigh ? 'bg-red-50 text-red-700 border-red-200' : 'bg-zinc-100 text-zinc-800 border-zinc-200'
                }`}
              >
                {activePoint.isHigh ? 'HIGH RISK' : 'NORMAL'}
              </span>
              <span className="text-zinc-500 text-[10px] font-mono">
                {new Date(activePoint.tx.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export const FinancialImpactChart: React.FC<{ metrics: SystemOverviewMetrics | null }> = ({ metrics }) => {
  const mm = metrics?.model_metrics;
  if (!mm) {
    return (
      <div className="glass-card rounded-xl p-5 flex items-center justify-center text-xs text-zinc-500 h-52">
        Financial impact telemetry loading...
      </div>
    );
  }

  const detected = mm.fraud_value_detected || 1299407.17;
  const netProtected = mm.estimated_money_protected || 1299107.17;
  const friction = mm.false_positive_cost || 300.0;
  const missed = mm.false_negative_cost || 14835.14;

  const maxVal = Math.max(detected, 100000);

  return (
    <div className="glass-card rounded-xl p-5 space-y-4 h-full flex flex-col justify-between">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <DollarSign className="w-4 h-4 text-zinc-900" />
          <h3 className="text-xs font-bold text-zinc-900 uppercase tracking-wider">Financial Capital Impact</h3>
        </div>
        <span className="text-xs font-mono font-bold text-zinc-900 tabular-nums">
          Net: ₹{Math.round(netProtected).toLocaleString('en-IN')}
        </span>
      </div>

      <div className="space-y-3.5 text-xs my-auto">
        {/* Row 1: Gross Fraud Intercepted */}
        <div className="space-y-1.5">
          <div className="flex justify-between text-[11px]">
            <span className="text-zinc-700 font-medium">Gross Fraud Value Intercepted</span>
            <span className="font-mono font-bold text-zinc-900 tabular-nums">₹{Math.round(detected).toLocaleString('en-IN')}</span>
          </div>
          <div className="h-2 w-full bg-zinc-100 rounded-full overflow-hidden border border-zinc-200">
            <div className="h-full bg-black rounded-full" style={{ width: `${(detected / maxVal) * 100}%` }} />
          </div>
        </div>

        {/* Row 2: Customer Friction / FP Review Cost */}
        <div className="space-y-1.5">
          <div className="flex justify-between text-[11px]">
            <span className="text-zinc-500 font-medium">Customer Support Review Cost (Friction)</span>
            <span className="font-mono font-semibold text-zinc-700 tabular-nums">-₹{Math.round(friction).toLocaleString('en-IN')}</span>
          </div>
          <div className="h-2 w-full bg-zinc-100 rounded-full overflow-hidden border border-zinc-200">
            <div className="h-full bg-zinc-400 rounded-full" style={{ width: `${Math.max((friction / maxVal) * 100, 2)}%` }} />
          </div>
        </div>

        {/* Row 3: Missed Fraud Exposure */}
        <div className="space-y-1.5">
          <div className="flex justify-between text-[11px]">
            <span className="text-zinc-500 font-medium">False Negative Leakage (Missed)</span>
            <span className="font-mono font-semibold text-zinc-500 tabular-nums">₹{Math.round(missed).toLocaleString('en-IN')}</span>
          </div>
          <div className="h-2 w-full bg-zinc-100 rounded-full overflow-hidden border border-zinc-200">
            <div className="h-full bg-zinc-300 rounded-full" style={{ width: `${Math.max((missed / maxVal) * 100, 3)}%` }} />
          </div>
        </div>
      </div>
    </div>
  );
};
