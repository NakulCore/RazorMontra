import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { Sidebar, NavTab } from './components/Sidebar';
import { DashboardPage } from './pages/DashboardPage';
import { TransactionsPage } from './pages/TransactionsPage';
import { DemoScenariosPage } from './pages/DemoScenariosPage';
import { PoliciesPage } from './pages/PoliciesPage';
import { MetricsPage } from './pages/MetricsPage';
import { AuditPage } from './pages/AuditPage';
import { InvestigationDrawer } from './components/InvestigationDrawer';
import {
  SystemOverviewMetrics,
  Transaction,
  PolicyClause,
  AuditRecord,
  DemoScenario,
  ComprehensiveRiskAnalysis
} from './types';
import {
  fetchSystemMetrics,
  fetchTransactions,
  fetchPolicies,
  fetchAuditTrail,
  fetchDemoScenarios,
  analyzeTransaction
} from './services/api';

export const App: React.FC = () => {
  const [currentTab, setCurrentTab] = useState<NavTab>('dashboard');
  const [metrics, setMetrics] = useState<SystemOverviewMetrics | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [policies, setPolicies] = useState<PolicyClause[]>([]);
  const [auditTrail, setAuditTrail] = useState<AuditRecord[]>([]);
  const [demoScenarios, setDemoScenarios] = useState<Record<string, DemoScenario>>({});
  const [activeAnalysis, setActiveAnalysis] = useState<ComprehensiveRiskAnalysis | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);

  const loadAllData = async () => {
    setIsRefreshing(true);
    try {
      const [m, txs, pols, audits, scenarios] = await Promise.all([
        fetchSystemMetrics().catch(() => null),
        fetchTransactions(60).catch(() => []),
        fetchPolicies().catch(() => []),
        fetchAuditTrail(60).catch(() => []),
        fetchDemoScenarios().catch(() => ({}))
      ]);

      if (m) setMetrics(m);
      if (txs.length > 0) setTransactions(txs);
      if (pols.length > 0) setPolicies(pols);
      if (audits.length > 0) setAuditTrail(audits);
      if (Object.keys(scenarios).length > 0) setDemoScenarios(scenarios);
    } catch (err) {
      console.error('Error loading data:', err);
    } finally {
      setIsRefreshing(false);
      setInitialLoading(false);
    }
  };

  useEffect(() => {
    loadAllData();
  }, []);

  const handleSelectTransaction = async (tx: Transaction) => {
    try {
      const analysis = await analyzeTransaction(tx, false);
      setActiveAnalysis(analysis);
    } catch (err) {
      console.error('Failed to analyze transaction:', err);
    }
  };

  const handleAnalyzeComplete = (analysis: ComprehensiveRiskAnalysis) => {
    setActiveAnalysis(analysis);
    loadAllData();
  };

  return (
    <div className="min-h-screen bg-[#0b1322] text-slate-100 flex flex-col selection:bg-blue-600 selection:text-white">
      {/* Top Navigation */}
      <Header onRefresh={loadAllData} isRefreshing={isRefreshing} />

      {/* Main Workspace Layout */}
      <div className="flex-1 flex overflow-hidden">
        <Sidebar
          currentTab={currentTab}
          onTabChange={setCurrentTab}
          highRiskCount={metrics?.high_risk_count || 0}
        />

        <main className="flex-1 overflow-y-auto p-6 lg:p-8 bg-[#0b1322]">
          <div className="max-w-7xl mx-auto">
            {currentTab === 'dashboard' && (
              <DashboardPage
                metrics={metrics}
                recentTransactions={transactions}
                onSelectTransaction={handleSelectTransaction}
                onNavigateTab={setCurrentTab}
              />
            )}

            {currentTab === 'transactions' && (
              <TransactionsPage
                transactions={transactions}
                onSelectTransaction={handleSelectTransaction}
              />
            )}

            {currentTab === 'demo' && (
              <DemoScenariosPage
                scenarios={demoScenarios}
                onAnalyzeComplete={handleAnalyzeComplete}
              />
            )}

            {currentTab === 'policies' && <PoliciesPage initialPolicies={policies} />}

            {currentTab === 'metrics' && <MetricsPage metrics={metrics?.model_metrics} />}

            {currentTab === 'audit' && <AuditPage auditRecords={auditTrail} />}
          </div>
        </main>
      </div>

      {/* Deep-Dive Investigation Drawer */}
      <InvestigationDrawer
        analysis={activeAnalysis}
        onClose={() => setActiveAnalysis(null)}
      />
    </div>
  );
};

export default App;
