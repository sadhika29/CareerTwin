"""
Security & Prompt Injection Defense utilities for CareerTwin AI components.
Protects AI workflows against prompt injections, system prompt leak attempts,
and malicious instructions embedded within untrusted candidate resumes or job descriptions.
"""
from __future__ import annotations

import re


INJECTION_PATTERNS = [
    r"(?i)\bignore\s+(all\s+)?(previous|prior|above)\s+(instructions|prompts|rules|commands)\b",
    r"(?i)\bdisregard\s+(all\s+)?(previous|prior|above)\s+(instructions|prompts|rules)\b",
    r"(?i)\byou\s+are\s+now\s+(an?\s+)?(unrestricted|jailbroken|dan|system|admin)\b",
    r"(?i)\b(system\s+prompt|developer\s+mode|jailbreak)\s*:\s*",
    r"(?i)\boutput\s+(the\s+)?(full\s+)?(system\s+prompt|secret\s+key|api\s+key)\b",
    r"(?i)\bpretend\s+you\s+have\s+no\s+(rules|limits|safety|instructions)\b",
]


def detect_prompt_injection(text: str) -> bool:
    """Check if the provided text contains known prompt injection signatures."""
    if not text:
        return False
    return any(re.search(pat, text) for pat in INJECTION_PATTERNS)


def sanitize_untrusted_text(text: str) -> str:
    """
    Sanitize untrusted text before embedding it into LLM prompts.
    Neutralizes prompt injection directives while preserving legitimate technical content.
    """
    if not text:
        return ""

    sanitized = text
    for pat in INJECTION_PATTERNS:
        sanitized = re.sub(pat, "[BLOCKED_INSTRUCTION]", sanitized)

    return sanitized


def wrap_untrusted_document(label: str, content: str) -> str:
    """
    Wrap an untrusted document (resume, job description, or external query)
    in clear data boundary tags so the LLM treats it strictly as passive data.
    """
    safe_content = sanitize_untrusted_text(content)
    return f"<{label}_DATA>\n{safe_content}\n</{label}_DATA>"
