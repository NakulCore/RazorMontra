import React, { useState, useMemo } from 'react';
import { Transaction } from '../types';
import {
  Search,
  ArrowRight,
  ShieldAlert,
  CheckCircle,
  Smartphone,
  Globe,
  SlidersHorizontal,
  ChevronLeft,
  ChevronRight,
  AlertTriangle,
  ArrowUpDown,
  Flame
} from 'lucide-react';
import { RiskScoreGauge } from '../components/RiskScoreGauge';
import { RiskBadge } from '../components/RiskBadge';
import { DecisionBadge } from '../components/DecisionBadge';

interface TransactionsPageProps {
  transactions: Transaction[];
  onSelectTransaction: (tx: Transaction) => void;
}

export const TransactionsPage: React.FC<TransactionsPageProps> = ({
  transactions,
  onSelectTransaction,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [riskFilter, setRiskFilter] = useState<'all' | 'high' | 'medium' | 'low'>('all');
  const [sortBy, setSortBy] = useState<'time' | 'amount' | 'risk'>('time');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 15;

  // Process & enrich transactions for presentation
  const processed = useMemo(() => {
    return transactions.map((tx) => {
      let riskScore = tx.risk_score ?? 12;
      let riskClass: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' = tx.risk_class ?? 'LOW';
      let decision: 'APPROVE' | 'VERIFY' | 'FLAG' | 'ESCALATE' = tx.decision ?? 'APPROVE';

      if (tx.risk_score === undefined) {
        if (tx.is_fraud || tx.transactions_last_10_minutes >= 4) {
          riskScore = 95;
          riskClass = 'CRITICAL';
          decision = 'ESCALATE';
        } else if (tx.amount > 35000 || tx.amount_deviation > 3.0) {
          riskScore = 82;
          riskClass = 'HIGH';
          decision = 'FLAG';
        } else if (tx.new_device || tx.ip_country !== tx.customer_country || tx.previous_failed_transactions > 0) {
          riskScore = 52;
          riskClass = 'MEDIUM';
          decision = 'VERIFY';
        }
      }

      return {
        ...tx,
        calculatedScore: riskScore,
        calculatedClass: riskClass,
        calculatedDecision: decision,
      };
    });
  }, [transactions]);

  // Filter
  const filtered = useMemo(() => {
    return processed.filter((tx) => {
      const matchSearch =
        tx.transaction_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        tx.customer_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        tx.merchant_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        tx.payment_method.toLowerCase().includes(searchTerm.toLowerCase());

      if (!matchSearch) return false;

      if (riskFilter === 'high') return tx.calculatedClass === 'HIGH' || tx.calculatedClass === 'CRITICAL';
      if (riskFilter === 'medium') return tx.calculatedClass === 'MEDIUM';
      if (riskFilter === 'low') return tx.calculatedClass === 'LOW';
      return true;
    });
  }, [processed, searchTerm, riskFilter]);

  // Sort
  const sorted = useMemo(() => {
    return [...filtered].sort((a, b) => {
      if (sortBy === 'amount') return b.amount - a.amount;
      if (sortBy === 'risk') return b.calculatedScore - a.calculatedScore;
      return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
    });
  }, [filtered, sortBy]);

  // Paginate
  const totalPages = Math.ceil(sorted.length / pageSize) || 1;
  const paginated = sorted.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  return (
    <div className="space-y-6">
      {/* Header & Controls Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div>
          <h1 className="text-lg sm:text-xl font-bold text-zinc-900 tracking-tight">Live Payment Stream</h1>
          <p className="text-xs text-zinc-500 mt-0.5">
            Continuous payment ingestion, empirical feature extraction, and automated decision assignment.
          </p>
        </div>

        {/* Filter Controls Bar - Aligned Single Baseline */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Search */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-zinc-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by ID, customer..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              className="pl-8 pr-3 h-8 rounded-lg bg-white border border-zinc-200 text-xs text-zinc-900 placeholder-zinc-400 focus:outline-none focus:border-black w-52 sm:w-60 shadow-2xs"
            />
          </div>

          {/* Risk Level Filter Tabs */}
          <div className="flex rounded-lg bg-zinc-100 p-0.5 border border-zinc-200/80 text-xs font-medium">
            <button
              onClick={() => { setRiskFilter('all'); setCurrentPage(1); }}
              className={`h-7 px-2.5 rounded-md transition-all ${
                riskFilter === 'all' ? 'bg-black text-white font-semibold shadow-xs' : 'text-zinc-600 hover:text-zinc-900'
              }`}
            >
              All ({processed.length})
            </button>
            <button
              onClick={() => { setRiskFilter('high'); setCurrentPage(1); }}
              className={`h-7 px-2.5 rounded-md transition-all ${
                riskFilter === 'high' ? 'bg-black text-white font-semibold shadow-xs' : 'text-zinc-600 hover:text-zinc-900'
              }`}
            >
              Critical / High
            </button>
            <button
              onClick={() => { setRiskFilter('medium'); setCurrentPage(1); }}
              className={`h-7 px-2.5 rounded-md transition-all ${
                riskFilter === 'medium' ? 'bg-black text-white font-semibold shadow-xs' : 'text-zinc-600 hover:text-zinc-900'
              }`}
            >
              Medium
            </button>
            <button
              onClick={() => { setRiskFilter('low'); setCurrentPage(1); }}
              className={`h-7 px-2.5 rounded-md transition-all ${
                riskFilter === 'low' ? 'bg-black text-white font-semibold shadow-xs' : 'text-zinc-600 hover:text-zinc-900'
              }`}
            >
              Approved
            </button>
          </div>

          {/* Sort Dropdown */}
          <div className="flex items-center space-x-1.5 h-8 px-2.5 rounded-lg bg-white border border-zinc-200 text-xs text-zinc-700 shadow-2xs">
            <ArrowUpDown className="w-3 h-3 text-zinc-400" />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="bg-transparent text-zinc-800 focus:outline-none cursor-pointer text-xs"
            >
              <option value="time">Latest</option>
              <option value="risk">Risk Score</option>
              <option value="amount">Amount</option>
            </select>
          </div>
        </div>
      </div>

      {/* Main Table */}
      <div className="glass-card rounded-xl overflow-hidden shadow-xs border border-zinc-200/80">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-zinc-50/90 text-zinc-500 uppercase tracking-wider text-[10px] border-b border-zinc-200">
              <tr>
                <th className="py-2.5 px-3.5 font-semibold">Transaction ID</th>
                <th className="py-2.5 px-3.5 font-semibold text-right">Amount (INR)</th>
                <th className="py-2.5 px-3.5 font-semibold">Customer / Merchant</th>
                <th className="py-2.5 px-3.5 font-semibold text-center">Risk Score</th>
                <th className="py-2.5 px-3.5 font-semibold text-center">Risk Level</th>
                <th className="py-2.5 px-3.5 font-semibold">Key Signals</th>
                <th className="py-2.5 px-3.5 font-semibold text-center">Decision</th>
                <th className="py-2.5 px-3.5 font-semibold">Timestamp</th>
                <th className="py-2.5 px-3.5 font-semibold text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 text-zinc-800">
              {paginated.map((tx) => {
                return (
                  <tr
                    key={tx.transaction_id}
                    onClick={() => onSelectTransaction(tx)}
                    className="hover:bg-zinc-50/80 transition-colors cursor-pointer group"
                  >
                    <td className="py-2.5 px-3.5 whitespace-nowrap">
                      <span className="font-mono font-medium text-zinc-900 group-hover:text-black transition-colors">
                        {tx.transaction_id}
                      </span>
                    </td>

                    {/* Right-Aligned Monetary Value */}
                    <td className="py-2.5 px-3.5 text-right whitespace-nowrap">
                      <span className="font-semibold text-zinc-900 font-mono tabular-nums">
                        ₹{Math.round(tx.amount).toLocaleString('en-IN')}
                      </span>
                      {tx.amount_deviation > 2.0 && (
                        <span className="block text-[10px] text-zinc-500 font-mono">
                          {tx.amount_deviation.toFixed(1)}x base
                        </span>
                      )}
                    </td>

                    <td className="py-2.5 px-3.5 whitespace-nowrap">
                      <span className="text-zinc-900 font-medium block">{tx.customer_id}</span>
                      <span className="text-[10px] text-zinc-500 font-mono">{tx.merchant_id}</span>
                    </td>

                    <td className="py-2.5 px-3.5 text-center whitespace-nowrap">
                      <RiskScoreGauge score={tx.calculatedScore} size="sm" />
                    </td>

                    <td className="py-2.5 px-3.5 text-center whitespace-nowrap">
                      <RiskBadge riskClass={tx.calculatedClass} size="sm" />
                    </td>

                    <td className="py-2.5 px-3.5">
                      <div className="flex flex-wrap gap-1 max-w-xs">
                        {tx.is_fraud && (
                          <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-black text-white font-bold border border-black">
                            FRAUD PATTERN
                          </span>
                        )}
                        {tx.new_device && (
                          <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-zinc-100 text-zinc-700 border border-zinc-200">
                            New Device
                          </span>
                        )}
                        {tx.transactions_last_10_minutes >= 3 && (
                          <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-zinc-200 text-zinc-900 border border-zinc-300 font-medium">
                            {tx.transactions_last_10_minutes} txns / 10m
                          </span>
                        )}
                        {tx.ip_country !== tx.customer_country && (
                          <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-zinc-200 text-zinc-900 border border-zinc-300 font-medium">
                            Geo Mismatch
                          </span>
                        )}
                        {!tx.is_fraud && !tx.new_device && tx.transactions_last_10_minutes < 3 && tx.ip_country === tx.customer_country && (
                          <span className="text-[10px] text-zinc-500">Normal Profile</span>
                        )}
                      </div>
                    </td>

                    <td className="py-2.5 px-3.5 text-center whitespace-nowrap">
                      <DecisionBadge decision={tx.calculatedDecision} size="sm" />
                    </td>

                    <td className="py-2.5 px-3.5 text-zinc-500 font-mono whitespace-nowrap text-[11px]">
                      {new Date(tx.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                    </td>

                    <td className="py-2.5 px-3.5 text-right whitespace-nowrap">
                      <span className="text-zinc-500 group-hover:text-black font-medium inline-flex items-center gap-1 transition-colors">
                        Investigate
                        <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        <div className="p-3 bg-zinc-50/90 border-t border-zinc-200 flex items-center justify-between text-xs text-zinc-600">
          <div>
            Showing <strong className="text-zinc-900 font-mono font-semibold">{(currentPage - 1) * pageSize + 1}</strong> to{' '}
            <strong className="text-zinc-900 font-mono font-semibold">{Math.min(currentPage * pageSize, sorted.length)}</strong> of{' '}
            <strong className="text-zinc-900 font-mono font-semibold">{sorted.length}</strong> transactions
          </div>

          <div className="flex items-center space-x-1.5">
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="h-7 px-2.5 rounded bg-white hover:bg-zinc-100 disabled:opacity-40 border border-zinc-200 text-zinc-700 hover:text-black transition-colors flex items-center gap-1 shadow-2xs"
            >
              <ChevronLeft className="w-3 h-3" />
              <span>Prev</span>
            </button>
            <span className="px-2 font-mono text-[11px] text-zinc-600">
              Page {currentPage} of {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="h-7 px-2.5 rounded bg-white hover:bg-zinc-100 disabled:opacity-40 border border-zinc-200 text-zinc-700 hover:text-black transition-colors flex items-center gap-1 shadow-2xs"
            >
              <span>Next</span>
              <ChevronRight className="w-3 h-3" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
