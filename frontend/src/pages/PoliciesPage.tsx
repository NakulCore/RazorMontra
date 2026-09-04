import React, { useState, useMemo } from 'react';
import { PolicyClause } from '../types';
import { searchPolicies, fetchPolicies } from '../services/api';
import {
  BookOpen,
  Search,
  Sparkles,
  Shield,
  FileText,
  X,
  ExternalLink,
  Layers,
  Filter,
  CheckCircle2,
  ArrowRight,
  ShieldCheck,
  Scale
} from 'lucide-react';

interface PoliciesPageProps {
  initialPolicies: PolicyClause[];
}

const CATEGORY_DISPLAY_NAMES: Record<string, string> = {
  ALL: 'All Policies',
  VELOCITY_CONTROL: 'Velocity Control',
  TRANSACTION_LIMITS: 'Transaction Limits',
  DEVICE_SECURITY: 'Device Security',
  GEOGRAPHIC_COMPLIANCE: 'Geo Compliance',
  AUTHENTICATION_STANDARDS: 'Auth Standards',
  DISPUTE_RISK: 'Dispute Risk',
  EMERGENCY_ESCALATION: 'Emergency Escalation',
  GENERAL_RISK: 'General Risk',
};

function formatPreviewText(text: string): string {
  if (!text) return '';
  return text
    .replace(/#{1,6}\s+/g, '')
    .replace(/\*\*(.*?)\*\*/g, '$1')
    .replace(/\*(.*?)\*/g, '$1')
    .replace(/`([^`]+)`/g, '$1')
    .replace(/^\s*[-*+]\s+/gm, '• ')
    .trim();
}

export const PoliciesPage: React.FC<PoliciesPageProps> = ({ initialPolicies }) => {
  const [query, setQuery] = useState('');
  const [policies, setPolicies] = useState<PolicyClause[]>(initialPolicies);
  const [searching, setSearching] = useState(false);
  const [activeCategory, setActiveCategory] = useState<string>('ALL');
  const [selectedPolicy, setSelectedPolicy] = useState<PolicyClause | null>(null);

  // Synchronize when parent data loads or fetch if empty
  React.useEffect(() => {
    if (initialPolicies && initialPolicies.length > 0) {
      setPolicies(initialPolicies);
    } else {
      fetchPolicies()
        .then((res) => {
          if (res && res.length > 0) setPolicies(res);
        })
        .catch(() => {});
    }
  }, [initialPolicies]);

  // Compute available categories dynamically based on policies
  const availableCategories = useMemo(() => {
    const cats = new Set<string>(['ALL']);
    policies.forEach((p) => {
      if (p.category) cats.add(p.category);
    });
    return Array.from(cats);
  }, [policies]);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) {
      setPolicies(initialPolicies.length > 0 ? initialPolicies : policies);
      return;
    }
    setSearching(true);
    try {
      const results = await searchPolicies(query, 25);
      setPolicies(results);
    } catch (err: any) {
      console.error('Failed to search policies:', err);
    } finally {
      setSearching(false);
    }
  };

  const handleClear = () => {
    setQuery('');
    setPolicies(initialPolicies);
  };

  const filteredPolicies = useMemo(() => {
    if (activeCategory === 'ALL') return policies;
    return policies.filter((p) => p.category === activeCategory);
  }, [policies, activeCategory]);

  return (
    <div className="space-y-6">
      {/* Header & Semantic Search Bar */}
      <div className="glass-card rounded-2xl p-5 sm:p-6 border border-zinc-200/80 space-y-4">
        <div>
          <div className="flex items-center space-x-2">
            <BookOpen className="w-4 h-4 text-zinc-900 shrink-0" />
            <h1 className="text-lg sm:text-xl font-bold text-zinc-900 tracking-tight">
              RAG Policy Knowledge Base & Compliance Library
            </h1>
          </div>
          <p className="text-xs text-zinc-600 mt-1 max-w-3xl leading-relaxed">
            Vectorized fintech compliance policies retrieved by the autonomous agent to ground risk scoring, 3DS step-up verification, and escalation decisions in official Razorpay protocols.
          </p>
        </div>

        {/* Semantic Search Input */}
        <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-2.5">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              placeholder="Search policies by scenario, keyword, or rule (e.g. 'cross-border velocity', 'device verification')..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-full pl-9 pr-9 h-9.5 rounded-xl bg-white border border-zinc-200 text-xs text-zinc-900 placeholder-zinc-400 focus:outline-none focus:border-black shadow-2xs transition"
            />
            {query && (
              <button
                type="button"
                onClick={handleClear}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-900 p-1"
                aria-label="Clear search query"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
          <button
            type="submit"
            disabled={searching}
            className="h-9.5 px-4 rounded-xl bg-black hover:bg-zinc-800 text-white font-semibold text-xs transition shrink-0 flex items-center justify-center gap-1.5 shadow-xs disabled:opacity-50 active:scale-98"
          >
            <Sparkles className="w-3.5 h-3.5 text-white" />
            <span>{searching ? 'Querying Index...' : 'Semantic Search'}</span>
          </button>
        </form>

        {/* Category Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pt-1 pb-1 text-[11px] [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
          {availableCategories.map((cat) => {
            const count = cat === 'ALL' ? policies.length : policies.filter((p) => p.category === cat).length;
            const label = CATEGORY_DISPLAY_NAMES[cat] || cat.replace(/_/g, ' ');
            const isActive = activeCategory === cat;
            return (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`h-7 px-3 rounded-lg text-[11px] font-medium shrink-0 transition-all flex items-center gap-1.5 ${
                  isActive
                    ? 'bg-black text-white font-semibold shadow-xs'
                    : 'bg-zinc-100 text-zinc-600 hover:text-zinc-900 hover:bg-zinc-200/80'
                }`}
              >
                <span>{label}</span>
                <span className={`text-[10px] px-1 py-0.2 rounded font-mono ${isActive ? 'bg-zinc-800 text-white' : 'bg-zinc-200 text-zinc-600'}`}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Results Header */}
      <div className="flex items-center justify-between text-xs px-1 text-zinc-500">
        <span className="font-medium">
          Showing <strong className="text-zinc-900">{filteredPolicies.length}</strong> policy clauses
        </span>
        <div className="flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block" />
          <span className="font-mono text-zinc-600 text-[11px]">TF-IDF Index Synced</span>
        </div>
      </div>

      {/* Policies Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4.5">
        {filteredPolicies.map((pol) => {
          const previewText = formatPreviewText(pol.text);
          const categoryLabel = CATEGORY_DISPLAY_NAMES[pol.category] || pol.category.replace(/_/g, ' ');
          const isSearchMatch = pol.relevance_score !== undefined && pol.relevance_score < 1.0;

          return (
            <div
              key={pol.policy_id}
              onClick={() => setSelectedPolicy(pol)}
              className="glass-card-interactive rounded-2xl p-5 flex flex-col justify-between cursor-pointer group border border-zinc-200/80 hover:border-zinc-300 transition-all shadow-xs h-full"
            >
              {/* Card Header */}
              <div className="space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-mono text-[10px] font-bold px-2 py-0.5 rounded-md bg-zinc-100 text-zinc-800 border border-zinc-200/90 tracking-wide shrink-0">
                    {pol.policy_id}
                  </span>

                  <div className="flex items-center gap-1.5 overflow-hidden">
                    {isSearchMatch && (
                      <span className="font-mono text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200 shrink-0">
                        {Math.round((pol.relevance_score || 0) * 100)}% Match
                      </span>
                    )}
                    <span className="text-[10px] font-medium text-zinc-500 bg-zinc-50 border border-zinc-200/60 px-2 py-0.5 rounded-md truncate">
                      {categoryLabel}
                    </span>
                  </div>
                </div>

                {/* Card Title */}
                <div>
                  <h3 className="font-bold text-zinc-900 text-sm leading-snug group-hover:text-black transition-colors line-clamp-2 min-h-[2.5rem] flex items-start">
                    {pol.title}
                  </h3>
                </div>

                {/* Body Text Snippet */}
                <div className="text-xs text-zinc-600 leading-relaxed line-clamp-3 min-h-[3.75rem] border-l-2 border-zinc-200 pl-2.5 py-0.5">
                  {previewText || pol.title}
                </div>
              </div>

              {/* Card Footer */}
              <div className="mt-4 pt-3 border-t border-zinc-100 flex items-center justify-between text-[11px] text-zinc-500">
                <div className="flex items-center gap-1.5 text-zinc-500">
                  <ShieldCheck className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
                  <span className="text-[11px] font-medium">Enforced by Bounded Engine</span>
                </div>
                <span className="font-semibold text-zinc-900 group-hover:translate-x-0.5 transition-transform flex items-center gap-1 text-[11px]">
                  <span>Inspect</span>
                  <ArrowRight className="w-3 h-3 text-zinc-900" />
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {filteredPolicies.length === 0 && (
        <div className="glass-card rounded-2xl p-12 text-center text-zinc-500 space-y-3 border border-zinc-200">
          <BookOpen className="w-8 h-8 text-zinc-400 mx-auto" />
          <p className="text-sm font-semibold text-zinc-800">No policy clauses matched your filter or search query.</p>
          <button
            onClick={handleClear}
            className="px-3.5 py-1.5 rounded-xl bg-black text-white text-xs font-semibold hover:bg-zinc-800 transition"
          >
            Reset Filters
          </button>
        </div>
      )}

      {/* Policy Modal Detail */}
      {selectedPolicy && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/40 backdrop-blur-md"
          onClick={() => setSelectedPolicy(null)}
        >
          <div
            className="glass-card max-w-2xl w-full border border-zinc-200 rounded-2xl p-6 sm:p-7 shadow-2xl space-y-5 bg-white text-zinc-900 max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-zinc-100 pb-4">
              <div className="flex items-center gap-2.5">
                <span className="font-mono text-xs font-bold px-2.5 py-1 rounded-md bg-zinc-100 text-zinc-900 border border-zinc-200">
                  {selectedPolicy.policy_id}
                </span>
                <span className="text-xs font-medium text-zinc-500 px-2.5 py-1 rounded-md bg-zinc-50 border border-zinc-200/80">
                  {CATEGORY_DISPLAY_NAMES[selectedPolicy.category] || selectedPolicy.category}
                </span>
              </div>
              <button
                onClick={() => setSelectedPolicy(null)}
                className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-900 hover:bg-zinc-100 transition"
                title="Close Modal"
                aria-label="Close policy details"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Title */}
            <div>
              <h2 className="text-lg sm:text-xl font-bold text-zinc-900 tracking-tight leading-snug">
                {selectedPolicy.title}
              </h2>
            </div>

            {/* Policy Content */}
            <div className="p-4 sm:p-5 rounded-xl bg-zinc-50 border border-zinc-200 text-xs sm:text-sm text-zinc-800 leading-relaxed whitespace-pre-line font-sans">
              {formatPreviewText(selectedPolicy.text)}
            </div>

            {/* Modal Footer */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 text-xs text-zinc-500 pt-3 border-t border-zinc-100">
              <div className="flex items-center gap-2">
                <Scale className="w-4 h-4 text-zinc-400" />
                <span>Regulatory Grounding: Razorpay Merchant Risk Protocols</span>
              </div>
              {selectedPolicy.relevance_score !== undefined && (
                <span className="font-mono text-zinc-900 font-bold bg-zinc-100 px-2 py-0.5 rounded border border-zinc-200 text-[11px]">
                  Semantic Relevance: {(selectedPolicy.relevance_score * 100).toFixed(0)}%
                </span>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PoliciesPage;
