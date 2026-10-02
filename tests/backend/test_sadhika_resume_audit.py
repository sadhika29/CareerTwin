"""
Regression & QA Test Suite — Sadhika Mahammad Sample Resume Audit.
Verifies all parser fixes, contact info detection, quantifiable metrics,
expanded skill canonicalization, job matching, interview agent, digital twin,
and career manager state propagation.
"""
import pytest
from pathlib import Path

from backend.agents.career_manager.graph import CareerManager
from backend.agents.career_manager.nodes import apply_agent_result
from backend.agents.career_manager.state import AgentRequest, CareerState
from backend.agents.digital_twin.calculator import calculate_readiness
from backend.agents.interview.agent import InterviewAgent
from backend.agents.planner.service import recommend_improvement
from backend.agents.resume.agent import ResumeAgent
from backend.services.ats_service import (
    calculate_action_verbs_score,
    calculate_ats_score,
    calculate_quantifiable_metrics_score,
    calculate_section_completeness,
    detect_contact_info,
    infer_candidate_domain,
    validate_resume_document,
)
from backend.services.job_service import JobService
from backend.services.resume_parser import normalize_text, parse_resume
from backend.services.skill_service import SKILL_ALIASES, SkillService


SADHIKA_RESUME_TEXT = """
SADHIKA MAHAMMAD
+91-7569453136 | mahammadsadhika Gmail | mahammadsadhika Linkedin |sadhika29 GitHub | Leetcode

Summary
Computer Science undergraduate with a strong foundation in Java, Python, SQL, DSA, OOP, and
problem-solving. Experienced in academic projects and eager to contribute to real-world software
development as a Graduate Engineer Trainee.

Education
B.Tech – Computer Science and Engineering 2023-27
Prasad V. Potluri Siddhartha Institute of Technology
CGPA: 8.24| 6th Semester
Intermediate (MPC) – Andhra Loyola College | 85.1% 2023

Projects
Expense Tracker | GitHub | Live
● Created a MERN-based web application for tracking personal finances including income and
expenses
● Designed user-friendly interface for financial insights and visualization

Food Order Prediction System | GitHub | Colab
● Created ML model to predict food demand using historical data
● Performed preprocessing, feature engineering, and improved prediction accuracy

BrandCraft – Generative AI Branding Platform | GitHub
● Built AI platform for brand names, logos & marketing content using Gemini & Stable Diffusion
● Developed FastAPI-based REST APIs with JWT authentication

Technical Skills
Programming & Core: Python, Java, C, SQL | DSA, OOP
Web Development: HTML, CSS, JavaScript, React.js | FastAPI, REST APIs
AI/ML: Machine Learning, Generative AI | Pandas, NumPy, Scikit-learn
Tools & Strengths: Git, GitHub, VS Code | Effective Communication, Team Collaboration

Co-Curricular Activities
Anaemia Awareness Campaign – Contributed to community health awareness and anaemia awareness.
Wadhwani Foundation – Ignite India Program | Nov 2025 – Completed entrepreneurship training,
developing Communication, leadership, teamwork, creativity, and problem-solving skills.

Certifications
● AWS Cloud Certification
● Wadhwani Foundation – Employability Skills
● NPTEL – Java Programming & AI Fundamentals
● Cisco NetAcad – Networking Essentials
● Infosys Springboard – Machine Learning
● STEP – English Proficiency
● Smart Interviews - Data Structures and Algorithms

Achievements and Activities
● Participated in Amaravati Quantum Valley Hackathon (2025), collaborating on innovative solutions
● Participated in ADOBE Hackathon 2026 and qualified to second level
● Received Best Pivot Award – Wadhwani Foundation
● Completed coding workshops and entrepreneurship training programs
"""


def test_text_normalization_cleans_unicode_and_zero_width():
    dirty_text = "Summary\u200b\nEducation\u200c\u00a0Projects\u2013Certifications\u2022"
    cleaned = normalize_text(dirty_text)
    assert "\u200b" not in cleaned
    assert "\u200c" not in cleaned
    assert "\u00a0" not in cleaned
    assert "-" in cleaned


def test_sadhika_contact_info_detection():
    contact = detect_contact_info(SADHIKA_RESUME_TEXT)
    assert contact["email"] == "mahammadsadhika@gmail.com"
    assert contact["phone"] == "+91-7569453136"
    assert "mahammadsadhika" in (contact["linkedin"] or "")
    assert "sadhika29" in (contact["github"] or "")
    assert contact["contact_score"] == 100.0


def test_sadhika_quantifiable_metrics_detection():
    m_score, metrics = calculate_quantifiable_metrics_score(SADHIKA_RESUME_TEXT)
    assert m_score >= 80.0
    # CGPA and percentage must be captured
    assert any("8.24" in m or "CGPA" in m for m in metrics)
    assert any("85.1%" in m for m in metrics)


def test_sadhika_section_completeness():
    sec_comp = calculate_section_completeness(SADHIKA_RESUME_TEXT)
    # Fresher with Education, Projects, Skills, and Certifications gets 100%
    assert sec_comp == 100.0


def test_sadhika_skill_canonicalization():
    svc = SkillService()
    norm_skills = svc.normalize_skill_list([
        "java", "c", "python", "dsa", "oop", "react.js", "fastapi", "generative ai", "mern", "jwt"
    ])
    assert "Java" in norm_skills
    assert "C" in norm_skills
    assert "Python" in norm_skills
    assert "Data Structures & Algorithms" in norm_skills
    assert "Object-Oriented Programming" in norm_skills
    assert "React" in norm_skills
    assert "FastAPI" in norm_skills
    assert "Generative AI" in norm_skills
    assert "MERN Stack" in norm_skills
    assert "JWT" in norm_skills


def test_sadhika_resume_analysis_fallback_and_scoring():
    agent = ResumeAgent(llm_client=None)  # Test deterministic fallback
    analysis = agent.analyze(SADHIKA_RESUME_TEXT, target_role="Graduate Engineer Trainee")
    assert analysis.is_valid_resume is True
    assert analysis.inferred_domain in ("Software Engineering", "General Professional")
    assert analysis.ats_score >= 70.0
    assert "Python" in analysis.resume_skills
    assert "Java" in analysis.resume_skills
    assert "SQL" in analysis.resume_skills
    assert analysis.contact_info["contact_score"] == 100.0


def test_calculator_protects_zero_weight_division():
    # If custom weights sum to zero for available scores, should not raise ZeroDivisionError
    scores = {"resume": 80.0, "technical": 75.0}
    weights = {"resume": 0.0, "technical": 0.0, "dsa": 1.0}
    res = calculate_readiness(scores, weights=weights)
    assert res["overall_score"] == 77.5


def test_career_manager_state_propagation_from_resume():
    state = CareerState(user_id="sadhika_test", target_role="Graduate Engineer Trainee")
    envelope = {
        "agent": "resume",
        "status": "success",
        "data": {
            "resume_score": 88.0,
            "ats_score": 85.0,
            "resume_skills": ["Python", "Java", "SQL", "React", "FastAPI"],
            "resume_strengths": ["Strong CGPA", "Diverse projects"],
        },
    }
    updated = apply_agent_result(state, "resume", envelope)
    assert updated.resume_score == 88.0
    assert updated.skills == ["Python", "Java", "SQL", "React", "FastAPI"]
    assert updated.resume_analysis["ats_score"] == 85.0


def test_interview_agent_generation_and_evaluation():
    agent = InterviewAgent(llm_client=None)
    questions = agent.generate_questions(
        target_role="Graduate Engineer Trainee",
        round_type="technical",
        count=3,
        skills=["Python", "Java", "SQL", "FastAPI"],
    )
    assert len(questions) == 3
    assert all("question" in q for q in questions)

    eval_result = agent.evaluate_answer(
        question="Explain ACID properties in SQL databases.",
        candidate_answer="ACID stands for Atomicity, Consistency, Isolation, Durability. Atomicity ensures all operations succeed or all rollback. Consistency keeps data valid. Isolation prevents concurrent transaction collisions. Durability guarantees committed transactions survive server crashes.",
        target_role="Graduate Engineer Trainee",
    )
    assert eval_result["overall_score"] >= 60.0
    assert len(eval_result["strengths"]) > 0
    assert len(eval_result["areas_to_improve"]) > 0
