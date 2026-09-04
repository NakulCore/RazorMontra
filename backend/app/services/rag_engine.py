import re
from pathlib import Path
from typing import List, Dict, Any, Optional
import numpy as np
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity

from backend.app.core.config import settings
from backend.app.models.schemas import PolicyClause

# Domain-specific fintech & fraud prevention synonyms and semantic concepts
FINTECH_SYNONYMS: Dict[str, List[str]] = {
    "geo": ["geographic", "cross-border", "location", "ip", "country", "foreign", "vpn", "tor", "roaming"],
    "geography": ["geographic", "cross-border", "location", "foreign", "ip country"],
    "geographic": ["geo", "cross-border", "location", "country", "foreign", "ip"],
    "location": ["geographic", "ip", "country", "foreign", "cross-border", "roaming"],
    "foreign": ["geographic", "cross-border", "ip country", "international", "location"],
    "international": ["cross-border", "geographic", "foreign", "ip country"],
    "cross-border": ["international", "foreign", "geographic", "ip country", "aml"],
    "crossborder": ["cross-border", "international", "foreign", "geographic"],
    "border": ["cross-border", "international", "foreign"],
    "vpn": ["proxy", "tor", "cross-border", "geographic", "ip", "exit nodes"],
    "proxy": ["vpn", "tor", "geographic", "ip"],
    "tor": ["proxy", "vpn", "cross-border", "geographic", "exit nodes"],
    "velocity": ["rate limiting", "rapid", "burst", "frequency", "10 minutes", "attempts", "card cycling"],
    "burst": ["velocity", "rate limiting", "rapid", "attempts", "card cycling"],
    "frequency": ["velocity", "rate limiting", "rapid", "attempts"],
    "rapid": ["velocity", "burst", "card cycling", "attempts"],
    "rate": ["velocity", "rate limiting", "limit"],
    "limit": ["limits", "threshold", "rate limiting", "maximum", "amount"],
    "limits": ["threshold", "amount", "transaction limits", "velocity", "rate limiting"],
    "amount": ["high-value", "threshold", "value", "inr", "average", "deviation", "ticket"],
    "value": ["high-value", "amount", "ticket size", "deviation", "limits"],
    "large": ["high-value", "amount", "exceeding", "extreme", "limits"],
    "big": ["high-value", "amount", "exceeding", "extreme"],
    "expensive": ["high-value", "amount", "50000", "100000", "limits"],
    "extreme": ["high-value", "escalation", "deviation", "critical"],
    "device": ["fingerprint", "new device", "hardware", "token", "browser", "unrecognized", "binding"],
    "phone": ["device", "fingerprint", "hardware", "sms", "otp"],
    "laptop": ["device", "fingerprint", "browser", "hardware"],
    "mobile": ["device", "fingerprint", "sms", "otp", "binding"],
    "fingerprint": ["device", "browser", "hardware", "binding", "user-agent"],
    "browser": ["device", "fingerprint", "user-agent", "hardware"],
    "token": ["hardware", "device", "binding", "challenge"],
    "ato": ["account takeover", "new device", "credential dump", "binding"],
    "takeover": ["account takeover", "new device", "unrecognized", "binding"],
    "stolen": ["account takeover", "chargeback", "dispute", "card testing", "fraud"],
    "stolen card": ["chargeback", "dispute", "card testing", "fraud", "unauthorized"],
    "unauthorized": ["chargeback", "dispute", "fraud", "takeover"],
    "fraud": ["risk", "chargeback", "escalation", "card testing", "takeover", "botnet"],
    "scam": ["fraud", "chargeback", "escalation"],
    "otp": ["step-up", "verification", "2fa", "authentication", "challenge", "sms"],
    "2fa": ["step-up", "otp", "verification", "authentication", "3ds", "challenge"],
    "3ds": ["verification", "step-up", "authentication", "otp", "challenge"],
    "step-up": ["verification", "3ds", "otp", "challenge", "authentication"],
    "stepup": ["step-up", "verification", "3ds", "otp", "challenge"],
    "verify": ["verification", "step-up", "3ds", "otp", "challenge"],
    "verification": ["step-up", "3ds", "otp", "verify", "challenge", "authentication"],
    "challenge": ["step-up", "verification", "otp", "3ds"],
    "chargeback": ["dispute", "recidivist", "vfmp", "ecp", "visa", "mastercard"],
    "chargebacks": ["chargeback", "dispute", "recidivist", "vfmp", "ecp"],
    "dispute": ["chargeback", "recidivist", "vfmp", "ecp", "disputes"],
    "disputes": ["chargeback", "dispute", "recidivist", "vfmp", "ecp"],
    "recidivist": ["chargeback", "dispute", "customer dispute history"],
    "escalate": ["escalation", "quarantine", "freeze", "critical", "halt settlement"],
    "escalation": ["escalate", "quarantine", "freeze", "critical", "halt settlement"],
    "freeze": ["escalate", "quarantine", "halt settlement"],
    "quarantine": ["escalate", "freeze", "halt settlement", "watchlist", "24-hour"],
    "critical": ["escalation", "escalate", "quarantine", "risk score 90"],
    "bot": ["botnet", "card testing", "automated", "script", "velocity"],
    "bots": ["bot", "botnet", "card testing", "automated"],
    "botnet": ["card testing", "bot", "automated", "micro-authorizations", "cvv"],
    "card testing": ["botnet", "enumeration", "micro-authorizations", "cvv", "failed pin"],
    "testing": ["card testing", "botnet", "enumeration", "cvv"],
    "script": ["bot", "botnet", "card testing", "automated"],
    "enumeration": ["card testing", "cvv", "expiry", "botnet"],
    "cvv": ["card testing", "failed attempts", "enumeration", "botnet"],
    "pin": ["failed attempts", "cvv", "card testing"],
    "failed": ["previous failed", "authorization failure", "cvv", "errors"],
    "failure": ["failed", "authorization failures", "errors"],
    "reject": ["flag", "escalate", "block"],
    "block": ["halt settlement", "escalate", "quarantine", "flag"],
}

KNOWN_POLICY_CATEGORIES: Dict[str, str] = {
    "RPAY-POL-101": "TRANSACTION_LIMITS",
    "RPAY-POL-102": "VELOCITY_CONTROL",
    "RPAY-POL-103": "DEVICE_SECURITY",
    "RPAY-POL-104": "GEOGRAPHIC_COMPLIANCE",
    "RPAY-POL-105": "AUTHENTICATION_STANDARDS",
    "RPAY-POL-106": "DISPUTE_RISK",
    "RPAY-POL-107": "EMERGENCY_ESCALATION",
    "RPAY-POL-108": "GENERAL_RISK",
}

def normalize_text(text: str) -> str:
    """
    Normalizes numbers, currencies, and punctuation to enhance vector/lexical match fidelity.
    """
    if not text:
        return ""
    # Normalize numbers with commas: 50,000 -> 50000
    text = re.sub(r"(\d+),(\d+)", r"\1\2", text)
    # Strip currency symbols and decimals: ₹ -> INR, .00 -> ""
    text = text.replace("₹", "INR ")
    text = re.sub(r"\.00\b", "", text)
    return text

def stem_token(token: str) -> str:
    """
    Lightweight suffix stemmer for English financial & fraud terms.
    """
    t = token.lower()
    if len(t) <= 3:
        return t
    if t.endswith("ing") and len(t) > 5:
        return t[:-3]
    if t.endswith("ed") and len(t) > 4:
        return t[:-2]
    if t.endswith("es") and len(t) > 4:
        return t[:-2]
    if t.endswith("s") and len(t) > 3 and not t.endswith("ss"):
        return t[:-1]
    if t.endswith("tion") and len(t) > 6:
        return t[:-4]
    return t

class PolicyRAGEngine:
    def __init__(self, policy_dir: Optional[Path] = None):
        self.policy_dir = policy_dir or settings.POLICY_DIR
        self.clauses: List[PolicyClause] = []
        self.word_vectorizer: Optional[TfidfVectorizer] = None
        self.char_vectorizer: Optional[TfidfVectorizer] = None
        self.word_matrix = None
        self.char_matrix = None
        self.load_and_index_policies()

    def load_and_index_policies(self):
        """
        Ingests markdown policy documents, parses complete policies and clauses,
        and constructs hybrid word + subword character TF-IDF vector indexes.
        """
        self.clauses = []
        if self.policy_dir and self.policy_dir.exists():
            for file_path in sorted(self.policy_dir.glob("*.md")):
                try:
                    content = file_path.read_text(encoding="utf-8")
                    self._parse_policy_document(file_path.stem, content)
                except Exception as e:
                    print(f"Error loading policy file {file_path}: {e}")

        # If no policy files found or empty, load hardcoded default policies
        if not self.clauses:
            self._load_fallback_policies()

        # Build dual-channel TF-IDF vector index (Word n-grams + Subword Character n-grams)
        corpus = [normalize_text(f"{c.policy_id} {c.title} {c.category} {c.text}") for c in self.clauses]

        self.word_vectorizer = TfidfVectorizer(
            ngram_range=(1, 2),
            stop_words="english",
            sublinear_tf=True,
            token_pattern=r"(?u)\b[a-zA-Z0-9-]+\b",
            max_features=2500
        )
        self.char_vectorizer = TfidfVectorizer(
            analyzer="char_wb",
            ngram_range=(3, 5),
            sublinear_tf=True,
            max_features=4000
        )

        self.word_matrix = self.word_vectorizer.fit_transform(corpus)
        self.char_matrix = self.char_vectorizer.fit_transform(corpus)

    def _parse_policy_document(self, stem: str, content: str):
        """
        Parses top-level policy blocks from markdown files.
        Handles both individual policy files and combined multi-policy documents.
        """
        # Split by top-level H1 policy headers: # RPAY-POL-XXX
        blocks = re.split(r"(?m)(?=^# RPAY-POL-\d+)", content)
        if len(blocks) <= 1:
            blocks = re.split(r"(?m)(?=^# )", content)

        for idx, block in enumerate(blocks):
            block = block.strip()
            if not block:
                continue

            lines = block.split("\n")
            header_line = lines[0].strip()
            body = "\n".join(lines[1:]).strip()

            # Extract policy ID
            policy_id_match = re.search(r"(RPAY-POL-\d+)", header_line) or re.search(r"(RPAY-POL-\d+)", stem)
            policy_id = policy_id_match.group(1) if policy_id_match else f"RPAY-POL-{idx+101}"

            # Extract clean title
            raw_title = re.sub(r"^#\s*(RPAY-POL-\d+:\s*)?", "", header_line).strip()
            title = raw_title if raw_title else f"Policy Protocol {policy_id}"

            # Determine category
            category = KNOWN_POLICY_CATEGORIES.get(policy_id)
            if not category:
                title_lower = (title + " " + body).lower()
                if "velocity" in title_lower or "rate limit" in title_lower:
                    category = "VELOCITY_CONTROL"
                elif "high-value" in title_lower or "amount" in title_lower or "ticket" in title_lower:
                    category = "TRANSACTION_LIMITS"
                elif "device" in title_lower or "fingerprint" in title_lower:
                    category = "DEVICE_SECURITY"
                elif "geographic" in title_lower or "cross-border" in title_lower:
                    category = "GEOGRAPHIC_COMPLIANCE"
                elif "step-up" in title_lower or "authentication" in title_lower or "verification" in title_lower:
                    category = "AUTHENTICATION_STANDARDS"
                elif "chargeback" in title_lower or "recidivist" in title_lower or "dispute" in title_lower:
                    category = "DISPUTE_RISK"
                elif "escalation" in title_lower or "quarantine" in title_lower:
                    category = "EMERGENCY_ESCALATION"
                else:
                    category = "GENERAL_RISK"

            self.clauses.append(PolicyClause(
                policy_id=policy_id,
                title=title,
                category=category,
                text=body if body else title,
                relevance_score=1.0
            ))

    def _load_fallback_policies(self):
        """
        Loads the 8 canonical Razorpay compliance and risk policy protocols.
        """
        self.clauses = [
            PolicyClause(
                policy_id="RPAY-POL-101",
                title="High-Value Transaction Review Protocol",
                category="TRANSACTION_LIMITS",
                text="## 1. Scope and Objective\nThis policy governs risk management procedures for high-value and anomalous ticket-size payment requests processed through the Razorpay Payment Gateway.\n\n## 2. Policy Thresholds\n- Absolute Value Threshold: Any transaction exceeding INR 50,000.00 is designated as a High-Value Transaction (HVT).\n- Deviation Threshold: Any transaction exceeding 3.5x of the customer's historical 90-day moving average must trigger an automated risk assessment.\n\n## 3. Mandatory Actions\n1. If the ML Risk Score is between 40 and 74, enforce mandatory Step-Up Authentication (OTP/3DS 2.0).\n2. If the ML Risk Score is >= 75 and multiple anomalous factors are present (e.g., new device + foreign IP), the transaction must be flagged (FLAG) or escalated (ESCALATE) for manual risk analyst review.\n3. Transactions exceeding INR 100,000.00 from newly registered accounts (< 7 days old) must not be auto-approved without secondary KYC verification.",
                relevance_score=1.0
            ),
            PolicyClause(
                policy_id="RPAY-POL-102",
                title="Velocity & Rate Limiting Mitigation Policy",
                category="VELOCITY_CONTROL",
                text="## 1. Scope\nApplies to real-time burst traffic, card cycling, and rapid automated payment submissions.\n\n## 2. Velocity Triggers\n- 10-Minute Velocity: >= 4 transaction attempts from the same customer ID, device, or IP block within a 10-minute window.\n- 60-Minute Velocity: >= 7 transaction attempts in 1 hour.\n\n## 3. Enforcement Guidelines\n- When a velocity trigger fires in combination with failed authorization attempts, the transaction must be flagged (FLAG).\n- When velocity >= 6 attempts in 10 minutes with repeated authorization failures, immediately escalate (ESCALATE) and temporarily rate-limit the client fingerprint.",
                relevance_score=1.0
            ),
            PolicyClause(
                policy_id="RPAY-POL-103",
                title="New Device Fingerprint & Account Takeover Prevention",
                category="DEVICE_SECURITY",
                text="## 1. Scope\nCovers device hardware tokens, browser fingerprints, and new device bindings on existing merchant customer accounts.\n\n## 2. Risk Indicators\n- Device age <= 3 days on an established account (> 60 days old).\n- Rapid session initiation on unknown user-agent string.\n\n## 3. Decision Framework\n- If a new device is accompanied by a routine transaction value (<= customer baseline), request step-up 2FA verification (VERIFY).\n- If a new device is paired with amount deviation > 3.0x or geographic location mismatch, flag (FLAG) and freeze payment until biometric or SMS OTP confirmation is complete.",
                relevance_score=1.0
            ),
            PolicyClause(
                policy_id="RPAY-POL-104",
                title="Geographic Anomalies & Cross-Border Compliance",
                category="GEOGRAPHIC_COMPLIANCE",
                text="## 1. Scope\nGoverns IP geolocation discrepancies, proxy/VPN usage, and foreign card issuance rules.\n\n## 2. Geo Mismatch Criteria\n- Initiating IP Country differs from Customer Home Country and Merchant Country.\n- High-risk transit routes or TOR exit nodes.\n\n## 3. Policy Execution\n- If IP country is foreign but amount is small (< INR 2,000) and customer has international transaction history, request verification (VERIFY).\n- If cross-border transaction value exceeds INR 20,000 without prior international history, escalate (ESCALATE) or flag (FLAG) to avoid cross-border chargebacks and AML non-compliance.",
                relevance_score=1.0
            ),
            PolicyClause(
                policy_id="RPAY-POL-105",
                title="Step-Up Authentication & Verification Protocol",
                category="AUTHENTICATION_STANDARDS",
                text="## 1. Scope\nDefines when passive friction-free checkout must be upgraded to active customer challenge.\n\n## 2. Trigger Conditions\n- Risk score in Medium Risk band (40 to 74).\n- First time payment using newly saved payment instrument.\n- Minor location deviation (domestic roaming).\n\n## 3. Protocol\n- Dispatch asynchronous OTP / 3DS challenge token (request_verification).\n- Merchant checkout holds session for 120 seconds awaiting verified callback.\n- On challenge pass, transaction state transitions to APPROVE. On challenge failure or timeout, transition to FLAG.",
                relevance_score=1.0
            ),
            PolicyClause(
                policy_id="RPAY-POL-106",
                title="Chargeback Mitigation & Recidivist Handling",
                category="DISPUTE_RISK",
                text="## 1. Objective\nProtect merchants from card network dispute thresholds (Visa VFMP / Mastercard ECP programs).\n\n## 2. Customer Dispute History\n- Accounts with 1 historical chargeback: Enforce mandatory 3DS verification (VERIFY) on all transactions regardless of amount.\n- Accounts with >= 2 historical chargebacks: Transactions above INR 5,000 must be immediately flagged (FLAG) or escalated (ESCALATE).",
                relevance_score=1.0
            ),
            PolicyClause(
                policy_id="RPAY-POL-107",
                title="High-Risk Escalation & Account Quarantine Protocol",
                category="EMERGENCY_ESCALATION",
                text="## 1. Objective\nStandard operating procedures for imminent fraud threats, credential dumps, and multi-signal attacks.\n\n## 2. Escalation Criteria\n- Risk Score >= 90 (Critical).\n- Co-occurrence of 3 or more high-severity rule violations.\n- Extreme velocity (> 8 txns in 10 minutes) with repeated failed payments.\n\n## 3. Mandatory Actions\n- Immediate execution of escalate action to halt settlement.\n- Dispatch webhook to merchant security desk.\n- Add device fingerprint and IP hash to temporary 24-hour quarantine watchlist.",
                relevance_score=1.0
            ),
            PolicyClause(
                policy_id="RPAY-POL-108",
                title="Card Testing & Botnet Defense Policy",
                category="GENERAL_RISK",
                text="## 1. Objective\nMitigate automated card testing scripts (enumeration of CVV/expiry dates through micro-authorizations).\n\n## 2. Detection Patterns\n- Rapid sequence of low-value attempts (< INR 200) followed by a high-value payment attempt.\n- More than 3 failed CVV/PIN errors within a 15-minute sliding window.\n\n## 3. Action\n- Block current transaction session and enforce FLAG / ESCALATE action.",
                relevance_score=1.0
            )
        ]

    def _expand_query(self, query: str) -> str:
        """
        Enriches user search queries with domain synonyms, stemmed variants, and intent terms.
        """
        norm_q = normalize_text(query)
        tokens = re.findall(r"\b[a-zA-Z0-9-]+\b", norm_q.lower())
        expanded = list(tokens)

        for tok in tokens:
            st = stem_token(tok)
            if st != tok:
                expanded.append(st)
            if tok in FINTECH_SYNONYMS:
                expanded.extend(FINTECH_SYNONYMS[tok])
            if st in FINTECH_SYNONYMS:
                expanded.extend(FINTECH_SYNONYMS[st])

        return " ".join(expanded)

    def search(self, query: str, top_k: int = 4) -> List[PolicyClause]:
        """
        Retrieves top-k most relevant policy clauses matching the query string using
        hybrid semantic vector similarity, domain synonym expansion, and lexical matching.
        """
        if not self.clauses:
            return []

        if not query or not query.strip():
            return [
                PolicyClause(
                    policy_id=c.policy_id,
                    title=c.title,
                    category=c.category,
                    text=c.text,
                    relevance_score=1.0
                )
                for c in self.clauses[:top_k]
            ]

        if self.word_vectorizer is None or self.char_vectorizer is None or self.word_matrix is None:
            return self.clauses[:top_k]

        q_norm = normalize_text(query)
        q_expanded = self._expand_query(q_norm)

        # 1. Dual TF-IDF Vector Cosine Similarities
        w_sim = cosine_similarity(self.word_vectorizer.transform([q_expanded]), self.word_matrix).flatten()
        c_sim = cosine_similarity(self.char_vectorizer.transform([q_expanded]), self.char_matrix).flatten()
        scores = 0.60 * w_sim + 0.40 * c_sim

        # 2. Precision Lexical & Semantic Feature Boosts
        q_tokens = [t.lower() for t in re.findall(r"\b[a-zA-Z0-9-]+\b", q_norm)]
        q_stems = [stem_token(t) for t in q_tokens]
        q_lower = q_norm.lower()

        stop_words = {"what", "how", "if", "a", "an", "the", "is", "are", "to", "for", "in", "with", "of", "and", "or"}

        for idx, clause in enumerate(self.clauses):
            c_text_norm = normalize_text(clause.text).lower()
            c_title_norm = clause.title.lower()
            c_id_lower = clause.policy_id.lower()
            c_num = clause.policy_id.replace("RPAY-POL-", "")

            # Exact Policy ID boost
            if c_id_lower in q_lower or (len(c_num) >= 3 and c_num in q_tokens):
                scores[idx] += 0.55

            # Category match boost
            cat_words = clause.category.lower().split("_")
            if all(cw in q_lower for cw in cat_words):
                scores[idx] += 0.35

            # Full title substring match
            if q_lower in c_title_norm or c_title_norm in q_lower:
                scores[idx] += 0.30

            # Lexical keyword and number matching
            token_hits = 0.0
            for tok, st in zip(q_tokens, q_stems):
                if tok in stop_words:
                    continue
                if tok in c_title_norm or st in c_title_norm:
                    token_hits += 2.0
                elif tok in c_text_norm or st in c_text_norm:
                    token_hits += 1.0

            if token_hits > 0:
                scores[idx] += min(0.35, token_hits * 0.08)

        # Rank by score descending
        ranked_indices = np.argsort(scores)[::-1]
        results: List[PolicyClause] = []

        for idx in ranked_indices:
            raw_score = float(scores[idx])
            # Filter out policies that have negligible relevance
            if raw_score <= 0.15:
                continue

            calibrated_score = round(min(0.98, max(0.30, raw_score * 1.15)), 2)
            clause = self.clauses[idx]
            results.append(PolicyClause(
                policy_id=clause.policy_id,
                title=clause.title,
                category=clause.category,
                text=clause.text,
                relevance_score=calibrated_score
            ))

        return results[:top_k]

    def retrieve_for_transaction(self, transaction: Dict[str, Any], risk_factors: List[str]) -> List[PolicyClause]:
        """
        Constructs an enriched contextual query from transaction anomalies and retrieves applicable policies.
        """
        amount = float(transaction.get("amount", 0.0))
        tx_10m = int(transaction.get("transactions_last_10_minutes", 0))
        ip_country = transaction.get("ip_country", "")
        cust_country = transaction.get("customer_country", "")
        new_dev = bool(transaction.get("new_device", False))
        chargeback_hist = int(transaction.get("chargeback_history", 0))
        failed_txns = int(transaction.get("previous_failed_transactions", 0))

        query_terms = []
        if amount >= 50000:
            query_terms.append(f"amount {amount} high-value transaction review limits threshold exceeding 50000")
        elif amount > 20000:
            query_terms.append(f"amount {amount} transaction value threshold limits")

        if tx_10m >= 4:
            query_terms.append(f"velocity {tx_10m} transactions in 10 minutes rapid burst rate limiting card cycling")

        if new_dev:
            query_terms.append("new device binding unrecognized fingerprint account takeover")

        if ip_country and cust_country and ip_country != cust_country:
            query_terms.append(f"geographic cross-border location discrepancy IP {ip_country} country {cust_country} proxy vpn")

        if chargeback_hist > 0:
            query_terms.append(f"chargeback history {chargeback_hist} dispute recidivist mitigation")

        if failed_txns >= 2:
            query_terms.append(f"failed authorization attempts {failed_txns} card testing botnet defense")

        query_terms.extend(risk_factors)

        if not query_terms:
            query_terms.append("frictionless checkout normal baseline authentication")

        full_query = " ".join(query_terms)
        results = self.search(full_query, top_k=3)
        if not results:
            return self.clauses[:3]
        return results

rag_engine = PolicyRAGEngine()

