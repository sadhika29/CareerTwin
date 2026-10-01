"""
Preparation AI Agent for CareerTwin.
Replaces ALL hardcoded logic with LLM-generated responses.
Every assessment, recommendation, plan, and feedback is AI-powered.
"""
from __future__ import annotations

import json
import re
from typing import Any, Dict, List, Optional

from backend.services.llm_service import LLMService

from .prompts import (
    ASSESSMENT_GENERATION_SYSTEM_PROMPT,
    DIGITAL_TWIN_INSIGHT_SYSTEM_PROMPT,
    INTERVIEW_SYSTEM_PROMPT,
    PLANNER_SYSTEM_PROMPT,
    PREPARATION_RECOMMENDATION_SYSTEM_PROMPT,
    TODAY_TASKS_SYSTEM_PROMPT,
    WEAK_TOPICS_SYSTEM_PROMPT,
    build_assessment_generation_prompt,
    build_digital_twin_insight_prompt,
    build_interview_evaluation_prompt,
    build_interview_questions_prompt,
    build_planner_prompt,
    build_preparation_recommendation_prompt,
    build_today_tasks_prompt,
    build_weak_topics_prompt,
)


def _parse_json(raw: str) -> Any:
    """Strip markdown fences and parse JSON reliably."""
    cleaned = raw.strip()
    cleaned = re.sub(r"^```(?:json)?\s*", "", cleaned, flags=re.IGNORECASE)
    cleaned = re.sub(r"\s*```$", "", cleaned)
    return json.loads(cleaned.strip())


class PreparationAgent:
    """
    Master AI Agent for all preparation tasks in CareerTwin.
    Assessment generation, study plans, daily tasks, interview coaching,
    digital twin insights, planner, and weak topic analysis are all LLM-driven.
    """

    def __init__(self, llm_client: LLMService | None = None):
        self.llm = llm_client or LLMService()

    # -----------------------------------------------------------------------
    # ASSESSMENT GENERATION (LLM-powered)
    # -----------------------------------------------------------------------

    def generate_assessment(
        self,
        category: str,
        difficulty: str = "medium",
        count: int = 5,
        target_role: str | None = None,
        topic: str | None = None,
        skill_gaps: List[str] | None = None,
    ) -> List[Dict[str, Any]]:
        """Generate assessment questions entirely via LLM."""
        prompt = build_assessment_generation_prompt(
            category=category,
            difficulty=difficulty,
            count=count,
            target_role=target_role,
            topic=topic,
            skill_gaps=skill_gaps,
        )
        raw = self.llm.generate_json(
            system_prompt=ASSESSMENT_GENERATION_SYSTEM_PROMPT,
            prompt=prompt,
        )
        data = _parse_json(raw)
        if not isinstance(data, list):
            raise ValueError("LLM did not return a JSON array for assessment generation")
        # Ensure question_ids are unique and category is injected
        for i, q in enumerate(data):
            q.setdefault("question_id", f"{category.lower()}-ai-{i+1}")
            q.setdefault("category", category)
        return data

    # -----------------------------------------------------------------------
    # PREPARATION RECOMMENDATION (LLM-powered)
    # -----------------------------------------------------------------------

    def build_recommendation(
        self,
        target_role: str,
        skill_gaps: List[str] | None = None,
        current_skills: List[str] | None = None,
        previous_performance: Dict[str, Any] | None = None,
        available_time: int = 60,
        target_job: str | None = None,
    ) -> Dict[str, Any]:
        """Generate a personalised preparation plan entirely via LLM."""
        prompt = build_preparation_recommendation_prompt(
            target_role=target_role,
            skill_gaps=skill_gaps,
            current_skills=current_skills,
            previous_performance=previous_performance,
            available_time=available_time,
            target_job=target_job,
        )
        raw = self.llm.generate_json(
            system_prompt=PREPARATION_RECOMMENDATION_SYSTEM_PROMPT,
            prompt=prompt,
        )
        data = _parse_json(raw)
        if not isinstance(data, dict):
            raise ValueError("LLM did not return a JSON object for preparation recommendation")
        data.setdefault("target_role", target_role)
        data.setdefault("estimated_time", available_time)
        return data

    # -----------------------------------------------------------------------
    # DIGITAL TWIN INSIGHT (LLM-powered)
    # -----------------------------------------------------------------------

    def generate_digital_twin_insight(
        self,
        scores: Dict[str, Optional[float]],
        target_role: str | None = None,
        overall_score: float | None = None,
        weakest_area: str | None = None,
    ) -> Dict[str, Any]:
        """Generate an AI-powered Digital Twin narrative and next actions."""
        prompt = build_digital_twin_insight_prompt(
            scores=scores,
            target_role=target_role,
            overall_score=overall_score,
            weakest_area=weakest_area,
        )
        raw = self.llm.generate_json(
            system_prompt=DIGITAL_TWIN_INSIGHT_SYSTEM_PROMPT,
            prompt=prompt,
        )
        return _parse_json(raw)

    # -----------------------------------------------------------------------
    # PLANNER (LLM-powered What-If)
    # -----------------------------------------------------------------------

    def generate_planner_recommendation(
        self,
        scores: Dict[str, Optional[float]],
        current_score: float,
        recommended_area: str,
        estimated_score: float,
    ) -> Dict[str, Any]:
        """Generate an AI-powered career improvement plan."""
        prompt = build_planner_prompt(
            scores=scores,
            current_score=current_score,
            recommended_area=recommended_area,
            estimated_score=estimated_score,
        )
        raw = self.llm.generate_json(
            system_prompt=PLANNER_SYSTEM_PROMPT,
            prompt=prompt,
        )
        return _parse_json(raw)

    # -----------------------------------------------------------------------
    # INTERVIEW AGENT (LLM-powered)
    # -----------------------------------------------------------------------

    def generate_interview_questions(
        self,
        target_role: str,
        round_type: str = "technical",
        count: int = 5,
        skills: List[str] | None = None,
        difficulty: str = "medium",
    ) -> List[Dict[str, Any]]:
        """Generate role-specific interview questions via LLM."""
        prompt = build_interview_questions_prompt(
            target_role=target_role,
            round_type=round_type,
            count=count,
            skills=skills,
            difficulty=difficulty,
        )
        raw = self.llm.generate_json(
            system_prompt=INTERVIEW_SYSTEM_PROMPT,
            prompt=prompt,
        )
        data = _parse_json(raw)
        if not isinstance(data, list):
            raise ValueError("LLM did not return a JSON array for interview questions")
        return data

    def evaluate_interview_answer(
        self,
        question: str,
        question_type: str,
        candidate_answer: str,
        target_role: str,
        expected_key_points: List[str] | None = None,
    ) -> Dict[str, Any]:
        """Evaluate a candidate answer via LLM and return detailed feedback."""
        prompt = build_interview_evaluation_prompt(
            question=question,
            question_type=question_type,
            candidate_answer=candidate_answer,
            target_role=target_role,
            expected_key_points=expected_key_points,
        )
        raw = self.llm.generate_json(
            system_prompt=INTERVIEW_SYSTEM_PROMPT,
            prompt=prompt,
        )
        return _parse_json(raw)

    # -----------------------------------------------------------------------
    # TODAY TASKS (LLM-powered)
    # -----------------------------------------------------------------------

    def generate_today_tasks(
        self,
        target_role: str,
        weak_topics: List[str] | None = None,
        skill_gaps: List[str] | None = None,
        available_time: int = 60,
        recent_performance: Dict[str, Any] | None = None,
    ) -> Dict[str, Any]:
        """Generate today personalised study task list via LLM."""
        prompt = build_today_tasks_prompt(
            target_role=target_role,
            weak_topics=weak_topics,
            skill_gaps=skill_gaps,
            available_time=available_time,
            recent_performance=recent_performance,
        )
        raw = self.llm.generate_json(
            system_prompt=TODAY_TASKS_SYSTEM_PROMPT,
            prompt=prompt,
        )
        return _parse_json(raw)

    # -----------------------------------------------------------------------
    # WEAK TOPIC ANALYSIS (LLM-powered)
    # -----------------------------------------------------------------------

    def analyze_weak_topics(
        self,
        assessment_history: List[Dict[str, Any]],
        target_role: str,
        skill_gaps: List[str] | None = None,
    ) -> Dict[str, Any]:
        """Analyze weak topics from assessment history using LLM."""
        prompt = build_weak_topics_prompt(
            assessment_history=assessment_history,
            target_role=target_role,
            skill_gaps=skill_gaps,
        )
        raw = self.llm.generate_json(
            system_prompt=WEAK_TOPICS_SYSTEM_PROMPT,
            prompt=prompt,
        )
        return _parse_json(raw)
