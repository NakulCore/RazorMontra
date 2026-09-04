import React, { useState } from 'react';
import { DemoScenario, ComprehensiveRiskAnalysis } from '../types';
import { analyzeTransaction, seedDemoData } from '../services/api';
import {
  Play,
  Sparkles,
  ShieldAlert,
  CheckCircle2,
  ArrowRight,
  Database,
  RefreshCw,
  Cpu,
  Layers,
  FileText,
  Lock,
  FileCheck,
  AlertTriangle,
  Flame,
  SkipForward
} from 'lucide-react';
import { RiskBadge } from '../components/RiskBadge';

interface DemoScenariosPageProps {
  scenarios: Record<string, DemoScenario>;
  onAnalyzeComplete: (result: ComprehensiveRiskAnalysis) => void;
}

export const DemoScenariosPage: React.FC<DemoScenariosPageProps> = ({
  scenarios,
  onAnalyzeComplete,
}) => {
  const [activeRunningKey, setActiveRunningKey] = useState<string | null>(null);
  const [animationStep, setAnimationStep] = useState<number>(0);
  const [seeding, setSeeding] = useState(false);
  const [seedMessage, setSeedMessage] = useState<string | null>(null);

  const pipelineStages = [
    { name: 'TRANSACTION INGEST', desc: 'Validating payload & schema', icon: Layers },
    { name: 'FEATURE EXTRACTION', desc: 'Deviations, baseline & velocity', icon: Cpu },
    { name: 'ML RISK MODEL', desc: 'RandomForest ensemble inference', icon: Sparkles },
    { name: 'SAFETY RULES', desc: 'Evaluating 7 deterministic gates', icon: AlertTriangle },
    { name: 'RAG RETRIEVAL', desc: 'Matching Razorpay compliance policies', icon: FileText },
    { name: 'AI INVESTIGATION', desc: 'Synthesizing evidence & telemetry', icon: Sparkles },
    { name: 'BOUNDED DECISION', desc: 'Enforcing safety overrides', icon: CheckCircle2 },
    { name: 'SANDBOX ACTION', desc: 'Idempotent dispatch to Mock Sandbox', icon: Lock },
    { name: 'AUDIT LOGGED', desc: 'Generating immutable ledger trace', icon: FileCheck },
  ];

  const handleRunScenario = async (key: string, scenario: DemoScenario) => {
    setActiveRunningKey(key);
    setAnimationStep(0);

    // Start API request in parallel
    const apiPromise = analyzeTransaction(scenario.payload, true);

    // Fast, crisp animation steps
    let currentStep = 0;
    const interval = setInterval(() => {
      currentStep++;
      if (currentStep < pipelineStages.length) {
        setAnimationStep(currentStep);
      } else {
        clearInterval(interval);
      }
    }, 180);

    try {
      const result = await apiPromise;
      // Ensure at least a brief glance at the pipeline before opening drawer
      setTimeout(() => {
        clearInterval(interval);
        setActiveRunningKey(null);
        setAnimationStep(0);
        onAnalyzeComplete(result);
      }, 900);
    } catch (err: any) {
      clearInterval(interval);
      setActiveRunningKey(null);
      alert(`Simulation failed: ${err.message}`);
    }
  };

  const handleSeedData = async (count: number) => {
    setSeeding(true);
    setSeedMessage(null);
    try {
      const res = await seedDemoData(count);
      setSeedMessage(`✅ Successfully seeded & analyzed ${res.count} realistic transactions!`);
    } catch (err: any) {
      setSeedMessage(`❌ Seeding failed: ${err.message}`);
    } finally {
      setSeeding(false);
    }
  };

  // Scenario configuration metadata
  const scenarioMeta: Record<string, { riskClass: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'; tag: string }> = {
    NORMAL_PAYMENT: { riskClass: 'LOW', tag: 'BENIGN BASELINE' },
    HIGH_VALUE_ANOMALY: { riskClass: 'HIGH', tag: 'AMOUNT ANOMALY' },
    VELOCITY_ATTACK: { riskClass: 'CRITICAL', tag: 'BOT BURST' },
    NEW_DEVICE_TAKEOVER: { riskClass: 'HIGH', tag: 'ACCOUNT TAKEOVER' },
    LOCATION_ANOMALY: { riskClass: 'HIGH', tag: 'OFFSHORE PROXY' },
    MULTI_SIGNAL_FRAUD: { riskClass: 'CRITICAL', tag: 'COORDINATED FRAUD' },
    FALSE_POSITIVE: { riskClass: 'LOW', tag: 'BENIGN VACATION (EDGE CASE)' },
  };

  return (
    <div className="space-y-6">
      {/* Hero Header */}
      <div className="glass-card rounded-2xl p-6 border border-zinc-200/80 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <Sparkles className="w-4 h-4 text-zinc-900" />
            <h1 className="text-lg sm:text-xl font-bold text-zinc-900 tracking-tight">
              Interactive Demo & Evaluator Simulator
            </h1>
          </div>
          <p className="text-xs text-zinc-600 mt-1 max-w-2xl">
            Test reproducible payment risk scenarios covering all 7 archetypes. Each scenario triggers the live ML ensemble, deterministic rule gates, RAG policy retrieval, and bounded copilot action.
          </p>
        </div>

        {/* Batch Data Seeder */}
        <div className="flex items-center space-x-2 shrink-0">
          <button
            onClick={() => handleSeedData(50)}
            disabled={seeding}
            className="h-8 px-3 rounded-xl bg-white hover:bg-zinc-50 border border-zinc-200 text-zinc-700 hover:text-black font-medium text-xs transition flex items-center space-x-1.5 disabled:opacity-50 active:scale-98 shadow-xs"
          >
            <Database className={`w-3.5 h-3.5 text-zinc-700 ${seeding ? 'animate-spin' : ''}`} />
            <span>{seeding ? 'Seeding Database...' : 'Seed 50 Live Txns'}</span>
          </button>
        </div>
      </div>

      {seedMessage && (
        <div className="p-3 rounded-xl bg-zinc-100 border border-zinc-200 text-xs text-zinc-800 font-medium flex items-center justify-between">
          <span>{seedMessage}</span>
          <button onClick={() => setSeedMessage(null)} className="text-zinc-500 hover:text-black">✕</button>
        </div>
      )}

      {/* Live Pipeline Execution Animation Modal */}
      {activeRunningKey && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-md flex items-center justify-center p-4">
          <div className="glass-card max-w-lg w-full rounded-2xl p-6 border border-zinc-200 shadow-2xl space-y-4 bg-white/95 text-zinc-900">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <RefreshCw className="w-4 h-4 text-zinc-900 animate-spin" />
                <h3 className="text-xs font-bold text-zinc-900 uppercase tracking-wider">
                  Executing Autonomous Risk Pipeline
                </h3>
              </div>
              <span className="text-[11px] font-mono text-zinc-500">
                Step {animationStep + 1} of {pipelineStages.length}
              </span>
            </div>

            {/* Stepper Display */}
            <div className="space-y-1.5">
              {pipelineStages.map((stage, idx) => {
                const Icon = stage.icon;
                const isCurrent = animationStep === idx;
                const isPassed = animationStep > idx;

                return (
                  <div
                    key={idx}
                    className={`p-2.5 rounded-xl border text-xs flex items-center justify-between transition-all ${
                      isCurrent
                        ? 'bg-zinc-100 border-zinc-300 text-zinc-900 font-semibold shadow-2xs'
                        : isPassed
                        ? 'bg-zinc-50 border-zinc-200 text-zinc-700'
                        : 'bg-transparent border-zinc-100 text-zinc-400'
                    }`}
                  >
                    <div className="flex items-center space-x-2.5">
                      <span className="font-mono text-[10px] text-zinc-500">0{idx + 1}</span>
                      <Icon className={`w-3.5 h-3.5 ${isCurrent ? 'text-zinc-900 animate-pulse' : isPassed ? 'text-zinc-900' : 'text-zinc-400'}`} />
                      <div>
                        <span className="font-semibold text-zinc-900">{stage.name}</span>
                        <span className="text-[10px] text-zinc-500 ml-2 hidden sm:inline">{stage.desc}</span>
                      </div>
                    </div>
                    <div>
                      {isPassed ? (
                        <CheckCircle2 className="w-3.5 h-3.5 text-zinc-900" />
                      ) : isCurrent ? (
                        <span className="text-[9px] font-bold uppercase tracking-wider text-zinc-900 animate-pulse">RUNNING</span>
                      ) : (
                        <span className="text-[9px] text-zinc-400 font-mono">PENDING</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Scenario Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {Object.entries(scenarios).map(([key, scenario]) => {
          const meta = scenarioMeta[key] || { riskClass: 'HIGH', tag: 'FRAUD ARCHETYPE' };
          const isProcessing = activeRunningKey === key;

          return (
            <div
              key={key}
              className="glass-card-interactive rounded-xl p-5 flex flex-col justify-between min-h-[310px] border border-zinc-200/80 shadow-xs hover:shadow-md transition-shadow"
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <RiskBadge riskClass={meta.riskClass} size="sm" />
                  <span className="text-xs font-mono font-bold text-zinc-900 tabular-nums">
                    ₹{Math.round(scenario.payload.amount || 0).toLocaleString('en-IN')}
                  </span>
                </div>

                <h3 className="font-bold text-zinc-900 text-sm tracking-tight">{scenario.name}</h3>
                <p className="text-xs text-zinc-600 mt-1 leading-relaxed min-h-[36px]">{scenario.description}</p>

                {/* Payload Highlights Box - Protected against overflow */}
                <div className="p-2.5 rounded-lg bg-zinc-50 border border-zinc-200 text-[11px] space-y-1 font-mono text-zinc-700 my-3">
                  <div className="flex justify-between items-center">
                    <span className="text-zinc-500">Method:</span>
                    <span className="text-zinc-900 font-semibold">{scenario.payload.payment_method?.toUpperCase()}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-zinc-500">10m Velocity:</span>
                    <span className={scenario.payload.transactions_last_10_minutes && scenario.payload.transactions_last_10_minutes >= 3 ? 'text-zinc-900 font-bold' : 'text-zinc-700'}>
                      {scenario.payload.transactions_last_10_minutes} txns
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-zinc-500">Origin IP:</span>
                    <span className={`truncate max-w-[140px] ${scenario.payload.ip_country !== scenario.payload.customer_country ? 'text-zinc-900 font-bold' : 'text-zinc-700'}`}>
                      {scenario.payload.ip_country} {scenario.payload.ip_country !== scenario.payload.customer_country && '(Mismatch)'}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-zinc-500">Device:</span>
                    <span className={`truncate max-w-[140px] ${scenario.payload.new_device ? 'text-zinc-900 font-bold' : 'text-zinc-700'}`}>
                      {scenario.payload.new_device ? 'New Device' : `Known (${scenario.payload.device_age}d)`}
                    </span>
                  </div>
                </div>
              </div>

              {/* Action Button - Always Aligned at Bottom */}
              <button
                onClick={() => handleRunScenario(key, scenario)}
                disabled={isProcessing}
                className="w-full h-9 rounded-xl bg-black hover:bg-zinc-800 text-white font-semibold text-xs transition flex items-center justify-center gap-1.5 shadow-xs active:scale-98 disabled:opacity-50 mt-auto"
              >
                {isProcessing ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin text-white" />
                    <span>Analyzing Pipeline...</span>
                  </>
                ) : (
                  <>
                    <Play className="w-3.5 h-3.5 fill-current" />
                    <span>Simulate & Investigate</span>
                  </>
                )}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
};
