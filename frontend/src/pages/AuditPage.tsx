import React, { useState } from 'react';
import { AuditRecord } from '../types';
import {
  FileClock,
  Search,
  ChevronDown,
  ChevronRight,
  Copy,
  Check,
  Calendar,
  Filter,
  X,
  ExternalLink,
  Sparkles
} from 'lucide-react';
import { DecisionBadge } from '../components/DecisionBadge';

interface AuditPageProps {
  auditRecords: AuditRecord[];
  onSelectTransaction?: (tx: any) => void;
}

export const AuditPage: React.FC<AuditPageProps> = ({ auditRecords, onSelectTransaction }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'timeline' | 'table'>('timeline');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [decisionFilter, setDecisionFilter] = useState<'ALL' | 'ESCALATE' | 'FLAG' | 'VERIFY' | 'APPROVE'>('ALL');
  const [selectedDecisionRecord, setSelectedDecisionRecord] = useState<AuditRecord | null>(null);

  const decisionCounts = {
    ALL: auditRecords.length,
    ESCALATE: auditRecords.filter((a) => a.decision === 'ESCALATE').length,
    FLAG: auditRecords.filter((a) => a.decision === 'FLAG').length,
    VERIFY: auditRecords.filter((a) => a.decision === 'VERIFY').length,
    APPROVE: auditRecords.filter((a) => a.decision === 'APPROVE').length,
  };

  const filtered = auditRecords.filter((a) => {
    const matchesSearch =
      a.audit_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      a.transaction_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      a.decision.toLowerCase().includes(searchTerm.toLowerCase()) ||
      a.action.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesDecision = decisionFilter === 'ALL' || a.decision === decisionFilter;
    return matchesSearch && matchesDecision;
  });

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Header & Controls */}
      <div className="glass-card rounded-2xl p-6 border border-zinc-200/80 space-y-4">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
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

        {/* Interactive Decision Filter Bar */}
        <div className="flex flex-wrap items-center gap-1.5 pt-3 border-t border-zinc-200/70">
          <span className="text-[11px] text-zinc-500 font-medium mr-1 flex items-center gap-1">
            <Filter className="w-3 h-3 text-zinc-400" /> Filter Decisions:
          </span>
          {(['ALL', 'ESCALATE', 'FLAG', 'VERIFY', 'APPROVE'] as const).map((dec) => {
            const isActive = decisionFilter === dec;
            const count = decisionCounts[dec];
            return (
              <button
                key={dec}
                onClick={() => setDecisionFilter(dec)}
                className={`h-6 px-2.5 rounded-full text-xs font-medium transition-all flex items-center gap-1.5 cursor-pointer ${
                  isActive
                    ? 'bg-black text-white font-semibold shadow-xs'
                    : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200/80 hover:text-zinc-900 border border-zinc-200/70'
                }`}
              >
                <span>{dec}</span>
                <span
                  className={`text-[10px] px-1 rounded-full ${
                    isActive ? 'bg-zinc-800 text-zinc-200' : 'bg-zinc-200 text-zinc-600 font-mono'
                  }`}
                >
                  {count}
                </span>
              </button>
            );
          })}
          {decisionFilter !== 'ALL' && (
            <button
              onClick={() => setDecisionFilter('ALL')}
              className="text-[11px] text-zinc-500 hover:text-black underline ml-1 cursor-pointer"
            >
              Reset filter
            </button>
          )}
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
                    <div
                      onClick={() => setSelectedDecisionRecord(record)}
                      className="cursor-pointer group flex items-center gap-1.5 hover:opacity-90 transition-transform hover:scale-105"
                      title="Click to inspect decision reasoning & policy audit"
                      role="button"
                      tabIndex={0}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          setSelectedDecisionRecord(record);
                        }
                      }}
                    >
                      <DecisionBadge decision={record.decision} size="sm" />
                      <span className="text-[10px] font-mono text-zinc-400 group-hover:text-black transition-colors hidden sm:inline">
                        Inspect ↗
                      </span>
                    </div>
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
                      <div
                        onClick={() => setSelectedDecisionRecord(record)}
                        className="cursor-pointer group inline-flex items-center gap-1.5 hover:opacity-90 transition-transform hover:scale-105"
                        title="Click to inspect decision reasoning & policy audit"
                        role="button"
                        tabIndex={0}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault();
                            setSelectedDecisionRecord(record);
                          }
                        }}
                      >
                        <DecisionBadge decision={record.decision} size="sm" />
                        <span className="text-[10px] font-mono text-zinc-400 group-hover:text-black transition-colors hidden xl:inline">
                          Inspect ↗
                        </span>
                      </div>
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

      {/* Interactive Decision Detail Inspector Modal */}
      {selectedDecisionRecord && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-md flex items-center justify-center p-4">
          <div className="glass-card max-w-xl w-full rounded-2xl p-6 border border-zinc-200 shadow-2xl space-y-4 bg-white/95 text-zinc-900 max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-start justify-between gap-4 border-b border-zinc-200 pb-3">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-bold text-zinc-900 uppercase tracking-wider">
                    Audit Decision Inspector
                  </h3>
                  <DecisionBadge decision={selectedDecisionRecord.decision} size="sm" />
                </div>
                <p className="text-xs text-zinc-500 font-mono">
                  Audit ID: {selectedDecisionRecord.audit_id} • Txn: {selectedDecisionRecord.transaction_id}
                </p>
              </div>
              <button
                onClick={() => setSelectedDecisionRecord(null)}
                className="p-1 rounded-lg text-zinc-400 hover:text-zinc-900 hover:bg-zinc-100 transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Decision Summary & Score Banner */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="p-3 rounded-xl bg-zinc-50 border border-zinc-200 flex flex-col items-center justify-center text-center">
                <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider mb-1">
                  Risk Score & Tier
                </span>
                <span className="text-2xl font-black text-zinc-900 font-mono">
                  {selectedDecisionRecord.risk_score}
                  <span className="text-xs text-zinc-500 font-normal">/100</span>
                </span>
                <span className="text-[10px] font-mono px-2 py-0.5 mt-1 rounded bg-zinc-200/80 text-zinc-800 font-semibold uppercase">
                  {selectedDecisionRecord.risk_class}
                </span>
              </div>

              <div className="sm:col-span-2 p-3 rounded-xl bg-zinc-50 border border-zinc-200 space-y-1">
                <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider block">
                  Dispatched Action & Status
                </span>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono font-bold text-zinc-900 uppercase">
                    {selectedDecisionRecord.action}
                  </span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-zinc-200 text-zinc-800 font-mono uppercase font-medium">
                    {selectedDecisionRecord.status}
                  </span>
                </div>
                <p className="text-[11px] text-zinc-600 pt-1">
                  Actor: Razorpay Copilot Pipeline ({selectedDecisionRecord.model_version})
                </p>
                <p className="text-[11px] text-zinc-500 font-mono">
                  Timestamp: {new Date(selectedDecisionRecord.timestamp).toLocaleString()}
                </p>
              </div>
            </div>

            {/* Rationale & Investigation Synthesis */}
            <div className="p-3 rounded-xl bg-zinc-50 border border-zinc-200 space-y-1.5">
              <span className="text-[10px] font-bold text-zinc-900 uppercase tracking-wider flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-zinc-700" />
                Autonomous Decision Rationale
              </span>
              <p className="text-xs text-zinc-700 leading-relaxed">
                {selectedDecisionRecord.investigation_summary || 'Evaluated deterministically across ML risk distribution and Razorpay compliance gates.'}
              </p>
            </div>

            {/* Policy Citations */}
            {selectedDecisionRecord.retrieved_policy_ids && selectedDecisionRecord.retrieved_policy_ids.length > 0 && (
              <div className="space-y-1.5">
                <span className="text-[10px] font-bold text-zinc-700 uppercase tracking-wider block">
                  Cited Compliance Policy Clauses
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {selectedDecisionRecord.retrieved_policy_ids.map((pid, idx) => (
                    <span
                      key={idx}
                      className="px-2 py-1 rounded-md bg-zinc-100 text-zinc-900 border border-zinc-200 font-mono text-xs font-medium"
                    >
                      {pid}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Evaluated Rule Gates */}
            <div className="space-y-1.5">
              <span className="text-[10px] font-bold text-zinc-700 uppercase tracking-wider block">
                Deterministic Rule Evaluation
              </span>
              <div className="max-h-36 overflow-y-auto space-y-1 pr-1">
                {selectedDecisionRecord.rule_results && selectedDecisionRecord.rule_results.length > 0 ? (
                  selectedDecisionRecord.rule_results.map((r, i) => (
                    <div
                      key={i}
                      className={`p-2 rounded-lg text-[11px] border flex items-start justify-between gap-2 ${
                        r.triggered
                          ? 'bg-zinc-100 border-zinc-300 text-zinc-900'
                          : 'bg-white border-zinc-200/70 text-zinc-500'
                      }`}
                    >
                      <div>
                        <span className="font-mono font-bold block">{r.rule}</span>
                        <span className="text-zinc-600">{r.reason}</span>
                      </div>
                      <span
                        className={`text-[9px] font-mono font-bold px-1.5 py-0.5 rounded shrink-0 uppercase ${
                          r.triggered ? 'bg-black text-white' : 'bg-zinc-100 text-zinc-400'
                        }`}
                      >
                        {r.triggered ? `TRIPPED (+${r.risk_points}pts)` : 'PASSED'}
                      </span>
                    </div>
                  ))
                ) : (
                  <span className="text-xs text-zinc-400 font-mono">No deterministic rule results recorded.</span>
                )}
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-2 pt-2 border-t border-zinc-200">
              <button
                onClick={() => {
                  setDecisionFilter(selectedDecisionRecord.decision as any);
                  setSelectedDecisionRecord(null);
                }}
                className="w-full sm:w-auto h-8 px-3 rounded-xl bg-zinc-100 hover:bg-zinc-200 text-zinc-700 font-medium text-xs transition flex items-center justify-center gap-1.5"
              >
                <Filter className="w-3 h-3 text-zinc-500" />
                <span>Filter ledger for {selectedDecisionRecord.decision}</span>
              </button>

              <div className="flex items-center gap-2 w-full sm:w-auto">
                {onSelectTransaction && (
                  <button
                    onClick={() => {
                      const txPayload = selectedDecisionRecord.raw_payload ? {
                        ...selectedDecisionRecord.raw_payload,
                        transaction_id: selectedDecisionRecord.transaction_id,
                      } : {
                        transaction_id: selectedDecisionRecord.transaction_id,
                        risk_score: selectedDecisionRecord.risk_score,
                        risk_class: selectedDecisionRecord.risk_class,
                        decision: selectedDecisionRecord.decision,
                      };
                      onSelectTransaction(txPayload);
                      setSelectedDecisionRecord(null);
                    }}
                    className="w-full sm:w-auto h-8 px-3.5 rounded-xl bg-black hover:bg-zinc-800 text-white font-semibold text-xs transition flex items-center justify-center gap-1.5 shadow-xs"
                  >
                    <span>Launch Live Investigation</span>
                    <ExternalLink className="w-3 h-3" />
                  </button>
                )}
                <button
                  onClick={() => setSelectedDecisionRecord(null)}
                  className="w-full sm:w-auto h-8 px-3 rounded-xl bg-zinc-200 hover:bg-zinc-300 text-zinc-800 font-medium text-xs transition"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
