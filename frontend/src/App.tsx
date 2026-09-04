import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { Sidebar } from './components/Sidebar';
import { DashboardPage } from './pages/DashboardPage';
import { TransactionsPage } from './pages/TransactionsPage';
import { AlertsPage } from './pages/AlertsPage';
import { DemoScenariosPage } from './pages/DemoScenariosPage';
import { PoliciesPage } from './pages/PoliciesPage';
import { MetricsPage } from './pages/MetricsPage';
import { AuditPage } from './pages/AuditPage';
import { InvestigationDrawer } from './components/InvestigationDrawer';
import { ToastContainer, ToastMessage } from './components/Toast';
import {
  SystemOverviewMetrics,
  Transaction,
  PolicyClause,
  AuditRecord,
  DemoScenario,
  ComprehensiveRiskAnalysis,
  NavTab
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
  const getInitialTab = (): NavTab => {
    try {
      const params = new URLSearchParams(window.location.search);
      const tabParam = params.get('tab') as NavTab;
      const validTabs: NavTab[] = ['dashboard', 'transactions', 'alerts', 'demo', 'policies', 'metrics', 'audit'];
      if (tabParam && validTabs.includes(tabParam)) return tabParam;
    } catch {
      // fallback
    }
    return 'dashboard';
  };

  const [currentTab, setCurrentTabState] = useState<NavTab>(getInitialTab);

  const setCurrentTab = (tab: NavTab) => {
    setCurrentTabState(tab);
    try {
      const url = new URL(window.location.href);
      url.searchParams.set('tab', tab);
      window.history.replaceState({}, '', url.toString());
    } catch {}
  };
  const [metrics, setMetrics] = useState<SystemOverviewMetrics | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [policies, setPolicies] = useState<PolicyClause[]>([]);
  const [auditTrail, setAuditTrail] = useState<AuditRecord[]>([]);
  const [demoScenarios, setDemoScenarios] = useState<Record<string, DemoScenario>>({});
  const [activeAnalysis, setActiveAnalysis] = useState<ComprehensiveRiskAnalysis | null>(null);
  const [isDrawerMinimized, setIsDrawerMinimized] = useState(false);
  const [drawerWidth, setDrawerWidth] = useState<number>(() => {
    if (typeof window !== 'undefined' && window.innerWidth >= 1200) {
      return Math.min(680, Math.round(window.innerWidth * 0.46));
    }
    return 680;
  });
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const addToast = (toast: Omit<ToastMessage, 'id'>) => {
    const id = `toast_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`;
    setToasts((prev) => [...prev, { ...toast, id }]);
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  const loadAllData = async (showToast = false) => {
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

      if (showToast) {
        addToast({
          type: 'success',
          title: 'System Telemetry Refreshed',
          message: 'Real-time metrics, risk queue, and policy index updated.',
        });
      }
    } catch (err) {
      console.error('Error loading data:', err);
      addToast({
        type: 'error',
        title: 'Refresh Error',
        message: 'Unable to retrieve latest telemetry from risk backend.',
      });
    } finally {
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    loadAllData(false);
  }, []);

  const handleSelectTransaction = async (tx: Transaction) => {
    try {
      const analysis = await analyzeTransaction(tx, false);
      setActiveAnalysis(analysis);
      setIsDrawerMinimized(false);
    } catch (err: any) {
      console.error('Failed to analyze transaction:', err);
      addToast({
        type: 'error',
        title: 'Investigation Error',
        message: err.message || 'Failed to generate real-time investigation.',
      });
    }
  };

  const handleAnalyzeComplete = (analysis: ComprehensiveRiskAnalysis) => {
    setActiveAnalysis(analysis);
    setIsDrawerMinimized(false);
    loadAllData(false);
    addToast({
      type: 'info',
      title: 'Simulation Dispatched',
      message: `Transaction ${analysis.transaction.transaction_id} investigated: Decision ${analysis.decision.decision}`,
    });
  };

  return (
    <div className="h-screen bg-[#f5f5f7] text-zinc-900 flex flex-col selection:bg-black selection:text-white font-sans antialiased overflow-hidden">
      {/* Clean Top Navigation Bar */}
      <Header
        onRefresh={() => loadAllData(true)}
        isRefreshing={isRefreshing}
        onToggleMobileMenu={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
      />

      {/* Main Workspace Layout */}
      <div className="flex-1 flex overflow-hidden">
        <Sidebar
          currentTab={currentTab}
          onTabChange={setCurrentTab}
          highRiskCount={metrics?.high_risk_count || 0}
          isOpenMobile={isMobileMenuOpen}
          onCloseMobile={() => setIsMobileMenuOpen(false)}
        />

        <main className="flex-1 overflow-y-auto min-w-0 p-4 sm:p-6 lg:p-8 bg-transparent transition-all duration-300">
          <div className="max-w-7xl mx-auto space-y-6">
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

            {currentTab === 'alerts' && (
              <AlertsPage
                transactions={transactions}
                auditRecords={auditTrail}
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

            {currentTab === 'audit' && (
              <AuditPage
                auditRecords={auditTrail}
                onSelectTransaction={handleSelectTransaction}
              />
            )}

            {/* Subtle Application Footer Disclaimer */}
            <footer className="pt-8 pb-3 text-center border-t border-zinc-200/60 mt-10">
              <p className="text-[11px] text-zinc-400 max-w-2xl mx-auto leading-relaxed px-4">
                &ldquo;RazorMontra&rdquo; and Razorpay branding are used for Buildathon purposes. This is an independent Razorpay Buildathon submission and not an official Razorpay product.
              </p>
            </footer>
          </div>
        </main>
      </div>

      {/* Risk Investigation Console (Slide-over Overlay or Minimized Floating Toolbar) */}
      {activeAnalysis && (
        <InvestigationDrawer
          analysis={activeAnalysis}
          onClose={() => setActiveAnalysis(null)}
          isMinimized={isDrawerMinimized}
          onToggleMinimize={() => setIsDrawerMinimized(!isDrawerMinimized)}
          drawerWidth={drawerWidth}
          onWidthChange={setDrawerWidth}
          onActionExecuted={(decision, actionResult) => {
            loadAllData(false);
            addToast({
              type: decision === 'APPROVE' ? 'success' : decision === 'ESCALATE' ? 'error' : 'info',
              title: `Action: ${decision}`,
              message: `Razorpay status: ${actionResult.status || 'Updated'} for ${activeAnalysis.transaction.transaction_id}`,
            });
          }}
        />
      )}

      {/* Toast Notification Stream (positioned away from console when active) */}
      <ToastContainer
        toasts={toasts}
        onDismiss={removeToast}
        position={activeAnalysis && !isDrawerMinimized ? 'bottom-left' : 'bottom-right'}
      />
    </div>
  );
};

export default App;
