import React, { useState } from 'react';
import { AuditRecord } from '../types';
import { FileClock, Search, ShieldCheck, Lock, ChevronDown, ChevronRight, Hash } from 'lucide-react';

interface AuditPageProps {
  auditRecords: AuditRecord[];
}

export const AuditPage: React.FC<AuditPageProps> = ({ auditRecords }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const filtered = auditRecords.filter(
    (a) =>
      a.audit_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      a.transaction_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      a.decision.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <FileClock className="w-5 h-5 text-blue-400" />
            <h2 className="text-xl font-extrabold text-white tracking-tight">Immutable Risk Decision Ledger</h2>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Cryptographically trace every automated decision, policy citation, and payment provider action.
          </p>
        </div>

        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by Audit ID, Transaction ID, Decision..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9 pr-4 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 w-72"
          />
        </div>
      </div>

      {/* Audit Table */}
      <div className="rounded-2xl bg-[#0f172a] border border-slate-800 overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-900/90 text-slate-400 uppercase tracking-wider text-[10px] border-b border-slate-800">
              <tr>
                <th className="py-3.5 px-4 font-semibold">Audit Trace ID</th>
                <th className="py-3.5 px-4 font-semibold">Transaction ID</th>
                <th className="py-3.5 px-4 font-semibold">Timestamp</th>
                <th className="py-3.5 px-4 font-semibold">Risk Score</th>
                <th className="py-3.5 px-4 font-semibold">Decision</th>
                <th className="py-3.5 px-4 font-semibold">Dispatched Action</th>
                <th className="py-3.5 px-4 font-semibold">Policy Citations</th>
                <th className="py-3.5 px-4 font-semibold text-right">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-300">
              {filtered.map((record) => {
                const isExpanded = expandedId === record.audit_id;
                return (
                  <React.Fragment key={record.audit_id}>
                    <tr
                      onClick={() => setExpandedId(isExpanded ? null : record.audit_id)}
                      className="hover:bg-slate-850/70 transition cursor-pointer"
                    >
                      <td className="py-3.5 px-4 font-mono font-bold text-blue-400 text-xs">
                        {record.audit_id}
                      </td>
                      <td className="py-3.5 px-4 font-mono text-slate-200">{record.transaction_id}</td>
                      <td className="py-3.5 px-4 text-slate-400">
                        {new Date(record.timestamp).toLocaleString()}
                      </td>
                      <td className="py-3.5 px-4">
                        <span
                          className={`font-bold font-mono px-2 py-0.5 rounded text-xs ${
                            record.risk_score >= 75
                              ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                              : record.risk_score >= 40
                              ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                              : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                          }`}
                        >
                          {record.risk_score}/100
                        </span>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="font-semibold text-white">{record.decision}</span>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="font-mono text-[11px] text-emerald-400 uppercase">
                          {record.action} ({record.status})
                        </span>
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="flex flex-wrap gap-1">
                          {record.retrieved_policy_ids?.slice(0, 2).map((pid, idx) => (
                            <span
                              key={idx}
                              className="px-1.5 py-0.2 rounded bg-purple-500/10 text-purple-300 border border-purple-500/20 text-[10px] font-mono"
                            >
                              {pid}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <button className="text-slate-400 hover:text-white">
                          {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                        </button>
                      </td>
                    </tr>

                    {/* Expandable JSON Snapshot */}
                    {isExpanded && (
                      <tr className="bg-slate-950/90 border-b border-slate-800">
                        <td colSpan={8} className="p-4">
                          <div className="space-y-3">
                            <div>
                              <span className="text-[11px] font-bold text-blue-400 uppercase block mb-1">
                                AI Investigation Summary
                              </span>
                              <p className="text-xs text-slate-200">{record.investigation_summary}</p>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                              <div>
                                <span className="text-[11px] font-bold text-slate-400 uppercase block mb-1">
                                  Triggered Rules ({record.rule_results?.filter((r) => r.triggered).length || 0})
                                </span>
                                <div className="space-y-1 text-xs">
                                  {record.rule_results
                                    ?.filter((r) => r.triggered)
                                    .map((r, i) => (
                                      <div key={i} className="p-2 rounded bg-slate-900 border border-slate-800 text-rose-300">
                                        <strong>{r.rule}:</strong> {r.reason}
                                      </div>
                                    ))}
                                </div>
                              </div>

                              <div>
                                <span className="text-[11px] font-bold text-slate-400 uppercase block mb-1">
                                  Risk Factors Attributed
                                </span>
                                <div className="space-y-1 text-xs">
                                  {record.risk_factors?.map((f, i) => (
                                    <div key={i} className="p-2 rounded bg-slate-900 border border-slate-800 text-slate-300">
                                      • {f}
                                    </div>
                                  ))}
                                </div>
                              </div>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
