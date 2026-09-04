import React, { useState } from 'react';
import {
  LayoutDashboard,
  ArrowLeftRight,
  ShieldAlert,
  PlayCircle,
  BookOpen,
  BarChart3,
  FileClock,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  CheckCircle2,
  Lock
} from 'lucide-react';
import { NavTab } from '../types';

interface SidebarProps {
  currentTab: NavTab;
  onTabChange: (tab: NavTab) => void;
  highRiskCount: number;
  isOpenMobile?: boolean;
  onCloseMobile?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentTab,
  onTabChange,
  highRiskCount,
  isOpenMobile = false,
  onCloseMobile,
}) => {
  const [collapsed, setCollapsed] = useState(false);

  const navItems = [
    { id: 'dashboard' as NavTab, label: 'Dashboard', icon: LayoutDashboard },
    { id: 'transactions' as NavTab, label: 'Live Transactions', icon: ArrowLeftRight },
    { id: 'alerts' as NavTab, label: 'Risk Alerts', icon: ShieldAlert, badgeCount: highRiskCount },
    { id: 'demo' as NavTab, label: 'Demo Simulator', icon: PlayCircle, badgeText: 'Demo' },
    { id: 'policies' as NavTab, label: 'RAG Policies', icon: BookOpen },
    { id: 'metrics' as NavTab, label: 'Model Evaluation', icon: BarChart3 },
    { id: 'audit' as NavTab, label: 'Audit Trail', icon: FileClock },
  ];

  const handleNavClick = (tab: NavTab) => {
    onTabChange(tab);
    if (onCloseMobile) onCloseMobile();
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpenMobile && (
        <div
          className="fixed inset-0 top-14 bg-black/30 backdrop-blur-sm z-30 md:hidden"
          onClick={onCloseMobile}
        />
      )}

      <aside
        className={`fixed top-14 bottom-0 left-0 z-40 md:relative md:top-auto md:bottom-auto md:z-20 md:h-full bg-white md:bg-white/90 md:backdrop-blur-xl border-r border-zinc-200/80 flex flex-col justify-between p-3 shrink-0 transition-all duration-200 shadow-[1px_0_2px_rgba(0,0,0,0.02)] overflow-y-auto ${
          collapsed ? 'w-16' : 'w-56'
        } ${isOpenMobile ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}`}
      >
        <div className="space-y-4">
          {/* Top Collapse Button (Desktop Only) */}
          <div className="hidden md:flex items-center justify-between px-2 pt-0.5">
            {!collapsed && (
              <span className="text-[10px] font-semibold text-zinc-400 uppercase tracking-wider">
                Platform Navigation
              </span>
            )}
            <button
              onClick={() => setCollapsed(!collapsed)}
              className="p-1 rounded text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100 transition ml-auto"
              title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
              aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            >
              {collapsed ? <ChevronRight className="w-3.5 h-3.5" /> : <ChevronLeft className="w-3.5 h-3.5" />}
            </button>
          </div>

          {/* Navigation Links */}
          <nav className="space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => handleNavClick(item.id)}
                  title={collapsed ? item.label : undefined}
                  className={`w-full flex items-center ${
                    collapsed ? 'justify-center px-2 py-2.5' : 'justify-between px-2.5 py-2'
                  } rounded-lg text-xs font-medium transition-all duration-150 ${
                    isActive
                      ? 'bg-black text-white font-semibold shadow-xs'
                      : 'text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100/80'
                  }`}
                >
                  <div className="flex items-center space-x-2.5">
                    <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-white' : 'text-zinc-500'}`} />
                    {!collapsed && <span className="tracking-tight text-xs">{item.label}</span>}
                  </div>

                  {!collapsed && (
                    <div className="flex items-center space-x-1.5">
                      {item.badgeText && (
                        <span className={`text-[9px] font-bold px-1.5 py-0.2 rounded border ${
                          isActive ? 'bg-white/20 text-white border-white/30' : 'bg-zinc-100 text-zinc-700 border-zinc-200'
                        }`}>
                          {item.badgeText}
                        </span>
                      )}
                      {item.badgeCount !== undefined && item.badgeCount > 0 && (
                        <span className={`text-[10px] font-mono font-bold px-1.5 py-0.2 rounded-full border ${
                          isActive ? 'bg-white text-black border-white' : 'bg-red-500 text-white border-red-500 shadow-2xs'
                        }`}>
                          {item.badgeCount}
                        </span>
                      )}
                    </div>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Operational Status Info & Subtle Disclaimer at Bottom */}
        <div className="pt-3 border-t border-zinc-200/80 space-y-2.5">
          {!collapsed ? (
            <div className="px-1.5 flex items-center justify-between text-[11px] text-zinc-500">
              <span className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_4px_rgba(16,185,129,0.5)]" />
                <span className="text-zinc-700 font-medium">Live Engine</span>
              </span>
              <span className="font-mono text-[10px] text-zinc-400">v1.0-rf</span>
            </div>
          ) : (
            <div className="flex justify-center py-1">
              <span className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_4px_rgba(16,185,129,0.5)]" title="Live Engine Active" />
            </div>
          )}

          {!collapsed ? (
            <div className="px-1.5 pb-0.5">
              <p className="text-[10px] text-zinc-400 leading-normal">
                &ldquo;RazorMontra&rdquo; and Razorpay branding are used for Buildathon purposes. This is an independent Razorpay Buildathon submission and not an official Razorpay product.
              </p>
            </div>
          ) : (
            <div
              className="flex justify-center pb-1 text-zinc-400 hover:text-zinc-600 transition-colors cursor-help"
              title="&ldquo;RazorMontra&rdquo; and Razorpay branding are used for Buildathon purposes. This is an independent Razorpay Buildathon submission and not an official Razorpay product."
            >
              <span className="text-[10px] font-serif italic text-zinc-400">i</span>
            </div>
          )}
        </div>
      </aside>
    </>
  );
};
