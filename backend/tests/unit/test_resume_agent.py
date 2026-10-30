import json
from unittest.mock import MagicMock

from backend.agents.resume.agent import ResumeAgent


def test_resume_agent_ats_scoring():
    agent = ResumeAgent()
    text = "Candidate with Python, FastAPI, Docker, SQL experience in backend systems."
    res = agent.analyze_ats(
        resume_text=text,
        resume_skills=["Python", "FastAPI", "Docker", "SQL"],
        job_keywords=["Python", "FastAPI", "SQL", "Docker", "AWS"],
        required_skills=["Python", "FastAPI", "SQL"],
        experience_keywords=["backend"],
    )
    assert res.ats_score > 60.0
    assert res.skill_match == 100.0
    assert "AWS" in res.missing_keywords


def test_resume_agent_envelope():
    mock_llm = MagicMock()
    mock_llm.generate_json.return_value = json.dumps({
        "resume_score": 88.0,
        "ats_score": 80.0,
        "resume_skills": ["Python", "SQL"],
        "resume_strengths": ["Strong coding fundamentals"],
        "resume_weaknesses": ["Needs more project details"],
        "missing_sections": [],
        "keyword_gaps": ["Docker"],
        "recommendations": ["Add Docker containerization experience."],
    })

    agent = ResumeAgent(llm_client=mock_llm)
    analysis = agent.analyze(resume_text="Sample text", target_role="Backend Engineer")
    envelope = agent.to_career_manager_envelope(analysis)

    assert envelope["agent"] == "resume"
    assert envelope["status"] == "success"
    assert envelope["data"]["resume_score"] == 88.0


def test_job_missing_keywords_are_verified_against_resume_and_job_description():
    mock_llm = MagicMock()
    mock_llm.generate_json.return_value = json.dumps({
        "resume_score": 80.0,
        "ats_score": 90.0,
        "resume_skills": ["Python"],
        "missing_keyword_details": [{
            "keyword": "Fabricated Cloud Platform",
            "relevance": "LLM-only suggestion",
            "status": "absent",
            "suggested_placement": "Skills",
        }],
    })
    agent = ResumeAgent(llm_client=mock_llm)

    analysis = agent.analyze(
        resume_text="EXPERIENCE\nBackend engineer built APIs with Python.\nEDUCATION\nBS Computer Science.\nSKILLS\nPython",
        target_role="Backend Engineer",
        job_description="Required skills: Kubernetes, Terraform, Docker",
    )

    assert "Fabricated Cloud Platform" not in analysis.missing_keywords
    assert "Kubernetes" in analysis.missing_keywords
    assert set(analysis.missing_keywords).issubset({"Kubernetes", "Terraform", "Docker"})
