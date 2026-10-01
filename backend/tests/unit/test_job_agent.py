import json
from unittest.mock import MagicMock

from backend.agents.jobs.agent import JobAgent


def test_job_agent_analysis():
    mock_llm = MagicMock()
    mock_llm.generate_json.return_value = json.dumps({
        "job_title": "Full Stack Engineer",
        "company": "Innovation Labs",
        "required_skills": ["React", "Node.js", "SQL"],
        "preferred_skills": ["TypeScript", "Docker"],
        "experience_requirements": ["1-3 years"],
        "qualifications": ["Bachelor's degree"],
        "responsibilities": ["Build UI components", "Implement APIs"],
        "keywords": ["React", "Node", "REST"],
        "summary": "Full stack web developer position.",
    })

    agent = JobAgent(llm_client=mock_llm)
    res = agent.analyze(description="Job description...", job_id="job_fullstack_1")

    assert res.job_id == "job_fullstack_1"
    assert res.job_title == "Full Stack Engineer"
    assert "React" in res.required_skills

    envelope = agent.to_career_manager_envelope(res)
    assert envelope["agent"] == "job"
    assert envelope["status"] == "success"
    assert envelope["data"]["job_id"] == "job_fullstack_1"
