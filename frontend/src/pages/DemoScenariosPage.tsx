import React, { useState } from 'react';
import { DemoScenario, ComprehensiveRiskAnalysis } from '../types';
import { analyzeTransaction, seedDemoData } from '../services/api';
import { Play, Sparkles, ShieldAlert, CheckCircle, ArrowRight, Database, RefreshCw } from 'lucide-react';

interface DemoScenariosPageProps {
  scenarios: Record<string, DemoScenario>;
  onAnalyzeComplete: (result: ComprehensiveRiskAnalysis) => void;
}

export const DemoScenariosPage: React.FC<DemoScenariosPageProps> = ({ scenarios, onAnalyzeComplete }) => {
  const [loadingScenario, setLoadingScenario] = useState<string | null>(null);
  const [seeding, setSeeding] = useState(false);
  const [seedMessage, setSeedMessage] = useState<string | null>(null);

  const handleRunScenario = async (key: string, scenario: DemoScenario) => {
    setLoadingScenario(key);
    try {
      const result = await analyzeTransaction(scenario.payload, true);
      onAnalyzeComplete(result);
    } catch (err: any) {
      alert(`Simulation failed: ${err.message}`);
    } finally {
      setLoadingScenario(null);
    }
  };

  const handleSeedData = async () => {
    setSeeding(true);
    setSeedMessage(null);
    try {
      const res = await seedDemoData(50);
      setSeedMessage(`✅ ${res.message}`);
    } catch (err: any) {
      setSeedMessage(`❌ Seeding failed: ${err.message}`);
    } finally {
      setSeeding(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header & Seeder */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-blue-950/60 to-slate-900 border border-blue-500/20 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <Sparkles className="w-5 h-5 text-blue-400" />
            <h2 className="text-xl font-extrabold text-white tracking-tight">Interactive Demo & Evaluator Simulator</h2>
          </div>
          <p className="text-xs text-slate-300 mt-1 max-w-2xl">
            Test reproducible fraud scenarios across all 7 archetypes. Each scenario executes the live ML model, evaluates deterministic rules, queries RAG policies, and generates an immutable audit record.
          </p>
        </div>

        <button
          onClick={handleSeedData}
          disabled={seeding}
          className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-600 text-white font-semibold text-xs transition flex items-center space-x-2 shrink-0 shadow-lg"
        >
          <Database className={`w-4 h-4 text-emerald-400 ${seeding ? 'animate-spin' : ''}`} />
          <span>{seeding ? 'Seeding...' : 'Seed 50 Transactions'}</span>
        </button>
      </div>

      {seedMessage && (
        <div className="p-3.5 rounded-xl bg-slate-900 border border-emerald-500/30 text-xs text-emerald-300 font-medium">
          {seedMessage}
        </div>
      )}

      {/* Scenario Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {Object.entries(scenarios).map(([key, scenario]) => {
          const isProcessing = loadingScenario === key;
          const isHighRisk = key !== 'NORMAL_PAYMENT' && key !== 'FALSE_POSITIVE';
          
          return (
            <div
              key={key}
              className="p-5 rounded-2xl bg-[#0f172a] border border-slate-800 hover:border-slate-700 transition flex flex-col justify-between space-y-4 shadow-sm group"
            >
              <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                    isHighRisk
                      ? 'bg-rose-500/10 text-rose-300 border-rose-500/20'
                      : 'bg-emerald-500/10 text-emerald-300 border-emerald-500/20'
                  }`}>
                    {isHighRisk ? 'FRAUD ARCHETYPE' : 'BENIGN ARCHETYPE'}
                  </span>
                  <span className="text-xs font-mono font-bold text-slate-200">₹{scenario.payload.amount?.toLocaleString()}</span>
                </div>

                <h3 className="font-bold text-white text-sm">{scenario.name}</h3>
                <p className="text-xs text-slate-400 leading-relaxed">{scenario.description}</p>
              </div>

              {/* Payload Highlights */}
              <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/80 text-[11px] space-y-1 font-mono text-slate-300">
                <div className="flex justify-between">
                  <span className="text-slate-500">Method:</span>
                  <span>{scenario.payload.payment_method?.toUpperCase()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">10m Velocity:</span>
                  <span className={scenario.payload.transactions_last_10_minutes && scenario.payload.transactions_last_10_minutes >= 3 ? 'text-rose-400 font-bold' : ''}>
                    {scenario.payload.transactions_last_10_minutes} txns
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Origin IP:</span>
                  <span className={scenario.payload.ip_country !== scenario.payload.customer_country ? 'text-purple-400 font-bold' : ''}>
                    {scenario.payload.ip_country} {scenario.payload.ip_country !== scenario.payload.customer_country && '(Mismatch)'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Device Status:</span>
                  <span className={scenario.payload.new_device ? 'text-amber-400 font-bold' : ''}>
                    {scenario.payload.new_device ? 'New Device' : 'Known Device'}
                  </span>
                </div>
              </div>

              {/* Run Button */}
              <button
                onClick={() => handleRunScenario(key, scenario)}
                disabled={isProcessing}
                className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs shadow-md shadow-blue-600/20 transition flex items-center justify-center space-x-2"
              >
                {isProcessing ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Executing Pipeline...</span>
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
