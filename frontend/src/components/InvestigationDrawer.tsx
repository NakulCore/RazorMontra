import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  X,
  ShieldAlert,
  ShieldCheck,
  Cpu,
  AlertTriangle,
  FileText,
  CheckCircle2,
  Clock,
  Layers,
  Sparkles,
  ArrowRight,
  Lock,
  Copy,
  Check,
  Smartphone,
  Globe,
  Flame,
  FileCheck,
  AlertCircle,
  Minus,
  Maximize2,
  Minimize2,
  GripVertical,
  ChevronLeft,
  ChevronRight,
  RefreshCw
} from 'lucide-react';
import { ComprehensiveRiskAnalysis, DecisionType, PolicyClause } from '../types';
import { RiskScoreGauge } from './RiskScoreGauge';
import { DecisionBadge } from './DecisionBadge';
import { RiskBadge } from './RiskBadge';
import { executeAction } from '../services/api';

export interface InvestigationDrawerProps {
  analysis: ComprehensiveRiskAnalysis | null;
  onClose: () => void;
  isMinimized?: boolean;
  onToggleMinimize?: () => void;
  drawerWidth?: number;
  onWidthChange?: (width: number) => void;
  onActionExecuted?: (decision: DecisionType, actionResult: any) => void;
}

export const InvestigationDrawer: React.FC<InvestigationDrawerProps> = ({
  analysis,
  onClose,
  isMinimized = false,
  onToggleMinimize,
  drawerWidth,
  onWidthChange,
  onActionExecuted,
}) => {
  const [copiedAudit, setCopiedAudit] = useState(false);
  const [copiedTxn, setCopiedTxn] = useState(false);
  const [selectedPolicy, setSelectedPolicy] = useState<PolicyClause | null>(null);

  const [localWidth, setLocalWidth] = useState<number>(720);
  const currentWidth = drawerWidth ?? localWidth;

  const setWidth = (w: number) => {
    if (onWidthChange) {
      onWidthChange(w);
    } else {
      setLocalWidth(w);
    }
  };

  const isDraggingRef = useRef(false);
  const startXRef = useRef(0);
  const startWidthRef = useRef(720);

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      isDraggingRef.current = true;
      startXRef.current = e.clientX;
      startWidthRef.current = currentWidth;
      document.body.style.userSelect = 'none';

      const handleMouseMove = (moveEvent: MouseEvent) => {
        if (!isDraggingRef.current) return;
        const delta = startXRef.current - moveEvent.clientX;
        const newWidth = Math.max(380, Math.min(window.innerWidth - 60, startWidthRef.current + delta));
        setWidth(newWidth);
      };

      const handleMouseUp = () => {
        isDraggingRef.current = false;
        document.body.style.userSelect = '';
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseup', handleMouseUp);
      };

      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    },
    [currentWidth]
  );

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  if (!analysis) return null;

  const {
    transaction: tx,
    ml_result: ml,
    rule_results: rules,
    retrieved_policies: policies,
    investigation: inv,
    decision: dec,
    action: act,
    audit_id,
    timestamp: pipelineTimestamp,
  } = analysis;

  const triggeredRules = rules.filter((r) => r.triggered);

  const copyToClipboard = (text: string, type: 'txn' | 'audit') => {
    navigator.clipboard.writeText(text);
    if (type === 'txn') {
      setCopiedTxn(true);
      setTimeout(() => setCopiedTxn(false), 2000);
    } else {
      setCopiedAudit(true);
      setTimeout(() => setCopiedAudit(false), 2000);
    }
  };

  const [currentDecision, setCurrentDecision] = useState<DecisionType>(() => analysis.decision.decision);
  const [currentAction, setCurrentAction] = useState<any>(() => analysis.action);
  const [isExecutingAction, setIsExecutingAction] = useState<'approve' | 'verify' | 'flag' | 'escalate' | null>(null);
  const [actionFeedback, setActionFeedback] = useState<string | null>(null);
  const stepperScrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (analysis) {
      setCurrentDecision(analysis.decision.decision);
      setCurrentAction(analysis.action);
      setActionFeedback(null);
    }
  }, [analysis]);

  const scrollStepper = (direction: 'left' | 'right') => {
    if (stepperScrollRef.current) {
      stepperScrollRef.current.scrollBy({
        left: direction === 'left' ? -260 : 260,
        behavior: 'smooth',
      });
    }
  };

  const handleTriggerAction = async (action: 'approve' | 'verify' | 'flag' | 'escalate') => {
    if (isExecutingAction) return;
    setIsExecutingAction(action);
    setActionFeedback(null);
    try {
      const decisionMap: Record<string, DecisionType> = {
        approve: 'APPROVE',
        verify: 'VERIFY',
        flag: 'FLAG',
        escalate: 'ESCALATE',
      };
      const newDec = decisionMap[action];
      const res = await executeAction({
        transaction_id: tx.transaction_id,
        action,
        reason: `Analyst manually executed ${action.toUpperCase()} from Risk Investigation Console`,
        amount: tx.amount,
        currency: tx.currency,
      });
      setCurrentDecision(newDec);
      setCurrentAction(res);
      setActionFeedback(`Action "${action.toUpperCase()}" processed on Razorpay: ${res.status}`);
      if (onActionExecuted) {
        onActionExecuted(newDec, res);
      }
    } catch (err: any) {
      console.error('Failed to execute action:', err);
      setActionFeedback(`Execution failed: ${err.message || 'Action error'}`);
    } finally {
      setIsExecutingAction(null);
    }
  };

  const steps = [
    { num: '01', title: 'TRANSACTION RECEIVED', status: `₹${Math.round(tx.amount).toLocaleString('en-IN')}`, icon: Layers },
    { num: '02', title: 'ML RISK ANALYSIS', status: `${ml.risk_score}/100 • ${ml.risk_class}`, icon: Cpu },
    { num: '03', title: 'SAFETY RULES', status: triggeredRules.length > 0 ? `${triggeredRules.length} Violated` : 'Passed (0)', icon: AlertTriangle },
    { num: '04', title: 'POLICIES RETRIEVED', status: `${policies.length} Clauses Matched`, icon: FileText },
    { num: '05', title: 'AI INVESTIGATION', status: 'Evidence Synthesized', icon: Sparkles },
    { num: '06', title: 'DECISION', status: currentDecision, icon: CheckCircle2 },
    { num: '07', title: 'ACTION DISPATCH', status: currentAction?.status || 'DISPATCHED', icon: Lock },
    { num: '08', title: 'AUDIT LOGGED', status: 'SHA-256 HMAC', icon: FileCheck },
  ];

  // Minimized Compact Floating Bar
  if (isMinimized) {
    return (
      <div className="fixed bottom-5 right-5 z-50 max-w-md w-auto bg-white/95 backdrop-blur-2xl border border-zinc-200/90 rounded-2xl p-3 shadow-2xl flex items-center space-x-3.5 transition-all duration-200 animate-in fade-in slide-in-from-bottom-3">
        <div className="flex items-center space-x-2.5">
          <RiskScoreGauge score={ml.risk_score} size="sm" />
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-xs font-mono font-bold text-zinc-900">{tx.transaction_id}</span>
              <DecisionBadge decision={currentDecision} size="sm" />
            </div>
            <p className="text-[11px] text-zinc-500 font-mono">
              Score: <strong className="text-zinc-900">{ml.risk_score}/100</strong> • {ml.risk_class}
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-1.5 pl-2 border-l border-zinc-200">
          <button
            onClick={onToggleMinimize}
            className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-black text-white hover:bg-zinc-800 transition"
          >
            Restore
          </button>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100 transition"
            title="Close Console"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    );
  }

  const drawerInnerContent = (
    <div className="w-full h-full flex flex-col bg-white/95 backdrop-blur-2xl relative select-text">
      {/* Left Resizer Drag Handle (desktop only) */}
      <div
        onMouseDown={handleMouseDown}
        className="hidden md:flex absolute -left-1.5 top-0 bottom-0 w-3 cursor-col-resize hover:bg-black/10 active:bg-black/20 z-30 items-center justify-center group"
        title="Drag to adjust console width"
      >
        <div className="w-1 h-10 rounded-full bg-zinc-300 group-hover:bg-zinc-600 transition-colors" />
      </div>

      {/* Drawer Non-scrolling Top Container: Header + Stepper */}
      <div className="shrink-0 bg-white border-b border-zinc-200 z-20 sticky top-0 shadow-xs">
        {/* Drawer Header */}
        <div className="p-4 sm:p-5 flex flex-wrap items-center justify-between gap-3 border-b border-zinc-100">
          <div className="space-y-0.5 min-w-[200px]">
            <div className="flex items-center space-x-2.5 flex-wrap gap-y-1">
              <span className="text-base sm:text-lg font-bold text-zinc-900 tracking-tight">
                Risk Investigation Console
              </span>
              <button
                onClick={() => copyToClipboard(tx.transaction_id, 'txn')}
                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-zinc-100 hover:bg-zinc-200 text-zinc-800 border border-zinc-200 text-xs font-mono transition"
                title="Click to copy Transaction ID"
              >
                <span>{tx.transaction_id}</span>
                {copiedTxn ? <Check className="w-3 h-3 text-black" /> : <Copy className="w-3 h-3 text-zinc-500" />}
              </button>
            </div>
            <p className="text-[11px] text-zinc-500">
              Initiated {new Date(tx.timestamp).toLocaleString()} • Merchant: <strong className="text-zinc-800 font-mono">{tx.merchant_id}</strong>
            </p>
          </div>

          {/* Sizing & Window Controls - Always visible */}
          <div className="flex items-center space-x-1.5 shrink-0 flex-wrap gap-y-1">
            {/* Width Presets */}
            <div className="flex items-center bg-zinc-100 rounded-lg p-0.5 border border-zinc-200 text-[10px] font-medium mr-1">
              <button
                onClick={() => setWidth(460)}
                className={`px-2 py-0.5 rounded transition ${currentWidth <= 520 ? 'bg-white text-zinc-900 font-bold shadow-xs' : 'text-zinc-500 hover:text-zinc-900'}`}
                title="Compact view (460px)"
              >
                Compact
              </button>
              <button
                onClick={() => setWidth(680)}
                className={`px-2 py-0.5 rounded transition ${currentWidth > 520 && currentWidth <= 760 ? 'bg-white text-zinc-900 font-bold shadow-xs' : 'text-zinc-500 hover:text-zinc-900'}`}
                title="Balanced view (680px)"
              >
                Balanced
              </button>
              <button
                onClick={() => setWidth(920)}
                className={`px-2 py-0.5 rounded transition ${currentWidth > 760 && currentWidth < window.innerWidth - 80 ? 'bg-white text-zinc-900 font-bold shadow-xs' : 'text-zinc-500 hover:text-zinc-900'}`}
                title="Wide view (920px)"
              >
                Wide
              </button>
              <button
                onClick={() => setWidth(window.innerWidth)}
                className={`px-2 py-0.5 rounded transition ${currentWidth >= window.innerWidth - 80 ? 'bg-white text-zinc-900 font-bold shadow-xs' : 'text-zinc-500 hover:text-zinc-900'}`}
                title="Full width"
              >
                Full
              </button>
            </div>

            {/* Minimize Button */}
            {onToggleMinimize && (
              <button
                onClick={onToggleMinimize}
                className="p-1.5 rounded-lg bg-zinc-100 hover:bg-zinc-200 text-zinc-600 hover:text-black border border-zinc-200 transition"
                title="Minimize to bottom toolbar"
              >
                <Minus className="w-3.5 h-3.5" />
              </button>
            )}

            {/* Close Button */}
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg bg-zinc-100 hover:bg-zinc-200 text-zinc-600 hover:text-black border border-zinc-200 transition"
              title="Close (Esc)"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Visual Pipeline Stepper Bar: Dedicated row with horizontal scroll and control indicators */}
        <div className="shrink-0 px-4 sm:px-5 py-2.5 bg-zinc-50 border-t border-zinc-200/80">
          <div className="flex items-center justify-between mb-1.5">
            <div className="flex items-center space-x-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-600">
                Pipeline Execution Steps
              </span>
              <span className="text-[10px] text-zinc-400 font-mono hidden sm:inline">
                (Scroll horizontally to inspect steps 01 → 08)
              </span>
            </div>
            <div className="flex items-center space-x-1">
              <button
                type="button"
                onClick={() => scrollStepper('left')}
                className="p-1 rounded bg-white hover:bg-zinc-200 text-zinc-600 hover:text-black border border-zinc-200 shadow-2xs transition"
                title="Scroll steps left"
                aria-label="Scroll steps left"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => scrollStepper('right')}
                className="p-1 rounded bg-white hover:bg-zinc-200 text-zinc-600 hover:text-black border border-zinc-200 shadow-2xs transition"
                title="Scroll steps right"
                aria-label="Scroll steps right"
              >
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          <div
            ref={stepperScrollRef}
            className="overflow-x-auto pb-2 scroll-smooth [scrollbar-width:thin] [scrollbar-color:#d4d4d8_transparent] [&::-webkit-scrollbar]:h-2 [&::-webkit-scrollbar-track]:bg-zinc-200/50 [&::-webkit-scrollbar-track]:rounded-full [&::-webkit-scrollbar-thumb]:bg-zinc-400 hover:[&::-webkit-scrollbar-thumb]:bg-zinc-600 [&::-webkit-scrollbar-thumb]:rounded-full"
          >
            <div className="flex items-center space-x-2 text-[10px] min-w-max pr-4">
              {steps.map((step, idx) => {
                const Icon = step.icon;
                return (
                  <React.Fragment key={idx}>
                    <div className="flex items-center space-x-2 px-3 py-1.5 rounded-xl bg-white border border-zinc-200 text-zinc-700 shadow-xs shrink-0 hover:border-zinc-300 transition-all">
                      <span className="font-mono text-zinc-400 font-bold">{step.num}</span>
                      <Icon className="w-3.5 h-3.5 text-zinc-900 shrink-0" />
                      <div className="flex flex-col text-left">
                        <span className="font-bold tracking-tight text-zinc-900 leading-none">{step.title}</span>
                        <span className="text-[9px] font-mono text-zinc-500 mt-0.5">{step.status}</span>
                      </div>
                    </div>
                    {idx < steps.length - 1 && (
                      <span className="text-zinc-300 font-bold text-xs shrink-0">→</span>
                    )}
                  </React.Fragment>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Content Body: Smooth independent scrolling */}
      <div className="flex-1 overflow-y-auto min-h-0 p-4 sm:p-6 space-y-5 pb-28">
          {/* Section 1: Executive Banner & Risk Score Gauge */}
          <div className="glass-card rounded-2xl p-5 border border-zinc-200/80 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center space-x-4">
                <RiskScoreGauge score={ml.risk_score} size="lg" />
                <div className="space-y-1">
                  <div className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500">
                    Calculated ML Risk Score
                  </div>
                  <div className="flex items-center gap-2">
                    <RiskBadge riskClass={ml.risk_class} score={ml.risk_score} size="md" />
                    <span className="text-xs font-mono text-zinc-500">
                      ({(ml.risk_probability * 100).toFixed(1)}% fraud probability)
                    </span>
                  </div>
                  <p className="text-[11px] text-zinc-500 font-mono">
                    Model: <span className="text-zinc-800">{ml.model_version}</span>
                  </p>
                </div>
              </div>

              {/* Bounded Decision Summary */}
              <div className="sm:text-right">
                <div className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500 mb-1">
                  Autonomous Decision
                </div>
                <DecisionBadge decision={currentDecision} size="md" />
                <div className="text-[11px] text-zinc-500 font-mono mt-1">
                  Confidence: {(dec.confidence * 100).toFixed(0)}%
                </div>
              </div>
            </div>

            {/* AI Investigation Synthesis */}
            <div className="pt-3 border-t border-zinc-200/80 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2 text-xs font-semibold text-zinc-900">
                  <Sparkles className="w-3.5 h-3.5 text-zinc-900" />
                  <span>AI Risk Investigator Synthesis</span>
                </div>
                <span className="text-[10px] px-2 py-0.5 rounded bg-zinc-100 text-zinc-800 border border-zinc-200 font-mono">
                  Confidence: {(inv.confidence * 100).toFixed(0)}%
                </span>
              </div>
              <p className="text-xs text-zinc-700 leading-relaxed bg-zinc-50 p-3 rounded-xl border border-zinc-200">
                {inv.summary}
              </p>
              <div className="flex items-start sm:items-center gap-2 text-xs text-zinc-700 pt-0.5">
                <ArrowRight className="w-3.5 h-3.5 text-zinc-900 shrink-0 mt-0.5 sm:mt-0" />
                <span><strong className="text-zinc-900">Recommended Action:</strong> {inv.recommended_next_step}</span>
              </div>
            </div>

            {/* Analyst Action Controls: Approve, Verify, Flag, Escalate */}
            <div className="pt-3 border-t border-zinc-200/80 space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-800 flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-zinc-900" />
                  <span>Analyst Action & Override Options</span>
                </span>
                <span className="text-[10px] text-zinc-500 font-mono">
                  Active: <strong className="text-zinc-900">{currentDecision}</strong>
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {/* APPROVE BUTTON */}
                <button
                  type="button"
                  onClick={() => handleTriggerAction('approve')}
                  disabled={isExecutingAction !== null}
                  className={`px-3 py-2.5 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 transition-all shadow-xs active:scale-95 disabled:opacity-50 ${
                    currentDecision === 'APPROVE'
                      ? 'bg-emerald-600 text-white border-emerald-700 ring-2 ring-emerald-500/25 shadow-sm'
                      : 'bg-white hover:bg-emerald-50 text-emerald-800 border-emerald-200'
                  }`}
                  title="Approve transaction & authorize order on Razorpay"
                >
                  {isExecutingAction === 'approve' ? (
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <CheckCircle2 className="w-3.5 h-3.5" />
                  )}
                  <span>Approve</span>
                </button>

                {/* VERIFY BUTTON */}
                <button
                  type="button"
                  onClick={() => handleTriggerAction('verify')}
                  disabled={isExecutingAction !== null}
                  className={`px-3 py-2.5 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 transition-all shadow-xs active:scale-95 disabled:opacity-50 ${
                    currentDecision === 'VERIFY'
                      ? 'bg-blue-600 text-white border-blue-700 ring-2 ring-blue-500/25 shadow-sm'
                      : 'bg-white hover:bg-blue-50 text-blue-800 border-blue-200'
                  }`}
                  title="Issue Step-Up 3DS OTP Authentication Challenge"
                >
                  {isExecutingAction === 'verify' ? (
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <ShieldCheck className="w-3.5 h-3.5" />
                  )}
                  <span>Verify</span>
                </button>

                {/* FLAG BUTTON */}
                <button
                  type="button"
                  onClick={() => handleTriggerAction('flag')}
                  disabled={isExecutingAction !== null}
                  className={`px-3 py-2.5 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 transition-all shadow-xs active:scale-95 disabled:opacity-50 ${
                    currentDecision === 'FLAG'
                      ? 'bg-amber-500 text-white border-amber-600 ring-2 ring-amber-500/25 shadow-sm'
                      : 'bg-white hover:bg-amber-50 text-amber-800 border-amber-200'
                  }`}
                  title="Flag transaction for 24h compliance analyst queue"
                >
                  {isExecutingAction === 'flag' ? (
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <AlertTriangle className="w-3.5 h-3.5" />
                  )}
                  <span>Flag</span>
                </button>

                {/* ESCALATE BUTTON */}
                <button
                  type="button"
                  onClick={() => handleTriggerAction('escalate')}
                  disabled={isExecutingAction !== null}
                  className={`px-3 py-2.5 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 transition-all shadow-xs active:scale-95 disabled:opacity-50 ${
                    currentDecision === 'ESCALATE'
                      ? 'bg-red-600 text-white border-red-700 ring-2 ring-red-500/25 shadow-sm'
                      : 'bg-white hover:bg-red-50 text-red-800 border-red-200'
                  }`}
                  title="Quarantine payment & block card/device on Razorpay"
                >
                  {isExecutingAction === 'escalate' ? (
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <ShieldAlert className="w-3.5 h-3.5" />
                  )}
                  <span>Escalate</span>
                </button>
              </div>

              {actionFeedback && (
                <div className={`p-2.5 rounded-xl text-xs font-mono flex items-center justify-between border transition-all ${
                  actionFeedback.includes('failed') || actionFeedback.includes('error')
                    ? 'bg-red-50 border-red-200 text-red-700'
                    : 'bg-emerald-50 border-emerald-200 text-emerald-800'
                }`}>
                  <span>{actionFeedback}</span>
                  <button type="button" onClick={() => setActionFeedback(null)} className="text-zinc-400 hover:text-zinc-700 ml-2 font-bold">×</button>
                </div>
              )}
            </div>
          </div>

          {/* Section 2: Payment Telemetry Snapshot (Clean Key-Value Grid) */}
          <div className="glass-card rounded-2xl p-5 border border-zinc-200/80 space-y-3">
            <div className="flex items-center justify-between border-b border-zinc-200/80 pb-2.5">
              <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-900 flex items-center gap-2">
                <Layers className="w-3.5 h-3.5 text-zinc-900" />
                <span>Payment Telemetry Snapshot</span>
              </h4>
              <span className="text-[11px] font-mono text-zinc-500">Method: {tx.payment_method.toUpperCase()}</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs">
              <div className="p-2.5 rounded-xl bg-zinc-50 border border-zinc-200">
                <span className="text-zinc-500 text-[10px] font-mono uppercase block">Amount</span>
                <span className="text-sm font-bold text-zinc-900 font-mono tabular-nums">₹{Math.round(tx.amount).toLocaleString('en-IN')}</span>
              </div>

              <div className="p-2.5 rounded-xl bg-zinc-50 border border-zinc-200">
                <span className="text-zinc-500 text-[10px] font-mono uppercase block">Customer Baseline</span>
                <span className="text-sm font-medium text-zinc-800 font-mono tabular-nums">₹{Math.round(tx.average_customer_amount).toLocaleString('en-IN')}</span>
              </div>

              <div className="p-2.5 rounded-xl bg-zinc-50 border border-zinc-200">
                <span className="text-zinc-500 text-[10px] font-mono uppercase block">Amount Deviation</span>
                <span className="text-sm font-bold font-mono text-zinc-900">
                  {tx.amount_deviation.toFixed(2)}x
                </span>
              </div>

              <div className="p-2.5 rounded-xl bg-zinc-50 border border-zinc-200">
                <span className="text-zinc-500 text-[10px] font-mono uppercase block">10m Velocity</span>
                <span className="text-sm font-bold font-mono text-zinc-900">
                  {tx.transactions_last_10_minutes} txns
                </span>
              </div>

              <div className="p-2.5 rounded-xl bg-zinc-50 border border-zinc-200">
                <span className="text-zinc-500 text-[10px] font-mono uppercase block">Customer Country</span>
                <span className="text-xs font-medium text-zinc-800">{tx.customer_country} (Cust: {tx.customer_id})</span>
              </div>

              <div className="p-2.5 rounded-xl bg-zinc-50 border border-zinc-200">
                <span className="text-zinc-500 text-[10px] font-mono uppercase block">Origin IP Country</span>
                <span className={`text-xs font-semibold flex items-center gap-1.5 ${tx.ip_country !== tx.customer_country ? 'text-zinc-900 font-bold' : 'text-zinc-700'}`}>
                  <Globe className="w-3 h-3" />
                  <span>{tx.ip_country}</span>
                  {tx.ip_country !== tx.customer_country && <span className="text-[10px] font-normal text-zinc-500">(Mismatch)</span>}
                </span>
              </div>

              <div className="p-2.5 rounded-xl bg-zinc-50 border border-zinc-200">
                <span className="text-zinc-500 text-[10px] font-mono uppercase block">Device Status</span>
                <span className={`text-xs font-semibold flex items-center gap-1.5 ${tx.new_device ? 'text-zinc-900 font-bold' : 'text-zinc-700'}`}>
                  <Smartphone className="w-3 h-3" />
                  <span>{tx.new_device ? 'New Device' : `Known (${tx.device_age}d)`}</span>
                </span>
              </div>

              <div className="p-2.5 rounded-xl bg-zinc-50 border border-zinc-200">
                <span className="text-zinc-500 text-[10px] font-mono uppercase block">Prior Failed Attempts</span>
                <span className="text-xs font-bold font-mono text-zinc-900">
                  {tx.previous_failed_transactions} failures
                </span>
              </div>
            </div>
          </div>

          {/* Section 3: Grounded ML Feature Attributions */}
          <div className="glass-card rounded-2xl p-5 border border-zinc-200/80 space-y-3">
            <div className="flex items-center justify-between border-b border-zinc-200/80 pb-2.5">
              <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-900 flex items-center gap-2">
                <Cpu className="w-3.5 h-3.5 text-zinc-900" />
                <span>Grounded ML Feature Attributions</span>
              </h4>
              <span className="text-[10px] font-mono text-zinc-500">Signal Attribution Matrix</span>
            </div>

            <div className="space-y-1.5">
              {ml.risk_factors.map((factor, idx) => (
                <div
                  key={idx}
                  className="p-2.5 rounded-xl bg-zinc-50 border border-zinc-200 text-xs text-zinc-800 flex items-center justify-between gap-3"
                >
                  <div className="flex items-center space-x-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-black shrink-0" />
                    <span className="leading-snug">{factor}</span>
                  </div>
                  <span className="text-[9px] font-mono font-bold px-2 py-0.5 rounded bg-zinc-200 text-zinc-900 border border-zinc-300 shrink-0">
                    CONTRIBUTING SIGNAL
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Section 4: Deterministic Safety Rules Triggered */}
          <div className="glass-card rounded-2xl p-5 border border-zinc-200/80 space-y-3">
            <div className="flex items-center justify-between border-b border-zinc-200/80 pb-2.5">
              <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-900 flex items-center gap-2">
                <AlertTriangle className="w-3.5 h-3.5 text-zinc-900" />
                <span>Deterministic Rule Engine ({triggeredRules.length} Fired)</span>
              </h4>
              <span className="text-[10px] px-2 py-0.5 rounded bg-zinc-100 text-zinc-800 border border-zinc-200 font-mono">
                Hard Boundary Safety Gate
              </span>
            </div>

            <div className="space-y-1.5">
              {rules.map((rule, idx) => (
                <div
                  key={idx}
                  className={`p-2.5 rounded-xl border text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2 transition-colors ${
                    rule.triggered
                      ? 'bg-black text-white border-black font-semibold'
                      : 'bg-zinc-50 border-zinc-200 text-zinc-600'
                  }`}
                >
                  <div className="space-y-0.5">
                    <div className="font-semibold flex items-center gap-2">
                      <span className={`font-mono ${rule.triggered ? 'text-white' : 'text-zinc-900'}`}>{rule.rule}</span>
                      {rule.triggered && (
                        <span className="text-[9px] uppercase font-bold px-1.5 py-0.2 rounded bg-white text-black">
                          {rule.severity} (+{rule.risk_points} pts)
                        </span>
                      )}
                    </div>
                    <p className={`text-[11px] ${rule.triggered ? 'text-zinc-200' : 'text-zinc-500'}`}>{rule.reason}</p>
                  </div>
                  <div className="shrink-0">
                    {rule.triggered ? (
                      <span className="text-[10px] font-extrabold text-black px-2 py-0.5 rounded bg-white">
                        TRIGGERED
                      </span>
                    ) : (
                      <span className="text-[10px] font-medium text-zinc-500 font-mono">PASSED</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Section 5: RAG Retrieved Compliance Policies */}
          <div className="glass-card rounded-2xl p-5 border border-zinc-200/80 space-y-3">
            <div className="flex items-center justify-between border-b border-zinc-200/80 pb-2.5">
              <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-900 flex items-center gap-2">
                <FileText className="w-3.5 h-3.5 text-zinc-900" />
                <span>RAG Compliance Citations ({policies.length} Clauses Matched)</span>
              </h4>
              <span className="text-[10px] font-mono text-zinc-500">TF-IDF Vector Index</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {policies.map((pol, idx) => (
                <div
                  key={idx}
                  onClick={() => setSelectedPolicy(pol)}
                  className="p-3 rounded-xl bg-zinc-50 border border-zinc-200 hover:border-zinc-300 hover:bg-white cursor-pointer transition space-y-1.5 text-xs group shadow-2xs"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono font-bold text-zinc-900 text-[10px] px-1.5 py-0.5 rounded bg-white border border-zinc-200">{pol.policy_id}</span>
                    <span className="text-[10px] font-mono text-zinc-500">
                      Relevance: {(pol.relevance_score * 100).toFixed(0)}%
                    </span>
                  </div>
                  <h5 className="font-semibold text-zinc-900 group-hover:text-black transition-colors">{pol.title}</h5>
                  <p className="text-zinc-600 text-[11px] line-clamp-2 leading-relaxed">{pol.text}</p>
                  <span className="text-[10px] text-zinc-900 group-hover:underline inline-block pt-0.5 font-medium">
                    View clause details →
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Section 6: Idempotent Safe Action & Cryptographic Audit Ledger */}
          <div className="glass-card rounded-2xl p-5 border border-zinc-200/80 space-y-3">
            <div className="flex items-center justify-between border-b border-zinc-200/80 pb-2.5">
              <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-900 flex items-center gap-2">
                <Lock className="w-3.5 h-3.5 text-zinc-900" />
                <span>Idempotent Safe Action & Audit Ledger</span>
              </h4>
              <span className="text-[10px] px-2 py-0.5 rounded bg-black text-white border border-black font-bold font-mono shadow-xs">
                PROVIDER: {act.provider}
              </span>
            </div>

            <div className="p-3.5 rounded-xl bg-zinc-50 border border-zinc-200 text-xs space-y-2">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                <span className="text-zinc-500">Action Dispatched:</span>
                <span className="font-bold text-zinc-900 uppercase font-mono">{currentAction?.action || act.action}</span>
              </div>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                <span className="text-zinc-500">Provider Status:</span>
                <span className="font-mono text-zinc-900 font-medium">{currentAction?.status || act.status}</span>
              </div>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                <span className="text-zinc-500">Cryptographic Audit Trace ID:</span>
                <button
                  onClick={() => copyToClipboard(audit_id, 'audit')}
                  className="inline-flex items-center gap-1.5 font-mono text-xs text-zinc-900 font-bold hover:underline transition"
                  title="Click to copy Audit ID"
                >
                  <span>{audit_id}</span>
                  {copiedAudit ? <Check className="w-3 h-3 text-black" /> : <Copy className="w-3 h-3 text-zinc-400" />}
                </button>
              </div>
              <p className="text-[11px] text-zinc-600 pt-2 border-t border-zinc-200 leading-relaxed">
                {currentAction?.message || act.message}
              </p>
            </div>
          </div>
        </div>

        {/* Policy Modal Detail */}
      {selectedPolicy && (
        <div
          className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/40 backdrop-blur-md"
          onClick={() => setSelectedPolicy(null)}
        >
          <div
            className="glass-card max-w-xl w-full border border-zinc-200 rounded-2xl p-6 shadow-2xl space-y-3.5 bg-white/98 text-zinc-900"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <span className="font-mono text-xs font-bold px-2.5 py-1 rounded bg-zinc-100 text-zinc-900 border border-zinc-200">
                {selectedPolicy.policy_id}
              </span>
              <button
                onClick={() => setSelectedPolicy(null)}
                className="p-1 text-zinc-400 hover:text-zinc-900"
                aria-label="Close modal"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <h3 className="text-base font-bold text-zinc-900 tracking-tight">{selectedPolicy.title}</h3>
            <div className="p-3.5 rounded-xl bg-zinc-50 border border-zinc-200 text-xs text-zinc-800 leading-relaxed whitespace-pre-line font-mono">
              {selectedPolicy.text}
            </div>
            <div className="flex justify-between items-center text-xs text-zinc-500 pt-1 border-t border-zinc-200">
              <span>Category: <strong className="text-zinc-800">{selectedPolicy.category.replace(/_/g, ' ')}</strong></span>
              <span className="font-mono text-zinc-900 font-bold">Relevance: {(selectedPolicy.relevance_score * 100).toFixed(0)}%</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  // Render as slide-over with dimming backdrop and click-outside light dismiss
  return (
    <div
      className="fixed inset-0 z-50 flex justify-end bg-black/35 backdrop-blur-xs transition-opacity duration-200"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="h-full border-l border-zinc-200/90 shadow-2xl flex flex-col relative transition-all duration-150"
        style={{ width: `${Math.min(currentWidth, window.innerWidth)}px`, maxWidth: '100vw' }}
      >
        {drawerInnerContent}
      </div>
    </div>
  );
};

