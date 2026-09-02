import React from 'react';
import {
  LayoutDashboard,
  ArrowLeftRight,
  AlertTriangle,
  PlayCircle,
  BookOpen,
  BarChart3,
  FileClock,
  Sparkles
} from 'lucide-react';

export type NavTab = 'dashboard' | 'transactions' | 'demo' | 'policies' | 'metrics' | 'audit';

interface SidebarProps {
  currentTab: NavTab;
  onTabChange: (tab: NavTab) => void;
  highRiskCount: number;
}

export const Sidebar: React.FC<SidebarProps> = ({ currentTab, onTabChange, highRiskCount }) => {
  const navItems = [
    { id: 'dashboard' as NavTab, label: 'Dashboard', icon: LayoutDashboard },
    { id: 'transactions' as NavTab, label: 'Live Transactions', icon: ArrowLeftRight },
    { id: 'demo' as NavTab, label: 'Demo Simulator', icon: PlayCircle, badge: 'Interactive' },
    { id: 'policies' as NavTab, label: 'RAG Policies', icon: BookOpen },
    { id: 'metrics' as NavTab, label: 'Model Evaluation', icon: BarChart3 },
    { id: 'audit' as NavTab, label: 'Audit Trail', icon: FileClock },
  ];

  return (
    <aside className="w-64 bg-[#0d1527] border-r border-slate-800/80 flex flex-col justify-between p-4 shrink-0">
      <div className="space-y-6">
        <div className="px-3 py-2">
          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Navigation</p>
          <nav className="mt-2 space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => onTabChange(item.id)}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                    isActive
                      ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30'
                      : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/60'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                    <span>{item.label}</span>
                  </div>
                  {item.badge && (
                    <span className="text-[10px] uppercase font-bold px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-300 border border-blue-400/30">
                      {item.badge}
                    </span>
                  )}
                  {item.id === 'transactions' && highRiskCount > 0 && (
                    <span className="text-xs px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/30">
                      {highRiskCount}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Buildathon Track Badge Card */}
        <div className="mx-2 p-3.5 rounded-xl bg-gradient-to-br from-slate-900 to-[#14233c] border border-blue-500/20 shadow-inner">
          <div className="flex items-center space-x-2 text-xs font-semibold text-blue-400">
            <Sparkles className="w-3.5 h-3.5 text-blue-400" />
            <span>Razorpay AI Buildathon</span>
          </div>
          <p className="text-xs text-slate-300 font-medium mt-1">Track: AI Risk Manager</p>
          <p className="text-[11px] text-slate-400 mt-0.5">Autonomous Feature Extraction → ML Risk → Rule Engine → RAG → Bounded Decisions.</p>
        </div>
      </div>

      <div className="p-3 bg-slate-900/60 rounded-lg border border-slate-800 text-[11px] text-slate-400">
        <div className="flex justify-between items-center text-slate-300 font-medium">
          <span>Environment</span>
          <span className="text-emerald-400">Online (FastAPI)</span>
        </div>
        <div className="flex justify-between items-center mt-1">
          <span>Provider</span>
          <span className="text-slate-200">Mock Sandbox</span>
        </div>
      </div>
    </aside>
  );
};
