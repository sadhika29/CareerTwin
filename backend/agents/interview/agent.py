"""
InterviewAgent — Generates role-specific mock interview questions and
evaluates answers using AI with robust deterministic fallbacks.
"""
from __future__ import annotations

import json
import re
import uuid
from typing import Any, Dict, List, Optional

from .prompts import (
    INTERVIEW_SYSTEM_PROMPT,
    build_interview_evaluation_prompt,
    build_interview_question_prompt,
)


class InterviewAgent:
    """Agent responsible for conducting AI-driven mock interviews and evaluating answers."""

    def __init__(self, llm_client=None):
        if llm_client is None:
            try:
                from backend.services.llm_service import LLMService
                self.llm_client = LLMService()
            except Exception:
                self.llm_client = None
        else:
            self.llm_client = llm_client

    def generate_questions(
        self,
        target_role: str = "Software Engineer",
        round_type: str = "technical",
        count: int = 5,
        skills: Optional[List[str]] = None,
        difficulty: str = "medium",
        company: Optional[str] = None,
    ) -> List[Dict[str, Any]]:
        """Generate structured interview questions via LLM or deterministic fallback."""
        if self.llm_client is not None:
            prompt = build_interview_question_prompt(
                target_role=target_role,
                round_type=round_type,
                count=count,
                difficulty=difficulty,
                skills=skills,
                company=company,
            )
            try:
                raw_response = self.llm_client.generate_json(
                    system_prompt=INTERVIEW_SYSTEM_PROMPT,
                    prompt=prompt,
                )
                if isinstance(raw_response, str):
                    raw_clean = re.sub(r"^```(?:json)?\s*", "", raw_response.strip(), flags=re.IGNORECASE)
                    raw_clean = re.sub(r"\s*```$", "", raw_clean)
                    parsed = json.loads(raw_clean)
                elif isinstance(raw_response, dict):
                    parsed = raw_response
                else:
                    parsed = {}

                questions = parsed.get("questions", [])
                if questions and isinstance(questions, list):
                    return questions[:count]
            except Exception:
                pass

        # Robust Fallback Question Generation based on role and skills
        return self._generate_fallback_questions(target_role, round_type, count, skills, difficulty)

    def evaluate_answer(
        self,
        question: str,
        candidate_answer: str,
        target_role: str = "Software Engineer",
        question_type: str = "technical",
        expected_key_points: Optional[List[str]] = None,
        correct_option: Optional[str] = None,
        selected_option: Optional[str] = None,
        explanation: Optional[str] = None,
    ) -> Dict[str, Any]:
        """Evaluate a candidate's answer with scores, strengths, and coaching tips."""
        # Handle MCQ selection directly if provided
        if selected_option and correct_option:
            sel = selected_option.strip().upper()[:1]
            corr = correct_option.strip().upper()[:1]
            is_correct = (sel == corr)
            score = 100.0 if is_correct else 35.0
            return {
                "overall_score": score,
                "accuracy_score": score,
                "completeness_score": 100.0 if is_correct else 40.0,
                "clarity_score": 100.0,
                "is_correct": is_correct,
                "selected_option": selected_option,
                "correct_option": correct_option,
                "strengths": [
                    f"Correctly identified option {corr} with accurate algorithmic reasoning." if is_correct else "Selected candidate option and analyzed system trade-offs."
                ],
                "areas_to_improve": [
                    "Continue practicing real-world code constraints and edge cases." if is_correct else f"Option {corr} was the optimal choice. Review: {explanation or 'Review the core algorithmic trade-offs.'}"
                ],
                "ideal_answer": f"Option {corr}: {explanation or 'Standard industry benchmark'}",
                "feedback_summary": "Spot-on answer!" if is_correct else f"Incorrect selection. Option {corr} is the expected solution.",
            }

        if not candidate_answer or not candidate_answer.strip():
            return {
                "overall_score": 0.0,
                "accuracy_score": 0.0,
                "completeness_score": 0.0,
                "clarity_score": 0.0,
                "strengths": [],
                "areas_to_improve": ["No answer was provided."],
                "ideal_answer": "Provide a structured response using the STAR method or technical reasoning.",
                "feedback_summary": "Empty answer received.",
            }

        if self.llm_client is not None:
            prompt = build_interview_evaluation_prompt(
                question=question,
                candidate_answer=candidate_answer,
                target_role=target_role,
                question_type=question_type,
                expected_key_points=expected_key_points,
            )
            try:
                raw_response = self.llm_client.generate_json(
                    system_prompt=INTERVIEW_SYSTEM_PROMPT,
                    prompt=prompt,
                )
                if isinstance(raw_response, str):
                    raw_clean = re.sub(r"^```(?:json)?\s*", "", raw_response.strip(), flags=re.IGNORECASE)
                    raw_clean = re.sub(r"\s*```$", "", raw_clean)
                    parsed = json.loads(raw_clean)
                elif isinstance(raw_response, dict):
                    parsed = raw_response
                else:
                    parsed = {}

                if "overall_score" in parsed:
                    return parsed
            except Exception:
                pass

        # Deterministic Evaluation Fallback
        word_count = len(candidate_answer.split())
        base_score = min(85.0, max(40.0, word_count * 1.5))
        return {
            "overall_score": round(base_score, 1),
            "accuracy_score": round(base_score, 1),
            "completeness_score": round(min(100.0, base_score + 5.0), 1),
            "clarity_score": round(min(100.0, base_score + 10.0), 1),
            "strengths": [
                "Answer addresses the question prompt directly.",
                "Demonstrates foundational grasp of key concepts.",
            ],
            "areas_to_improve": [
                "Include concrete trade-offs, edge cases, and quantifiable results.",
                "Structure technical answers with architectural context and time/space complexity.",
            ],
            "ideal_answer": f"For {target_role}, clearly articulate problem constraints, trade-offs, and design patterns.",
            "feedback_summary": "Good conceptual understanding; deepen your explanations with implementation details.",
        }

    def _generate_fallback_questions(
        self,
        target_role: str,
        round_type: str,
        count: int,
        skills: Optional[List[str]],
        difficulty: str,
    ) -> List[Dict[str, Any]]:
        bank = {
            "technical": [
                {
                    "question_id": f"q_{uuid.uuid4().hex[:6]}",
                    "question": "What is the time complexity and worst-case recursion stack space of the following quickselect implementation for finding the k-th smallest element?",
                    "code_snippet": "def quickselect(nums, k):\n    pivot = nums[len(nums) // 2]\n    lows = [x for x in nums if x < pivot]\n    highs = [x for x in nums if x > pivot]\n    pivots = [x for x in nums if x == pivot]\n    if k < len(lows):\n        return quickselect(lows, k)\n    elif k < len(lows) + len(pivots):\n        return pivots[0]\n    else:\n        return quickselect(highs, k - len(lows) - len(pivots))",
                    "options": [
                        "A) Average O(N) time and worst-case O(N) auxiliary space",
                        "B) Average O(N log N) time and worst-case O(1) space",
                        "C) Average O(N^2) time and O(N) space",
                        "D) Worst-case O(log N) time and O(log N) space",
                        "E) Always O(1) time and O(N) space",
                    ],
                    "correct_option": "A",
                    "explanation": "Quickselect partitions the array each step, yielding average time T(N) = N + N/2 + N/4 + ... = O(N). Because list comprehensions allocate new sub-arrays, the worst-case space is O(N).",
                    "category": "Data Structures & Algorithms",
                    "expected_key_points": ["Average O(N) master theorem", "Worst case O(N^2) if bad pivot", "Sublist allocation space cost"],
                    "difficulty": difficulty,
                },
                {
                    "question_id": f"q_{uuid.uuid4().hex[:6]}",
                    "question": "In a distributed system handling high write volumes, which strategy best mitigates the write-amplification penalty of secondary B-Tree indexing?",
                    "code_snippet": "-- Relational table with heavy INSERT rates\nCREATE TABLE events (\n    id BIGSERIAL PRIMARY KEY,\n    device_id VARCHAR(64),\n    payload JSONB,\n    created_at TIMESTAMP\n);\n-- How to index created_at & device_id efficiently without killing ingest throughput?",
                    "options": [
                        "A) Replace B-Tree indices with Log-Structured Merge (LSM) trees or append-only write buffering",
                        "B) Create a hash index on every queried column",
                        "C) Disable WAL (Write-Ahead Logging) globally",
                        "D) Convert all transactions to SERIALIZABLE isolation level",
                        "E) Use SQLite in-memory tables without persistence",
                    ],
                    "correct_option": "A",
                    "explanation": "LSM trees transform random disk writes into sequential batch writes, substantially lowering write-amplification compared to modifying B-Tree pages on disk for every insert.",
                    "category": "Databases & Storage",
                    "expected_key_points": ["LSM trees batch sequential I/O", "B-Tree random write cost", "Write buffering queues"],
                    "difficulty": difficulty,
                },
                {
                    "question_id": f"q_{uuid.uuid4().hex[:6]}",
                    "question": "What is the primary bug or performance anti-pattern in the following asynchronous FastAPI endpoint?",
                    "code_snippet": "@router.get('/data')\nasync def get_analytics():\n    # Computationally expensive CPU-bound task\n    result = sum(i * i for i in range(50_000_000))\n    return {'result': result}",
                    "options": [
                        "A) Heavy synchronous CPU-bound operations in an async route block the main event loop for all concurrent requests",
                        "B) FastAPI routes cannot return JSON dictionaries",
                        "C) The range() function is deprecated in Python 3.12+",
                        "D) Decorator @router.get must be replaced with @app.post",
                        "E) There is no bug; async automatically spawns background OS threads for all CPU work",
                    ],
                    "correct_option": "A",
                    "explanation": "In an async def endpoint, CPU-heavy synchronous computations block Python's single asyncio event loop, freezing all other incoming requests. It should be offloaded to run_in_threadpool or a Celery background worker.",
                    "category": "Concurrency & Web Architecture",
                    "expected_key_points": ["Blocking the event loop", "Use run_in_threadpool or multiprocessing", "Async I/O vs CPU bound"],
                    "difficulty": difficulty,
                },
                {
                    "question_id": f"q_{uuid.uuid4().hex[:6]}",
                    "question": "How does React 18+ handle automatic batching for state updates initiated inside asynchronous callbacks or setTimeout?",
                    "code_snippet": "function handleClick() {\n  setTimeout(() => {\n    setCount(c => c + 1);\n    setFlag(f => !f);\n    // How many re-renders occur here in React 18?\n  }, 1000);\n}",
                    "options": [
                        "A) Exactly 1 re-render because React 18 batches state updates even inside timeouts, promises, and native events",
                        "B) Exactly 2 separate re-renders because setTimeout escapes React's batching mechanism",
                        "C) React throws an Uncaught Synchronous Batch Error",
                        "D) Zero re-renders because updates inside setTimeout are completely ignored",
                        "E) Infinite re-renders unless flushSync is invoked",
                    ],
                    "correct_option": "A",
                    "explanation": "Prior to React 18, state updates inside promises or timeouts triggered separate re-renders. React 18 introduced Automatic Batching across all events, timeouts, and promises, resulting in only 1 render.",
                    "category": "Frontend Architecture & React",
                    "expected_key_points": ["React 18 automatic batching", "Single render pass", "flushSync override if needed"],
                    "difficulty": difficulty,
                },
                {
                    "question_id": f"q_{uuid.uuid4().hex[:6]}",
                    "question": "Which algorithm is best suited for implementing rate limiting across multiple independent server instances with low latency and bounded memory?",
                    "code_snippet": "// Distributed Redis Rate Limiter\n// Goal: Allow 100 requests per minute per IP across a cluster of 10 microservice pods\n// Need: Minimal race conditions, zero synchronization drift",
                    "options": [
                        "A) Sliding Window Counter using Redis sorted sets (ZSET) or token bucket Lua scripts",
                        "B) Linear regression extrapolation",
                        "C) Storing an unbounded in-memory array of timestamps in each pod's local RAM",
                        "D) SHA-256 cryptographic proof-of-work",
                        "E) Polling an external MySQL table every 10 milliseconds",
                    ],
                    "correct_option": "A",
                    "explanation": "Redis ZSETs or atomic Token Bucket Lua scripts allow accurate sliding window tracking with minimal memory and sub-millisecond evaluation across distributed application instances.",
                    "category": "Distributed Systems",
                    "expected_key_points": ["Atomic Redis Lua execution", "Sliding window precision", "Elimination of boundary spikes"],
                    "difficulty": difficulty,
                },
            ],
            "behavioral": [
                {
                    "question_id": f"q_{uuid.uuid4().hex[:6]}",
                    "question": "When facing a high-severity production outage where root cause is initially uncertain, what is the most effective STAR-aligned incident response protocol?",
                    "code_snippet": "",
                    "options": [
                        "A) Immediately rollback the last deployment to restore service, establish an incident commander, and communicate transparent status updates before deep-dive RCA",
                        "B) Start rewriting the codebase from scratch on the main branch",
                        "C) Silence monitoring alerts to reduce noise while debugging",
                        "D) Blame the junior engineer who pushed the last commit in public channels",
                        "E) Wait until the next business day to investigate",
                    ],
                    "correct_option": "A",
                    "explanation": "In production incidents, prioritizing mitigation (rollback/failover), designating an incident commander, and transparent stakeholder communication take precedence before conducting a blameless post-mortem.",
                    "category": "Incident Response & Leadership",
                    "expected_key_points": ["Mitigate before debugging", "Designate Incident Commander", "Blameless post-mortem"],
                    "difficulty": difficulty,
                },
                {
                    "question_id": f"q_{uuid.uuid4().hex[:6]}",
                    "question": "A senior team member insists on adopting an unproven new library that could delay a critical release. How do you constructively handle this technical disagreement?",
                    "code_snippet": "",
                    "options": [
                        "A) Propose a time-boxed spike / benchmark against project requirements and trade-offs, then align on data-driven criteria with stakeholders",
                        "B) Refuse to speak to them until they concede",
                        "C) Escalate immediately to the CEO without discussing it first",
                        "D) Silently sabotage their pull request",
                        "E) Accept the unproven library without any investigation",
                    ],
                    "correct_option": "A",
                    "explanation": "Data-driven evaluation via a time-boxed prototype or benchmark allows objective evaluation of risk, performance, and maintenance overhead without personal conflict.",
                    "category": "Collaboration & Conflict Resolution",
                    "expected_key_points": ["Objective criteria and spikes", "Aligning on project deadlines and risks", "Disagree and commit culture"],
                    "difficulty": difficulty,
                },
            ],
        }
        selected = bank.get(round_type.lower(), bank["technical"])
        while len(selected) < count:
            selected.append({
                "question_id": f"q_{uuid.uuid4().hex[:6]}",
                "question": f"In {target_role} production environments, what is the best practice for managing secrets and API keys securely across environments?",
                "code_snippet": "",
                "options": [
                    "A) Use centralized secret managers (e.g. AWS Secrets Manager, HashiCorp Vault) injected at runtime via environment variables",
                    "B) Hardcode secrets directly inside Git source code files",
                    "C) Email plain text keys to teammates whenever needed",
                    "D) Store all keys in a public Google Drive spreadsheet",
                    "E) Encode keys in base64 inside frontend client bundles",
                ],
                "correct_option": "A",
                "explanation": "Hardcoded or client-exposed secrets pose extreme security vulnerabilities. Industry standard mandates centralized secret vaults with role-based IAM and automated rotation.",
                "category": "Security & Architecture",
                "expected_key_points": ["Secret managers / Vault", "IAM least privilege", "Runtime environment injection"],
                "difficulty": difficulty,
            })
        return selected[:count]

    def to_career_manager_envelope(self, score: float, session_data: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        """Format interview evaluation response for Career Manager contract."""
        return {
            "agent": "interview",
            "status": "success",
            "data": {
                "interview_score": round(score, 1),
                "session": session_data or {},
            },
        }
