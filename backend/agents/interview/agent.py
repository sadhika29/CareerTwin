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
        experience_level: str = "intermediate",
        job_description: Optional[str] = None,
        resume_context: Optional[str] = None,
        research_patterns: Optional[List[Dict[str, Any]]] = None,
        asked_questions: Optional[List[str]] = None,
        previous_answer: Optional[str] = None,
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
                experience_level=experience_level,
                job_description=job_description,
                resume_context=resume_context,
                research_patterns=research_patterns,
                asked_questions=asked_questions,
                previous_answer=previous_answer,
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
                    usable = [q for q in questions if isinstance(q, dict) and str(q.get("question", "")).strip()]
                    if usable:
                        asked = {str(question).strip().casefold() for question in (asked_questions or [])}
                        usable = [q for q in usable if str(q["question"]).strip().casefold() not in asked]
                        if usable and (round_type != "multiple_choice" or self._valid_multiple_choice(usable[0])):
                            return self._annotate_question_sources(usable[:count], research_patterns, "AI-generated original practice question")
            except Exception:
                pass

        # Original contextual fallback keeps the interview useful without an LLM.
        questions = self._generate_contextual_fallback_questions(
            target_role, round_type, count, difficulty, experience_level,
            company, job_description, resume_context, asked_questions, previous_answer,
        )
        return self._annotate_question_sources(questions, research_patterns, "CareerTwin fallback original practice question")

    @staticmethod
    def _annotate_question_sources(questions, research_patterns, origin):
        refs = [
            {"topic": p.get("topic"), "target_role": p.get("target_role"),
             "interview_format": p.get("interview_format"), "company": p.get("company"),
             "source_platform": p.get("source_platform"), "source_url": p.get("source_url"),
             "source_kind": p.get("source_kind"), "published_at": p.get("published_at"),
             "catalog_researched_at": p.get("catalog_researched_at"),
             "catalog_matched_at": p.get("catalog_matched_at"), "confidence": p.get("confidence")}
            for p in (research_patterns or [])
        ]
        for question in questions:
            question["origin"] = origin
            question["source_references"] = refs
        return questions

    @staticmethod
    def _valid_multiple_choice(question):
        options = question.get("options")
        correct = str(question.get("correct_option", "")).strip().upper()[:1]
        return isinstance(options, list) and len(options) >= 2 and correct in {"A", "B", "C", "D"}

    @staticmethod
    def _generate_contextual_fallback_questions(
        target_role, round_type, count, difficulty, experience_level,
        company=None, job_description=None, resume_context=None,
        asked_questions=None, previous_answer=None,
    ):
        fmt = str(round_type).lower()
        behavioral = fmt in {"behavioral", "hr", "hr_behavioral"}
        project_based = fmt in {"project", "resume_based"}
        coding = fmt == "coding"
        company_text = f" at {company}" if company else ""
        context = " Use the supplied job requirements and candidate background where relevant." if job_description or resume_context else " Do not assume any specific candidate project."
        if previous_answer:
            templates = [
                f"Your previous answer mentioned: {previous_answer[:180]}. What measurable result or trade-off supports that choice?{context}",
                f"Consider an edge case that could invalidate the approach in your previous answer. How would you detect and handle it?{context}",
                f"What would you change if the constraints in your previous answer doubled in scale?{context}",
            ]
        elif behavioral:
            templates = [
                "Tell me about a time you had to deliver under a tight deadline. How did you prioritize and what was the outcome?",
                "Describe a disagreement with a teammate about an approach. How did you resolve it?",
                "Tell me about a mistake or failed deliverable you owned. What did you communicate and change afterward?",
                "Give an example of learning an unfamiliar tool quickly to complete a task.",
                "Describe how you handled feedback that changed your original plan.",
            ]
        elif fmt == "scenario":
            templates = [
                f"A {target_role}{company_text} service starts returning intermittent 500 responses after a deployment. Walk through triage, mitigation, and root-cause analysis.",
                "A database query that worked in staging becomes slow at production scale. What evidence would you gather, and how would you improve it safely?",
                "Two requests update the same record at nearly the same time. Explain how you would prevent lost updates and preserve consistency.",
                "An external dependency begins timing out during a traffic spike. How would you protect the API and recover gracefully?",
                "A background worker's memory use grows over several hours. How would you isolate the cause and limit impact?",
            ]
        elif fmt == "multiple_choice":
            templates = ["Which approach best handles concurrent updates to the same API resource?", "Which design best prevents an external service outage from cascading through a backend API?", "Which data structure is appropriate for tracking the most recently used cache entries?", "Which technique is the best first step when a production SQL query becomes slow?"]
        elif project_based:
            templates = [
                "Choose a project from your selected resume. What problem did it solve, what did you personally implement, and how did you verify the result?",
                "Walk me through one architectural choice in a project you listed. What alternatives did you consider and why did you choose this one?",
                "Describe a difficult bug or limitation in one of your listed projects. How did you isolate it and what would you change now?",
                "If the project you listed had to serve ten times more users, what would you measure and improve first?",
                "Which part of a project listed in your resume did you own directly? How did you coordinate interfaces with other contributors?",
            ]
        elif coding:
            templates = [
                "Given a list of integers and a target, return the indices of two values whose sum equals the target. Explain complexity and duplicate handling.",
                "Given a string, find the length of its longest substring without repeated characters. Describe your invariant and edge cases.",
                "Design an LRU cache with get and put operations in average O(1) time. Explain the data structures and eviction behavior.",
                "Given a binary tree, return its level-order traversal and explain how you handle an empty tree.",
                "Given intervals, merge all overlapping ranges. Explain sorting, complexity, and boundary cases.",
            ]
        else:
            templates = [
                f"For a {target_role}{company_text} API, how would you validate input and return useful errors without exposing internals?{context}",
                "A SQL endpoint has become slow as its table grows. How would you inspect the query plan and choose an index?",
                "Explain how you would diagnose a race condition that appears only under concurrent requests.",
                "Design a reliable job-tracking API. Describe its data model, idempotency, and failure handling.",
                "How would you test a service that depends on a database and an unreliable external API?",
                "Compare optimistic and pessimistic concurrency control. When would you choose each?",
            ]
        asked = {str(q).strip().lower() for q in (asked_questions or [])}
        candidates = [q for q in templates if q.strip().lower() not in asked]
        if not candidates:
            candidates = templates
        result = []
        for index in range(count):
            question = candidates[index % len(candidates)]
            options = []
            correct_option = ""
            explanation = ""
            if fmt == "multiple_choice":
                options = [
                    "A) Use a concurrency-safe strategy appropriate to the data and consistency requirements",
                    "B) Disable validation and allow every request to write without coordination",
                    "C) Retry every operation indefinitely with no timeout or idempotency key",
                    "D) Store the value only in process memory and skip durable storage",
                ]
                correct_option = "A"
                explanation = "The safe choice preserves correctness while making coordination and failure behavior explicit; the exact implementation depends on the storage system and workload."
            result.append({
                "question_id": f"q_{uuid.uuid4().hex[:10]}",
                "question": question,
                "code_snippet": "" if not coding else "# Write your solution here",
                "options": options, "correct_option": correct_option, "explanation": explanation,
                "category": "Behavioral" if behavioral else "Project" if project_based else "Coding" if coding else "Scenario" if fmt == "scenario" else "Technical",
                "expected_key_points": ["Clarify constraints", "Explain trade-offs and edge cases"],
                "difficulty": difficulty,
                "experience_level": experience_level,
            })
        return result

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
                "evaluation_origin": "rule_based_multiple_choice",
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
            "evaluation_origin": "deterministic_fallback",
        }

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
