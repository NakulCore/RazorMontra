import {
  ComprehensiveRiskAnalysis,
  Transaction,
  PolicyClause,
  AuditRecord,
  SystemOverviewMetrics,
  DemoScenario
} from '../types';

const API_BASE = '/api/v1';

export async function fetchSystemMetrics(): Promise<SystemOverviewMetrics> {
  const res = await fetch(`${API_BASE}/metrics`);
  if (!res.ok) throw new Error('Failed to fetch metrics');
  return res.json();
}

export async function fetchTransactions(limit = 50, offset = 0, isFraud?: boolean): Promise<Transaction[]> {
  let url = `${API_BASE}/transactions?limit=${limit}&offset=${offset}`;
  if (isFraud !== undefined) url += `&is_fraud_only=${isFraud}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error('Failed to fetch transactions');
  return res.json();
}

export async function analyzeTransaction(payload: Partial<Transaction>, autoExecute = true): Promise<ComprehensiveRiskAnalysis> {
  const res = await fetch(`${API_BASE}/risk/analyze?auto_execute=${autoExecute}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: 'Analysis failed' }));
    throw new Error(err.detail || 'Analysis failed');
  }
  return res.json();
}

export async function fetchPolicies(): Promise<PolicyClause[]> {
  const res = await fetch(`${API_BASE}/policies`);
  if (!res.ok) throw new Error('Failed to fetch policies');
  return res.json();
}

export async function searchPolicies(query: string, top_k = 4): Promise<PolicyClause[]> {
  const res = await fetch(`${API_BASE}/policies/search`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query, top_k }),
  });
  if (!res.ok) throw new Error('Failed to search policies');
  return res.json();
}

export async function fetchAuditTrail(limit = 50): Promise<AuditRecord[]> {
  const res = await fetch(`${API_BASE}/audit?limit=${limit}`);
  if (!res.ok) throw new Error('Failed to fetch audit records');
  return res.json();
}

export async function fetchDemoScenarios(): Promise<Record<string, DemoScenario>> {
  const res = await fetch(`${API_BASE}/demo/scenarios`);
  if (!res.ok) throw new Error('Failed to fetch demo scenarios');
  return res.json();
}

export async function seedDemoData(count = 50): Promise<{ message: string; count: number }> {
  const res = await fetch(`${API_BASE}/demo/seed?count=${count}`, { method: 'POST' });
  if (!res.ok) throw new Error('Failed to seed demo data');
  return res.json();
}
