import React, { useState, useMemo } from 'react';
import { Transaction } from '../types';
import {
  ShieldAlert,
  Flame,
  ArrowRight,
  Search,
  Filter,
  CheckCircle,
  AlertTriangle,
  Smartphone,
  Globe,
  Clock,
  Lock
} from 'lucide-react';
import { RiskScoreGauge } from '../components/RiskScoreGauge';
import { RiskBadge } from '../components/RiskBadge';
import { DecisionBadge } from '../components/DecisionBadge';

interface AlertsPageProps {
  transactions: Transaction[];
  onSelectTransaction: (tx: Transaction) => void;
}

export const AlertsPage: React.FC<AlertsPageProps> = ({
  transactions,
  onSelectTransaction,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [severityFilter, setSeverityFilter] = useState<'all' | 'critical' | 'high'>('all');

  // Filter for alerts only
  const alertItems = useMemo(() => {
    return transactions
      .filter((t) => t.is_fraud || t.amount > 30000 || t.transactions_last_10_minutes >= 2 || t.new_location || t.previous_failed_transactions > 0)
      .map((t) => {
        let score = 78;
        let severity: 'HIGH' | 'CRITICAL' = 'HIGH';
        let decision: 'APPROVE' | 'VERIFY' | 'FLAG' | 'ESCALATE' = 'FLAG';

        if (t.is_fraud || t.transactions_last_10_minutes >= 4) {
          score = 96;
          severity = 'CRITICAL';
          decision = 'ESCALATE';
        }

        return {
          ...t,
          alertScore: score,
          severity,
          decision,
        };
      });
  }, [transactions]);

  const filtered = useMemo(() => {
    return alertItems.filter((item) => {
      const matchesSearch =
        item.transaction_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.customer_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.merchant_id.toLowerCase().includes(searchTerm.toLowerCase());

      if (!matchesSearch) return false;
      if (severityFilter === 'critical') return item.severity === 'CRITICAL';
      if (severityFilter === 'high') return item.severity === 'HIGH';
      return true;
    });
  }, [alertItems, searchTerm, severityFilter]);

  const criticalCount = alertItems.filter((i) => i.severity === 'CRITICAL').length;
  const highCount = alertItems.filter((i) => i.severity === 'HIGH').length;

  return (
    <div className="space-y-6">
      {/* Header & Filter Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center space-x-2">
            <ShieldAlert className="w-4 h-4 text-zinc-900" />
            <h1 className="text-lg sm:text-xl font-bold text-zinc-900 tracking-tight">Active Risk Alerts</h1>
          </div>
          <p className="text-xs text-zinc-500 mt-0.5">
            Real-time queue of intercepted transactions requiring immediate risk officer or compliance triage.
          </p>
        </div>

        {/* Severity Tabs & Search - Aligned */}
        <div className="flex flex-wrap items-center gap-2.5">
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-zinc-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search alerts..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8 pr-3 h-8 rounded-lg bg-white border border-zinc-200 text-xs text-zinc-900 placeholder-zinc-400 focus:outline-none focus:border-black w-48 sm:w-56 shadow-2xs"
            />
          </div>

          <div className="flex rounded-lg bg-zinc-100 p-0.5 border border-zinc-200/80 text-xs font-medium">
            <button
              onClick={() => setSeverityFilter('all')}
              className={`h-7 px-2.5 rounded-md transition-all ${
                severityFilter === 'all' ? 'bg-black text-white font-semibold shadow-xs' : 'text-zinc-600 hover:text-zinc-900'
              }`}
            >
              All ({alertItems.length})
            </button>
            <button
              onClick={() => setSeverityFilter('critical')}
              className={`h-7 px-2.5 rounded-md transition-all ${
                severityFilter === 'critical' ? 'bg-orange-500 text-white font-bold shadow-xs' : 'text-zinc-600 hover:text-orange-600'
              }`}
            >
              Critical ({criticalCount})
            </button>
            <button
              onClick={() => setSeverityFilter('high')}
              className={`h-7 px-2.5 rounded-md transition-all ${
                severityFilter === 'high' ? 'bg-red-600 text-white font-bold shadow-xs' : 'text-zinc-600 hover:text-red-600'
              }`}
            >
              High ({highCount})
            </button>
          </div>
        </div>
      </div>

      {/* Alerts Grid - Equal Height */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((item) => {
          return (
            <div
              key={item.transaction_id}
              onClick={() => onSelectTransaction(item)}
              className={`glass-card-interactive rounded-xl p-4 cursor-pointer flex flex-col justify-between min-h-[170px] group border transition-all ${
                item.severity === 'CRITICAL'
                  ? 'border-orange-200/90 hover:border-orange-400 bg-orange-500/[0.03]'
                  : item.severity === 'HIGH'
                  ? 'border-red-200/90 hover:border-red-400 bg-red-500/[0.03]'
                  : 'border-zinc-200/80 hover:border-zinc-300'
              }`}
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs font-semibold text-zinc-900 group-hover:text-black transition-colors">
                    {item.transaction_id}
                  </span>
                  <RiskBadge riskClass={item.severity} size="sm" />
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2.5">
                    <RiskScoreGauge score={item.alertScore} size="sm" />
                    <div>
                      <div className="text-sm font-bold text-zinc-900 font-mono tabular-nums">
                        ₹{Math.round(item.amount).toLocaleString('en-IN')}
                      </div>
                      <div className="text-[11px] text-zinc-500">
                        Cust: <span className="text-zinc-800">{item.customer_id}</span>
                      </div>
                    </div>
                  </div>

                  <DecisionBadge decision={item.decision} size="sm" />
                </div>

                {/* Signals / Tags */}
                <div className="flex flex-wrap gap-1">
                  {item.is_fraud && (
                    <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-black text-white font-bold border border-black">
                      FRAUD PATTERN
                    </span>
                  )}
                  {item.new_device && (
                    <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-zinc-100 text-zinc-700 border border-zinc-200">
                      New Device
                    </span>
                  )}
                  {item.transactions_last_10_minutes >= 3 && (
                    <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-zinc-200 text-zinc-900 border border-zinc-300 font-medium">
                      Velocity Burst
                    </span>
                  )}
                  {item.ip_country !== item.customer_country && (
                    <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-zinc-200 text-zinc-900 border border-zinc-300 font-medium">
                      Geo Mismatch
                    </span>
                  )}
                </div>
              </div>

              {/* Card Footer */}
              <div className="flex items-center justify-between pt-2.5 border-t border-zinc-200/70 text-[11px] text-zinc-500 mt-3">
                <span className="font-mono">
                  {new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
                <span className="text-zinc-500 group-hover:text-black font-medium inline-flex items-center gap-1 transition-colors">
                  Investigate
                  <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
