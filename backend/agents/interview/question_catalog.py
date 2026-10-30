"""Small, source-attributed interview pattern catalogue.

Entries paraphrase public reports or refer to established study plans. They do
not claim that generated practice prompts were asked verbatim by an employer.
Adapters intentionally expose public discovery links only; they do not scrape
login-gated pages or copy question banks.
"""
from __future__ import annotations

from datetime import datetime, timezone
from typing import Any

CATALOG_RESEARCHED_AT = "2026-10-30"

QUESTION_PATTERNS: list[dict[str, Any]] = [
    {
        "id": "leetcode-backend-intern-experience-2026",
        "topic": "Clarify requirements, design an approach, implement it, and validate edge cases under interview time constraints.",
        "role_tags": ["backend", "software engineer", "intern"],
        "format_tags": ["technical", "coding", "scenario", "mixed"],
        "difficulty": "medium",
        "source_platform": "LeetCode Discuss",
        "source_url": "https://leetcode.com/discuss/post/8361736/my-backend-intern-interview-experience-a-jxzi/",
        "source_kind": "candidate_report",
        "company": None,
        "published_at": None,
        "confidence": "candidate-reported; company not identified in catalogue",
    },
    {
        "id": "leetcode-top-interview-150",
        "topic": "Practice canonical array, string, tree, graph, and dynamic-programming patterns, then explain complexity and edge cases.",
        "role_tags": ["software engineer", "developer", "data analyst"],
        "format_tags": ["technical", "coding", "multiple_choice", "mixed"],
        "difficulty": "medium",
        "source_platform": "LeetCode Study Plan",
        "source_url": "https://leetcode.com/studyplan/top-interview-150/",
        "source_kind": "public_problem_set",
        "company": None,
        "published_at": None,
        "confidence": "established public study plan; practice pattern only",
    },
    {
        "id": "developersindia-fresher-interviews",
        "topic": "Entry-level technical interviews can combine fundamentals, problem solving, and discussion of practical engineering experience.",
        "role_tags": ["fresher", "software engineer", "full stack", "backend"],
        "format_tags": ["technical", "behavioral", "mixed"],
        "difficulty": "easy",
        "source_platform": "Reddit r/developersIndia",
        "source_url": "https://www.reddit.com/r/developersIndia/comments/1u22jt8/how_do_you_take_an_interview_of_a_fresher_for/",
        "source_kind": "community_discussion",
        "company": None,
        "published_at": None,
        "confidence": "community discussion; anecdotal, not an employer claim",
    },
]

PUBLIC_SOURCE_ADAPTERS = [
    {"platform": "LeetCode Discuss", "kind": "public_link_only", "url": "https://leetcode.com/discuss/interview-experience/"},
    {"platform": "LeetCode Study Plan", "kind": "public_link_only", "url": "https://leetcode.com/studyplan/top-interview-150/"},
    {"platform": "Reddit developersIndia", "kind": "public_link_only", "url": "https://www.reddit.com/r/developersIndia/"},
    {"platform": "Reddit cscareerquestions", "kind": "public_link_only", "url": "https://www.reddit.com/r/cscareerquestions/"},
    {"platform": "Prepfully", "kind": "public_link_only", "url": "https://prepfully.com/interview-questions"},
    {"platform": "Glassdoor", "kind": "public_link_only", "url": "https://www.glassdoor.co.in/Interview/index.htm"},
]


def matching_patterns(role: str, interview_format: str) -> list[dict[str, Any]]:
    """Return applicable paraphrased research patterns with retrieval metadata."""
    role_text = role.lower()
    format_text = interview_format.lower().replace("-", "_")
    matches = []
    for source in QUESTION_PATTERNS:
        role_match = any(tag in role_text for tag in source["role_tags"]) or "software" in role_text
        format_match = format_text in source["format_tags"] or format_text == "company_specific"
        if role_match and format_match:
            matches.append({
                **source,
                "target_role": role,
                "interview_format": interview_format,
                "catalog_researched_at": CATALOG_RESEARCHED_AT,
                "catalog_matched_at": datetime.now(timezone.utc).isoformat(),
                "attribution": "Use only as an attributed pattern; generated questions are original practice prompts.",
            })
    return matches
