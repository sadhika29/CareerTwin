from backend.agents.skills.agent import SkillAgent
from backend.schemas.skill import PriorityLevel


def test_skill_agent_deterministic_flow():
    agent = SkillAgent(llm_client=None)

    current_skills = ["js", "React"]
    required_skills = ["JavaScript", "React", "TypeScript", "Node.js", "Docker"]

    res = agent.analyze(
        current_skills=current_skills,
        required_skills=required_skills,
        target_role="Frontend Engineer",
    )

    assert "JavaScript" in res.matched_skills
    assert "React" in res.matched_skills
    assert "TypeScript" in res.skill_gaps
    assert res.skill_gap_score > 0

    envelope = agent.to_career_manager_envelope(res)
    assert envelope["agent"] == "skill"
    assert envelope["status"] == "success"
