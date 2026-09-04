import React, { useState, useEffect } from 'react';
import { ShieldCheck, Activity, RefreshCw, Menu, Sparkles, Server } from 'lucide-react';

interface HeaderProps {
  onRefresh: () => void;
  isRefreshing?: boolean;
  onToggleMobileMenu?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  onRefresh,
  isRefreshing,
  onToggleMobileMenu,
}) => {
  const [lastUpdated, setLastUpdated] = useState<string>('');

  useEffect(() => {
    setLastUpdated(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
  }, []);

  const handleRefreshClick = () => {
    onRefresh();
    setLastUpdated(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
  };

  return (
    <header className="h-14 bg-white border-b border-zinc-200/90 px-4 sm:px-6 lg:px-8 flex items-center justify-between sticky top-0 z-30 shrink-0 shadow-[0_1px_2px_rgba(0,0,0,0.03)]">
      {/* Brand & Mobile Toggle */}
      <div className="flex items-center space-x-3 shrink-0">
        {onToggleMobileMenu && (
          <button
            onClick={onToggleMobileMenu}
            className="p-1.5 rounded-lg bg-zinc-100 text-zinc-600 hover:text-zinc-900 md:hidden transition shrink-0"
            title="Toggle Navigation Menu"
            aria-label="Toggle navigation menu"
          >
            <Menu className="w-4 h-4" />
          </button>
        )}

        <div className="flex items-center space-x-2.5 shrink-0">
          <img
            src="https://img.logo.dev/razorpay.com?token=live_6a1a28fd-6420-4492-aeb0-b297461d9de2&size=512&retina=true&format=png"
            alt="Razorpay"
            className="w-8 h-8 rounded-lg object-contain bg-white border border-zinc-200/90 p-1 shadow-2xs shrink-0"
          />
          <div className="shrink-0">
            <div className="flex items-center space-x-2">
              <span className="font-extrabold text-zinc-900 text-sm sm:text-base tracking-tight select-none">RazorMontra</span>
            </div>
            <p className="text-[11px] text-zinc-500 hidden sm:block leading-none mt-0.5 select-none">
              AI Financial Intelligence for Merchants
            </p>
          </div>
        </div>
      </div>

      {/* Status Indicators & Actions - Strictly Aligned on Single Baseline */}
      <div className="flex items-center space-x-2 sm:space-x-2.5 shrink-0">
        {/* System Status Indicator */}
        <div className="hidden lg:flex items-center space-x-2 h-7 px-2.5 rounded-md bg-zinc-100/90 border border-zinc-200 text-[11px] text-zinc-700 font-medium">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_4px_rgba(16,185,129,0.5)]" />
          <span className="tracking-wide">System Operational</span>
        </div>

        {/* Sandbox Mode */}
        <div className="flex items-center space-x-1.5 h-7 px-2.5 rounded-md bg-zinc-100/90 border border-zinc-200 text-zinc-700 font-medium text-[11px]">
          <span className="w-1.5 h-1.5 rounded-full bg-zinc-500" />
          <span className="hidden sm:inline font-mono">SANDBOX MODE</span>
          <span className="sm:hidden font-mono">SANDBOX</span>
        </div>

        {/* Model Version */}
        <div className="hidden md:flex items-center space-x-1.5 h-7 px-2.5 rounded-md bg-zinc-100/90 border border-zinc-200 text-zinc-700 text-[11px]">
          <Activity className="w-3 h-3 text-zinc-500" />
          <span>Model <strong className="text-zinc-900 font-mono font-medium">v1.0</strong></span>
        </div>

        {/* Live Clock */}
        {lastUpdated && (
          <span className="text-[11px] font-mono text-zinc-500 hidden xl:inline-block px-1">
            {lastUpdated}
          </span>
        )}

        {/* Refresh Button */}
        <button
          onClick={handleRefreshClick}
          disabled={isRefreshing}
          className="h-7 px-2.5 sm:px-3 rounded-md bg-white hover:bg-zinc-50 border border-zinc-200 text-zinc-700 hover:text-zinc-900 shadow-xs transition flex items-center gap-1.5 text-[11px] font-medium active:scale-95 disabled:opacity-60"
          title="Refresh Telemetry"
          aria-label="Refresh telemetry data"
        >
          <RefreshCw className={`w-3 h-3 ${isRefreshing ? 'animate-spin text-zinc-900' : 'text-zinc-500'}`} />
          <span className="hidden sm:inline">Refresh</span>
        </button>
      </div>
    </header>
  );
};
