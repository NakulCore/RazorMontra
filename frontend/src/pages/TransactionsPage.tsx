import React, { useState } from 'react';
import { Transaction } from '../types';
import { Search, Filter, ArrowRight, ShieldAlert, CheckCircle, Smartphone, Globe } from 'lucide-react';

interface TransactionsPageProps {
  transactions: Transaction[];
  onSelectTransaction: (tx: Transaction) => void;
}

export const TransactionsPage: React.FC<TransactionsPageProps> = ({ transactions, onSelectTransaction }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'high_risk' | 'low_risk'>('all');

  const filtered = transactions.filter((tx) => {
    const matchesSearch =
      tx.transaction_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      tx.customer_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      tx.merchant_id.toLowerCase().includes(searchTerm.toLowerCase());

    const isHigh = tx.is_fraud || tx.amount > 35000 || tx.transactions_last_10_minutes >= 3 || tx.new_location;

    if (filterType === 'high_risk') return matchesSearch && isHigh;
    if (filterType === 'low_risk') return matchesSearch && !isHigh;
    return matchesSearch;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-extrabold text-white tracking-tight">Live Payment Stream</h2>
          <p className="text-xs text-slate-400 mt-0.5">Continuous telemetry ingestion & automated risk classification</p>
        </div>

        {/* Search & Filter Controls */}
        <div className="flex items-center space-x-3">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search ID, customer, merchant..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 pr-4 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 w-64"
            />
          </div>

          <div className="flex rounded-xl bg-slate-900 p-1 border border-slate-800 text-xs font-medium">
            <button
              onClick={() => setFilterType('all')}
              className={`px-3 py-1 rounded-lg transition ${
                filterType === 'all' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              All ({transactions.length})
            </button>
            <button
              onClick={() => setFilterType('high_risk')}
              className={`px-3 py-1 rounded-lg transition ${
                filterType === 'high_risk' ? 'bg-rose-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              High Risk
            </button>
            <button
              onClick={() => setFilterType('low_risk')}
              className={`px-3 py-1 rounded-lg transition ${
                filterType === 'low_risk' ? 'bg-emerald-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              Approved
            </button>
          </div>
        </div>
      </div>

      {/* Transaction Table */}
      <div className="rounded-2xl bg-[#0f172a] border border-slate-800 overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-900/90 text-slate-400 uppercase tracking-wider text-[10px] border-b border-slate-800">
              <tr>
                <th className="py-3.5 px-4 font-semibold">Transaction ID</th>
                <th className="py-3.5 px-4 font-semibold">Amount (INR)</th>
                <th className="py-3.5 px-4 font-semibold">Entity Profile</th>
                <th className="py-3.5 px-4 font-semibold">Telemetry Signals</th>
                <th className="py-3.5 px-4 font-semibold">Method</th>
                <th className="py-3.5 px-4 font-semibold">Risk Classification</th>
                <th className="py-3.5 px-4 font-semibold text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-300">
              {filtered.map((tx) => {
                const isHigh = tx.is_fraud || tx.amount > 35000 || tx.transactions_last_10_minutes >= 3 || tx.new_location;
                return (
                  <tr
                    key={tx.transaction_id}
                    onClick={() => onSelectTransaction(tx)}
                    className="hover:bg-slate-850/70 transition cursor-pointer group"
                  >
                    <td className="py-3.5 px-4 font-mono font-bold text-white text-xs">
                      {tx.transaction_id}
                      <span className="block text-[10px] font-normal text-slate-500 mt-0.5">
                        {new Date(tx.timestamp).toLocaleTimeString()}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 font-bold text-white">
                      ₹{tx.amount.toLocaleString()}
                      {tx.amount_deviation > 2 && (
                        <span className="block text-[10px] font-normal text-amber-400">
                          {tx.amount_deviation.toFixed(1)}x baseline
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="text-slate-200 font-medium block">{tx.customer_id}</span>
                      <span className="text-[10px] text-slate-500">{tx.merchant_id}</span>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="flex flex-wrap gap-1.5">
                        {tx.new_device && (
                          <span className="px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-300 border border-amber-500/20 text-[10px] flex items-center gap-1">
                            <Smartphone className="w-2.5 h-2.5" /> New Dev
                          </span>
                        )}
                        {tx.ip_country !== tx.customer_country && (
                          <span className="px-1.5 py-0.5 rounded bg-purple-500/10 text-purple-300 border border-purple-500/20 text-[10px] flex items-center gap-1">
                            <Globe className="w-2.5 h-2.5" /> {tx.ip_country}
                          </span>
                        )}
                        {tx.transactions_last_10_minutes >= 3 && (
                          <span className="px-1.5 py-0.5 rounded bg-rose-500/10 text-rose-300 border border-rose-500/20 text-[10px]">
                            {tx.transactions_last_10_minutes} in 10m
                          </span>
                        )}
                        {!tx.new_device && tx.ip_country === tx.customer_country && tx.transactions_last_10_minutes < 3 && (
                          <span className="text-slate-500 text-[11px]">Normal Telemetry</span>
                        )}
                      </div>
                    </td>
                    <td className="py-3.5 px-4 uppercase font-mono text-[11px] text-slate-400">
                      {tx.payment_method}
                    </td>
                    <td className="py-3.5 px-4">
                      {isHigh ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/30 text-[11px] font-bold">
                          <ShieldAlert className="w-3 h-3" /> HIGH RISK
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[11px] font-semibold">
                          <CheckCircle className="w-3 h-3" /> LOW RISK
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <span className="inline-flex items-center gap-1 text-blue-400 group-hover:text-blue-300 font-medium text-xs">
                        Investigate <ArrowRight className="w-3.5 h-3.5" />
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
