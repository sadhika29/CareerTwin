import json
from unittest.mock import MagicMock

from backend.agents.jobs.agent import JobAgent
from backend.agents.resume.agent import ResumeAgent
from backend.agents.skills.agent import SkillAgent
from backend.schemas.skill import PriorityLevel


def test_resume_agent_deterministic_ats():
    agent = ResumeAgent()

    resume_text = """
    John Doe
    Education: B.Tech Computer Science
    Experience: 2 years building backend APIs with Python and FastAPI
    Projects: E-commerce platform using PostgreSQL and Docker
    Skills: Python, FastAPI, Docker, PostgreSQL, REST APIs
    """

    res = agent.analyze_ats(
        resume_text=resume_text,
        resume_skills=["Python", "FastAPI", "Docker", "PostgreSQL"],
        job_keywords=["Python", "FastAPI", "Docker", "AWS"],
        required_skills=["Python", "FastAPI", "Docker"],
        experience_keywords=["backend", "APIs"],
    )

    assert res.ats_score > 60.0
    assert res.skill_match == 100.0  # 3/3 required skills matched
    assert "AWS" in res.missing_keywords
    assert res.section_completeness == 100.0


def test_resume_agent_analyze_with_mock_llm():
    mock_llm = MagicMock()
    mock_llm.generate_json.return_value = json.dumps(
        {
            "resume_score": 85.0,
            "ats_score": 75.0,
            "resume_skills": ["Python", "FastAPI"],
            "resume_strengths": ["Strong technical stack"],
            "resume_weaknesses": ["Needs more metrics"],
            "missing_sections": [],
            "keyword_gaps": ["Docker"],
            "recommendations": ["Add measurable metrics."],
        }
    )

    agent = ResumeAgent(llm_client=mock_llm)
    res = agent.analyze(
        resume_text="Sample resume text...",
        target_role="Backend Developer",
    )

    assert res.resume_score == 85.0
    assert "Python" in res.resume_skills

    envelope = agent.to_career_manager_envelope(res)
    assert envelope["agent"] == "resume"
    assert envelope["status"] == "success"
    assert "data" in envelope


def test_job_agent_analyze_with_mock_llm():
    mock_llm = MagicMock()
    mock_llm.generate_json.return_value = json.dumps(
        {
            "job_title": "Backend Engineer",
            "company": "Tech Innovations",
            "required_skills": ["Python", "FastAPI"],
            "preferred_skills": ["Docker"],
            "experience_requirements": ["2 years"],
            "qualifications": ["B.Tech"],
            "responsibilities": ["Build APIs"],
            "keywords": ["Python", "REST", "Cloud"],
            "summary": "Looking for backend engineer.",
        }
    )

    agent = JobAgent(llm_client=mock_llm)
    res = agent.analyze(
        description="We are looking for a backend engineer...",
        job_id="job_demo_1",
    )

    assert res.job_id == "job_demo_1"
    assert res.job_title == "Backend Engineer"
    assert "Python" in res.required_skills

    envelope = agent.to_career_manager_envelope(res)
    assert envelope["agent"] == "job"
    assert envelope["status"] == "success"


def test_skill_agent_deterministic_fallback():
    # Without LLM, agent must run fully deterministically and accurately
    agent = SkillAgent(llm_client=None)

    res = agent.analyze(
        current_skills=["Python", "FastAPI"],
        required_skills=["Python", "FastAPI", "System Design", "Kubernetes"],
        target_role="Senior Software Engineer",
    )

    assert set(res.matched_skills) == {"Python", "FastAPI"}
    assert set(res.skill_gaps) == {"System Design", "Kubernetes"}
    assert res.skill_gap_score == 50.0
    assert len(res.priority_skills) == 2
    assert res.priority_skills[0].priority == PriorityLevel.HIGH
    assert res.priority_skills[0].skill_name == "System Design"

    envelope = agent.to_career_manager_envelope(res)
    assert envelope["agent"] == "skill"
    assert envelope["status"] == "success"
