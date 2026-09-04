import React, { useState } from 'react';
import { AuditRecord } from '../types';
import {
  FileClock,
  Search,
  ShieldCheck,
  Lock,
  ChevronDown,
  ChevronRight,
  Copy,
  Check,
  Terminal,
  Activity,
  Calendar,
  Layers
} from 'lucide-react';
import { RiskScoreGauge } from '../components/RiskScoreGauge';
import { DecisionBadge } from '../components/DecisionBadge';

interface AuditPageProps {
  auditRecords: AuditRecord[];
}

export const AuditPage: React.FC<AuditPageProps> = ({ auditRecords }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'timeline' | 'table'>('timeline');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const filtered = auditRecords.filter(
    (a) =>
      a.audit_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      a.transaction_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      a.decision.toLowerCase().includes(searchTerm.toLowerCase()) ||
      a.action.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Header & Controls */}
      <div className="glass-card rounded-2xl p-6 border border-zinc-200/80 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <FileClock className="w-4 h-4 text-zinc-900" />
            <h1 className="text-lg sm:text-xl font-bold text-zinc-900 tracking-tight">
              Immutable Risk Decision Ledger
            </h1>
          </div>
          <p className="text-xs text-zinc-600 mt-0.5">
            Cryptographically trace every automated decision, policy citation, and payment provider action for full auditability.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-zinc-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by Audit ID, Txn ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8 pr-3 h-8 rounded-lg bg-white border border-zinc-200 text-xs text-zinc-900 placeholder-zinc-400 focus:outline-none focus:border-black w-52 sm:w-60 shadow-2xs"
            />
          </div>

          <div className="flex rounded-lg bg-zinc-100 p-0.5 border border-zinc-200/80 text-xs font-medium">
            <button
              onClick={() => setViewMode('timeline')}
              className={`h-7 px-2.5 rounded-md transition-all ${
                viewMode === 'timeline' ? 'bg-black text-white font-semibold shadow-xs' : 'text-zinc-600 hover:text-zinc-900'
              }`}
            >
              Timeline
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`h-7 px-2.5 rounded-md transition-all ${
                viewMode === 'table' ? 'bg-black text-white font-semibold shadow-xs' : 'text-zinc-600 hover:text-zinc-900'
              }`}
            >
              Table
            </button>
          </div>
        </div>
      </div>

      {/* Chronological Timeline View */}
      {viewMode === 'timeline' ? (
        <div className="space-y-3.5">
          {filtered.map((record, rIdx) => {
            const isExpanded = expandedId === record.audit_id;
            const timeStr = new Date(record.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
            const dateStr = new Date(record.timestamp).toLocaleDateString();

            return (
              <div
                key={record.audit_id}
                className="glass-card rounded-xl p-4 border border-zinc-200/80 space-y-3"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 border-b border-zinc-200/70 pb-2.5">
                  <div className="flex items-center space-x-2.5">
                    <button
                      onClick={() => copyToClipboard(record.audit_id, record.audit_id)}
                      className="font-mono text-xs font-bold text-zinc-900 hover:underline flex items-center gap-1.5 transition-colors"
                      title="Click to copy Audit ID"
                    >
                      <span>{record.audit_id}</span>
                      {copiedId === record.audit_id ? (
                        <Check className="w-3 h-3 text-black" />
                      ) : (
                        <Copy className="w-3 h-3 text-zinc-400" />
                      )}
                    </button>
                    <span className="text-zinc-300">•</span>
                    <span className="font-mono text-xs text-zinc-700">
                      Txn: {record.transaction_id}
                    </span>
                  </div>

                  <div className="flex items-center space-x-3">
                    <span className="text-[11px] text-zinc-500 font-mono flex items-center gap-1">
                      <Calendar className="w-3 h-3 text-zinc-400" />
                      <span>{dateStr} {timeStr}</span>
                    </span>
                    <DecisionBadge decision={record.decision} size="sm" />
                  </div>
                </div>

                {/* Micro-Event Pipeline Flow for this Transaction */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                  <div className="p-2 rounded-lg bg-zinc-50 border border-zinc-200">
                    <span className="text-[9px] text-zinc-500 block uppercase font-mono">1. Telemetry</span>
                    <span className="font-mono text-zinc-700 text-[11px]">Normalized</span>
                  </div>
                  <div className="p-2 rounded-lg bg-zinc-50 border border-zinc-200">
                    <span className="text-[9px] text-zinc-500 block uppercase font-mono">2. ML Score</span>
                    <span className="font-mono text-[11px] font-bold text-zinc-900">
                      {record.risk_score}/100 ({record.risk_class})
                    </span>
                  </div>
                  <div className="p-2 rounded-lg bg-zinc-50 border border-zinc-200">
                    <span className="text-[9px] text-zinc-500 block uppercase font-mono">3. Policy Gates</span>
                    <span className="font-mono text-zinc-700 text-[11px]">
                      {record.rule_results?.filter((r) => r.triggered).length || 0} Rules • {record.retrieved_policy_ids?.length || 0} Policies
                    </span>
                  </div>
                  <div className="p-2 rounded-lg bg-zinc-50 border border-zinc-200">
                    <span className="text-[9px] text-zinc-500 block uppercase font-mono">4. Action Taken</span>
                    <span className="font-mono text-zinc-900 font-bold uppercase text-[11px]">
                      {record.action} ({record.status})
                    </span>
                  </div>
                </div>

                {/* AI Investigation Summary Quote */}
                <div className="p-3 rounded-xl bg-zinc-50 border border-zinc-200 text-xs text-zinc-800">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-900 block mb-1">
                    AI Investigation Synthesis
                  </span>
                  <p className="leading-relaxed text-[11px] text-zinc-700">{record.investigation_summary}</p>
                </div>

                {/* Toggle Details */}
                <div className="flex items-center justify-between pt-1 text-xs">
                  <button
                    onClick={() => setExpandedId(isExpanded ? null : record.audit_id)}
                    className="text-zinc-600 hover:text-black flex items-center gap-1 font-medium transition"
                  >
                    <span>{isExpanded ? 'Hide Raw Audit Snapshot' : 'Inspect Complete Snapshot & Rules'}</span>
                    {isExpanded ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
                  </button>
                  <span className="text-[10px] font-mono text-zinc-500">
                    Actor: Razorpay Copilot Pipeline v1.0
                  </span>
                </div>

                {/* Expanded Raw Payload & Rule Details */}
                {isExpanded && (
                  <div className="pt-3 border-t border-zinc-200 space-y-3 text-xs">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <h5 className="font-bold text-zinc-700 uppercase text-[10px] mb-1.5">Triggered Rules</h5>
                        <div className="space-y-1">
                          {record.rule_results?.filter((r) => r.triggered).map((r, i) => (
                            <div key={i} className="p-2 rounded bg-white border border-zinc-200 text-zinc-900 text-[11px]">
                              <strong>{r.rule}:</strong> {r.reason}
                            </div>
                          ))}
                          {(!record.rule_results || record.rule_results.filter((r) => r.triggered).length === 0) && (
                            <span className="text-zinc-500 text-[11px]">No deterministic rules tripped.</span>
                          )}
                        </div>
                      </div>

                      <div>
                        <h5 className="font-bold text-zinc-700 uppercase text-[10px] mb-1.5">Policy Citations</h5>
                        <div className="flex flex-wrap gap-1.5">
                          {record.retrieved_policy_ids?.map((pid, idx) => (
                            <span
                              key={idx}
                              className="px-2 py-0.5 rounded bg-zinc-100 text-zinc-900 border border-zinc-200 font-mono text-[10px]"
                            >
                              {pid}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        /* Data Table View */
        <div className="glass-card rounded-xl overflow-hidden shadow-xs border border-zinc-200/80">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-zinc-50/90 text-zinc-500 uppercase tracking-wider text-[10px] border-b border-zinc-200">
                <tr>
                  <th className="py-3 px-4 font-semibold">Audit Trace ID</th>
                  <th className="py-3 px-4 font-semibold">Transaction ID</th>
                  <th className="py-3 px-4 font-semibold">Timestamp</th>
                  <th className="py-3 px-4 font-semibold">Risk Score</th>
                  <th className="py-3 px-4 font-semibold">Decision</th>
                  <th className="py-3 px-4 font-semibold">Action Dispatched</th>
                  <th className="py-3 px-4 font-semibold">Policy Citations</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 text-zinc-800">
                {filtered.map((record) => (
                  <tr key={record.audit_id} className="hover:bg-zinc-50/80 transition">
                    <td className="py-3 px-4 font-mono font-bold text-zinc-900 text-xs">
                      {record.audit_id}
                    </td>
                    <td className="py-3 px-4 font-mono text-zinc-700">{record.transaction_id}</td>
                    <td className="py-3 px-4 text-zinc-500 font-mono text-[11px]">
                      {new Date(record.timestamp).toLocaleString()}
                    </td>
                    <td className="py-3 px-4">
                      <span className="font-mono font-bold px-2 py-0.5 rounded text-xs bg-zinc-100 text-zinc-900 border border-zinc-200">
                        {record.risk_score}/100
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <DecisionBadge decision={record.decision} size="sm" />
                    </td>
                    <td className="py-3 px-4">
                      <span className="font-mono text-[11px] text-zinc-900 uppercase font-bold">
                        {record.action} ({record.status})
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex flex-wrap gap-1">
                        {record.retrieved_policy_ids?.slice(0, 2).map((pid, idx) => (
                          <span
                            key={idx}
                            className="px-1.5 py-0.2 rounded bg-zinc-100 text-zinc-900 border border-zinc-200 text-[10px] font-mono"
                          >
                            {pid}
                          </span>
                        ))}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
