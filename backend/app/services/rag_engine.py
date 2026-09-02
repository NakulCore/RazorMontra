import re
from pathlib import Path
from typing import List, Dict, Any, Optional
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity

from backend.app.core.config import settings
from backend.app.models.schemas import PolicyClause

class PolicyRAGEngine:
    def __init__(self, policy_dir: Optional[Path] = None):
        self.policy_dir = policy_dir or settings.POLICY_DIR
        self.clauses: List[PolicyClause] = []
        self.vectorizer: Optional[TfidfVectorizer] = None
        self.tfidf_matrix = None
        self.load_and_index_policies()

    def load_and_index_policies(self):
        """
        Ingests markdown policy documents from the policy directory, parses clauses,
        and constructs an in-memory TF-IDF semantic vector index.
        """
        self.clauses = []
        if self.policy_dir and self.policy_dir.exists():
            for file_path in self.policy_dir.glob("*.md"):
                try:
                    content = file_path.read_text(encoding="utf-8")
                    self._parse_policy_document(file_path.stem, content)
                except Exception as e:
                    print(f"Error loading policy file {file_path}: {e}")

        # If no policy files found or empty, load hardcoded default policies
        if not self.clauses:
            self._load_fallback_policies()

        # Build TF-IDF vector matrix
        corpus = [f"{c.title} {c.category} {c.text}" for c in self.clauses]
        self.vectorizer = TfidfVectorizer(
            ngram_range=(1, 2),
            stop_words="english",
            max_features=2000
        )
        self.tfidf_matrix = self.vectorizer.fit_transform(corpus)

    def _parse_policy_document(self, stem: str, content: str):
        # Split document by top-level or second-level headings
        sections = re.split(r'\n(?=#+ )', content)
        
        for idx, sec in enumerate(sections):
            sec = sec.strip()
            if not sec:
                continue

            lines = sec.split('\n')
            title = lines[0].replace("#", "").strip() if lines else f"Policy Section {idx+1}"
            text = "\n".join(lines[1:]).strip() if len(lines) > 1 else title

            # Extract policy ID if present
            policy_id_match = re.search(r'(RPAY-POL-\d+)', title) or re.search(r'(RPAY-POL-\d+)', stem)
            policy_id = policy_id_match.group(1) if policy_id_match else f"RPAY-POL-{idx+100}"
            if len(sections) > 1 and policy_id_match:
                policy_id = f"{policy_id}-S{idx+1}"

            # Infer category
            title_lower = title.lower()
            if "velocity" in title_lower or "rate" in title_lower:
                category = "VELOCITY_CONTROL"
            elif "value" in title_lower or "amount" in title_lower:
                category = "TRANSACTION_LIMITS"
            elif "device" in title_lower:
                category = "DEVICE_SECURITY"
            elif "geographic" in title_lower or "cross-border" in title_lower:
                category = "GEOGRAPHIC_COMPLIANCE"
            elif "verification" in title_lower or "2fa" in title_lower or "step-up" in title_lower:
                category = "AUTHENTICATION_STANDARDS"
            elif "chargeback" in title_lower or "dispute" in title_lower:
                category = "DISPUTE_RISK"
            elif "escalat" in title_lower or "freeze" in title_lower:
                category = "EMERGENCY_ESCALATION"
            else:
                category = "GENERAL_RISK"

            self.clauses.append(PolicyClause(
                policy_id=policy_id,
                title=title,
                category=category,
                text=text,
                relevance_score=1.0
            ))

    def _load_fallback_policies(self):
        self.clauses = [
            PolicyClause(
                policy_id="RPAY-POL-101",
                title="High-Value & Extreme Amount Review",
                category="TRANSACTION_LIMITS",
                text="Transactions exceeding INR 50,000 or >3.5x customer historical average require step-up verification or manual flagging.",
                relevance_score=1.0
            ),
            PolicyClause(
                policy_id="RPAY-POL-102",
                title="High-Velocity Rate Limiting Protocol",
                category="VELOCITY_CONTROL",
                text=">=4 transactions within 10 minutes require flagging and temporary rate limiting to protect against bot attacks.",
                relevance_score=1.0
            ),
            PolicyClause(
                policy_id="RPAY-POL-103",
                title="New Device Binding Security",
                category="DEVICE_SECURITY",
                text="New device unrecognized on customer profile with age <= 3 days requires step-up OTP challenge.",
                relevance_score=1.0
            ),
            PolicyClause(
                policy_id="RPAY-POL-104",
                title="Geographic Anomaly & Cross-Border Compliance",
                category="GEOGRAPHIC_COMPLIANCE",
                text="IP country discrepancy with customer home country requires verification or risk escalation.",
                relevance_score=1.0
            )
        ]

    def search(self, query: str, top_k: int = 3) -> List[PolicyClause]:
        """
        Retrieves the top-k most relevant policy clauses matching the query string.
        """
        if not self.clauses or self.vectorizer is None or self.tfidf_matrix is None:
            return self.clauses[:top_k]

        query_vector = self.vectorizer.transform([query])
        similarities = cosine_similarity(query_vector, self.tfidf_matrix).flatten()

        # Get top-k indices
        top_indices = similarities.argsort()[::-1][:top_k]
        
        results: List[PolicyClause] = []
        for idx in top_indices:
            score = float(similarities[idx])
            clause = self.clauses[idx]
            # Normalize relevance score to 0.0 - 1.0
            rel_score = max(0.25, round(score, 3)) if score > 0 else 0.20
            results.append(PolicyClause(
                policy_id=clause.policy_id,
                title=clause.title,
                category=clause.category,
                text=clause.text,
                relevance_score=rel_score
            ))

        return results

    def retrieve_for_transaction(self, transaction: Dict[str, Any], risk_factors: List[str]) -> List[PolicyClause]:
        """
        Constructs an enriched contextual query from transaction anomalies and retrieves applicable policies.
        """
        query_terms = [
            f"amount {transaction.get('amount', 0)}",
            f"currency {transaction.get('currency', 'INR')}",
            f"ip country {transaction.get('ip_country', '')}",
            f"customer country {transaction.get('customer_country', '')}",
            f"velocity {transaction.get('transactions_last_10_minutes', 0)} 10 minutes",
            f"new device {transaction.get('new_device', False)}",
            f"failed attempts {transaction.get('previous_failed_transactions', 0)}",
            f"chargeback history {transaction.get('chargeback_history', 0)}"
        ] + risk_factors

        full_query = " ".join(query_terms)
        return self.search(full_query, top_k=3)

rag_engine = PolicyRAGEngine()
