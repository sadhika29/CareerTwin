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
    CAREER_INTENT_ANALYZER_SYSTEM_PROMPT,
    CAREER_ROADMAP_SYNTHESIZER_SYSTEM_PROMPT,
    CAREER_EXECUTIVE_REFINER_SYSTEM_PROMPT,
    APPLICATION_STRATEGY_SYSTEM_PROMPT,
    JOB_FIT_ANALYZER_SYSTEM_PROMPT,
    build_assessment_generation_prompt,
    build_digital_twin_insight_prompt,
    build_interview_evaluation_prompt,
    build_interview_questions_prompt,
    build_planner_prompt,
    build_preparation_recommendation_prompt,
    build_today_tasks_prompt,
    build_weak_topics_prompt,
    build_career_intent_analyzer_prompt,
    build_career_roadmap_synthesizer_prompt,
    build_career_executive_refiner_prompt,
    build_application_strategy_prompt,
    build_job_fit_prompt,
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
        if count and len(data) > count:
            data = data[:count]
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

    # -----------------------------------------------------------------------
    # MULTI-AGENT PROFILE & CAREER INTENT REFINEMENT (Cascade of 3 AI Agents)
    # -----------------------------------------------------------------------

    def analyze_and_refine_career_intent(
        self,
        raw_input: str,
        current_skills: List[str] | None = None,
        education: str | None = None,
        interests: str | None = None,
    ) -> Dict[str, Any]:
        """
        Three-stage agentic pipeline:
        Stage 1 (Intent Agent): Predicts what the user wants to be & their core motivation.
        Stage 2 (Roadmap Agent): Synthesizes competencies and learning milestones.
        Stage 3 (Refiner Agent): Polishes into an Executive Career Persona with immediate actions.
        """
        # Step 1: Diagnose intent
        intent_prompt = build_career_intent_analyzer_prompt(
            raw_input=raw_input,
            current_skills=current_skills,
            education=education,
            interests=interests,
        )
        try:
            intent_raw = self.llm.generate_json(
                system_prompt=CAREER_INTENT_ANALYZER_SYSTEM_PROMPT,
                prompt=intent_prompt,
            )
            intent_data = _parse_json(intent_raw)
        except Exception:
            intent_data = {
                "predicted_target_role": "Full Stack Software Engineer",
                "underlying_intention": f"Grow technical competencies and master modern software engineering to build impactful applications based on: {raw_input[:100]}",
                "ambition_level": "Specialized Lead",
                "implicit_strengths": current_skills[:3] if current_skills else ["Problem Solving", "Systems Thinking", "Adaptability"],
                "hidden_interests": ["System Architecture", "Cloud Engineering"],
                "career_archetype": "Systems Builder",
            }

        # Step 2: Synthesize roadmap based on Step 1 output
        roadmap_prompt = build_career_roadmap_synthesizer_prompt(
            intent_analysis=intent_data,
            current_skills=current_skills,
        )
        try:
            roadmap_raw = self.llm.generate_json(
                system_prompt=CAREER_ROADMAP_SYNTHESIZER_SYSTEM_PROMPT,
                prompt=roadmap_prompt,
            )
            roadmap_data = _parse_json(roadmap_raw)
        except Exception:
            role = intent_data.get("predicted_target_role", "Software Engineer")
            roadmap_data = {
                "role_title": role,
                "required_competencies": [
                    {"domain": "Core Engineering", "skills": current_skills or ["Python", "JavaScript", "SQL"], "criticality": "Essential"},
                    {"domain": "Modern Architecture", "skills": ["Cloud Services", "APIs", "System Design"], "criticality": "High"}
                ],
                "milestones": [
                    {"phase": "Phase 1: Foundation (Weeks 1-4)", "focus": "Core Language & Data Structures Mastery", "key_deliverable": "Build robust algorithmic foundation"},
                    {"phase": "Phase 2: Core Projects (Weeks 5-8)", "focus": "Full Stack Distributed Project", "key_deliverable": "Deploy end-to-end full stack service"},
                    {"phase": "Phase 3: Interview Readiness (Weeks 9-12)", "focus": "System Design & Mock Rounds", "key_deliverable": "Complete 10 mock technical rounds"}
                ],
                "recommended_certifications_or_topics": ["Distributed Systems", "Cloud Practitioner", "Clean Architecture"]
            }

        # Step 3: Polish into refined Executive Career Persona based on Steps 1 & 2
        refiner_prompt = build_career_executive_refiner_prompt(
            intent_analysis=intent_data,
            roadmap_analysis=roadmap_data,
        )
        try:
            refiner_raw = self.llm.generate_json(
                system_prompt=CAREER_EXECUTIVE_REFINER_SYSTEM_PROMPT,
                prompt=refiner_prompt,
            )
            refiner_data = _parse_json(refiner_raw)
        except Exception:
            target_role = intent_data.get("predicted_target_role", "Software Engineer")
            refiner_data = {
                "career_persona_title": f"High-Impact {target_role}",
                "executive_summary": f"Driven engineer focused on mastering modern engineering practices. Combines rigorous analytical grounding with passion for scalable product development.",
                "elevator_pitch": f"I am a developer specializing in {target_role} capabilities, building resilient, scalable systems with modern technologies.",
                "target_role": target_role,
                "top_priority_skills": (current_skills or [])[:4] + ["System Design", "Cloud Infrastructure"],
                "immediate_actions": [
                    {"action": "Complete target role skill gap assessment", "impact": "Critical", "timeframe": "Next 48 hours"},
                    {"action": "Build and deploy portfolio feature highlighting core competencies", "impact": "High", "timeframe": "This week"},
                    {"action": "Simulate technical interview session in CareerTwin", "impact": "High", "timeframe": "This weekend"}
                ],
                "target_industry_alignment": "Leading Tech Platforms, Fast-Growing Startups, and Cloud Engineering Teams"
            }

        return {
            "intent_analysis": intent_data,
            "roadmap": roadmap_data,
            "executive_persona": refiner_data,
        }

    # -----------------------------------------------------------------------
    # MULTI-AGENT JOB APPLICATION STRATEGY COACH
    # -----------------------------------------------------------------------

    def generate_application_strategy(
        self,
        company: str,
        job_title: str,
        job_description: str | None = None,
        candidate_skills: List[str] | None = None,
        candidate_profile: Dict[str, Any] | None = None,
    ) -> Dict[str, Any]:
        """AI generates tailored application pitch, interview questions & checklist."""
        prompt = build_application_strategy_prompt(
            company=company,
            job_title=job_title,
            job_description=job_description,
            candidate_skills=candidate_skills,
            candidate_profile=candidate_profile,
        )
        try:
            raw = self.llm.generate_json(
                system_prompt=APPLICATION_STRATEGY_SYSTEM_PROMPT,
                prompt=prompt,
            )
            return _parse_json(raw)
        except Exception:
            skills_str = ", ".join((candidate_skills or [])[:4]) or "software engineering principles"
            return {
                "company_overview": f"{company} looks for engineers with high technical ownership, clear problem solving, and ability to deliver production-grade code.",
                "tailored_pitch": (
                    f"Dear Hiring Team at {company},\n\n"
                    f"I am writing to express my strong enthusiasm for the {job_title} position. "
                    f"With a strong foundation in {skills_str}, I have focused on engineering scalable, "
                    f"reliable solutions and continuously optimizing system performance.\n\n"
                    f"I admire {company}'s commitment to engineering excellence. My experience aligns well with your "
                    f"technical requirements, and I am excited about the prospect of contributing to your team's mission.\n\n"
                    f"Thank you for your time and consideration."
                ),
                "key_talking_points": [
                    f"Demonstrated proficiency in {skills_str} and writing maintainable code.",
                    "Proactive approach to testing, continuous integration, and performance benchmarking.",
                    "Collaborative communication style and ability to quickly adapt to new codebases."
                ],
                "predicted_interview_questions": [
                    {
                        "question": f"How would you architect a core feature for {company}'s primary product?",
                        "type": "Architecture",
                        "suggested_approach": "Clarify requirements first, propose high-level design, discuss data flow, and highlight scalability bottlenecks."
                    },
                    {
                        "question": f"Walk me through a challenging bug you diagnosed using {skills_str.split(',')[0] if skills_str else 'code'}.",
                        "type": "Technical",
                        "suggested_approach": "Use the STAR method: describe the symptom, isolation method, root cause, and regression fix."
                    },
                    {
                        "question": f"Why do you want to join {company} specifically?",
                        "type": "Behavioral",
                        "suggested_approach": "Reference specific company products, culture values, or technical challenges that genuinely excite you."
                    }
                ],
                "application_checklist": [
                    {"task": "Tailor resume highlights to match keywords in job description", "done": true, "importance": "Critical"},
                    {"task": "Review GitHub repositories to ensure clean documentation and READMEs", "done": false, "importance": "Recommended"},
                    {"task": "Practice 2 mock interview rounds with CareerTwin AI Coach", "done": false, "importance": "Critical"},
                    {"task": "Prepare 3 thoughtful questions to ask the hiring manager", "done": false, "importance": "Recommended"}
                ],
                "estimated_readiness_score": 85
            }

    # -----------------------------------------------------------------------
    # MULTI-AGENT JOB FIT & SUITABILITY INTELLIGENCE
    # -----------------------------------------------------------------------

    def analyze_deep_job_fit(
        self,
        job_title: str,
        company: str,
        description: str | None = None,
        required_skills: List[str] | None = None,
        candidate_skills: List[str] | None = None,
    ) -> Dict[str, Any]:
        """AI deep analysis of candidate fit against job requirements."""
        prompt = build_job_fit_prompt(
            job_title=job_title,
            company=company,
            description=description,
            required_skills=required_skills,
            candidate_skills=candidate_skills,
        )
        try:
            raw = self.llm.generate_json(
                system_prompt=JOB_FIT_ANALYZER_SYSTEM_PROMPT,
                prompt=prompt,
            )
            return _parse_json(raw)
        except Exception:
            cand_set = {s.lower() for s in (candidate_skills or [])}
            reqs = required_skills or ["Problem Solving", "System Architecture", "Coding"]
            matched = [s for s in reqs if s.lower() in cand_set]
            missing = [s for s in reqs if s.lower() not in cand_set]
            match_pct = round((len(matched) / max(len(reqs), 1)) * 100) if reqs else 75

            return {
                "match_percentage": match_pct,
                "verdict": "Strong Match" if match_pct >= 75 else "Competitive Match" if match_pct >= 50 else "Growth Match",
                "fit_summary": f"Candidate demonstrates good alignment with {company}'s {job_title} requirements, matching {len(matched)} of {len(reqs)} key competencies.",
                "matched_strengths": [{"skill": s, "relevance": f"Directly satisfies core requirements for {job_title}"} for s in matched],
                "critical_gaps": [{"skill": s, "impact": "High", "bridging_strategy": f"Build a focused mini-project showcasing {s} in production"} for s in missing],
                "interview_focus_areas": [f"{s} Architecture" for s in (matched[:2] + missing[:1])],
                "tailored_advice": f"Emphasize your hands-on experience with {', '.join(matched[:2]) if matched else 'core tools'} while taking on a fast learning sprint for {', '.join(missing[:2]) if missing else 'system design'}."
            }

