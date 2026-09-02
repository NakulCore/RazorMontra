import React, { useState } from 'react';
import { PolicyClause } from '../types';
import { searchPolicies } from '../services/api';
import { BookOpen, Search, Sparkles, Tag, Shield } from 'lucide-react';

interface PoliciesPageProps {
  initialPolicies: PolicyClause[];
}

export const PoliciesPage: React.FC<PoliciesPageProps> = ({ initialPolicies }) => {
  const [query, setQuery] = useState('');
  const [policies, setPolicies] = useState<PolicyClause[]>(initialPolicies);
  const [searching, setSearching] = useState(false);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) {
      setPolicies(initialPolicies);
      return;
    }
    setSearching(true);
    try {
      const results = await searchPolicies(query, 6);
      setPolicies(results);
    } catch (err: any) {
      console.error(err);
    } finally {
      setSearching(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header & Search */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-purple-950/50 via-[#131d36] to-slate-900 border border-purple-500/20 shadow-xl space-y-4">
        <div>
          <div className="flex items-center space-x-2">
            <BookOpen className="w-5 h-5 text-purple-400" />
            <h2 className="text-xl font-extrabold text-white tracking-tight">RAG Policy Knowledge Base</h2>
          </div>
          <p className="text-xs text-slate-300 mt-1">
            Enterprise risk policies governing transaction thresholds, velocity boundaries, device verification, and escalation standards.
          </p>
        </div>

        {/* Semantic Search Bar */}
        <form onSubmit={handleSearch} className="flex gap-2">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search policies by keyword or scenario (e.g. 'international chargebacks', 'velocity burst')..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-900/90 border border-slate-700 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-500 shadow-inner"
            />
          </div>
          <button
            type="submit"
            disabled={searching}
            className="px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-semibold text-xs transition shadow-lg shadow-purple-600/20 shrink-0"
          >
            {searching ? 'Querying...' : 'Semantic Search'}
          </button>
        </form>
      </div>

      {/* Policy Clauses Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {policies.map((pol) => (
          <div
            key={pol.policy_id}
            className="p-5 rounded-2xl bg-[#0f172a] border border-slate-800 hover:border-purple-500/30 transition flex flex-col justify-between space-y-3 shadow-sm"
          >
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="mono-font text-xs font-mono font-bold px-2.5 py-1 rounded bg-purple-500/10 text-purple-300 border border-purple-500/20">
                  {pol.policy_id}
                </span>
                <span className="text-[10px] uppercase tracking-wider font-semibold px-2 py-0.5 rounded bg-slate-800 text-slate-400">
                  {pol.category}
                </span>
              </div>

              <h3 className="font-bold text-white text-sm">{pol.title}</h3>
              <p className="text-xs text-slate-300 leading-relaxed whitespace-pre-line">{pol.text}</p>
            </div>

            {pol.relevance_score !== undefined && (
              <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400">
                <span className="flex items-center gap-1">
                  <Shield className="w-3.5 h-3.5 text-purple-400" />
                  <span>Enforced by Bounded Decision Agent</span>
                </span>
                <span className="font-mono text-purple-300">Score: {(pol.relevance_score * 100).toFixed(0)}%</span>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};
