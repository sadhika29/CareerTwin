import sys
from pathlib import Path

# Ensure project root is in sys.path
PROJECT_ROOT = Path(__file__).resolve().parent.parent
if str(PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(PROJECT_ROOT))

from backend.agents.jobs.agent import JobAgent
from backend.agents.resume.agent import ResumeAgent
from backend.agents.skills.agent import SkillAgent

from backend.rag.retriever import CareerRAGRetriever
from backend.services.job_parser import parse_job_description
from backend.services.job_service import JobService
from backend.services.skill_service import SkillService


def run_demo():
    print("=" * 70)
    print("  CAREERTWIN — END-TO-END CAREER INTELLIGENCE PIPELINE DEMO")
    print("=" * 70)

    # Step 1: Student Resume
    print("\n[Step 1] Student Resume Loaded:")
    resume_text = """
    Yamini Sharma
    Email: yamini@example.com | GitHub: github.com/yamini
    Education: B.Tech in Computer Science and Engineering, CGPA: 8.8
    Skills: Python, FastAPI, SQL, PostgreSQL, REST APIs, Git, Docker, HTML, CSS
    Experience: Software Engineer Intern (6 months) building backend services
    Projects: Career Twin Backend - Designed microservices and API endpoints
    """
    print("   Candidate: Yamini Sharma")
    print("   Education: B.Tech Computer Science")
    print("   Skills: Python, FastAPI, SQL, PostgreSQL, REST APIs, Git, Docker")

    # Step 2: Resume Agent & ATS Score
    print("\n[Step 2] Resume Agent & Deterministic ATS Analysis:")
    resume_agent = ResumeAgent()
    ats_result = resume_agent.analyze_ats(
        resume_text=resume_text,
        resume_skills=["Python", "FastAPI", "SQL", "PostgreSQL", "REST APIs", "Git", "Docker"],
        job_keywords=["Python", "FastAPI", "SQL", "Docker", "System Design"],
        required_skills=["Python", "FastAPI", "SQL", "System Design"],
        experience_keywords=["backend", "APIs"],
    )
    print(f"   ATS Score: {ats_result.ats_score}%")
    print(f"   Skill Match: {ats_result.skill_match}%")
    print(f"   Keyword Match: {ats_result.keyword_match}%")
    print(f"   Missing Keywords: {ats_result.missing_keywords}")

    # Step 3: Target Job Selection & Analysis
    print("\n[Step 3] Student Selects Target Job (Job Description Parsed):")
    target_job_text = """
    Role: Backend Software Engineer
    Company: HyperScale Cloud Technologies
    Required Skills: Python, FastAPI, SQL, System Design
    Preferred Skills: Docker, Kubernetes, Redis
    Experience: 0-2 years
    Qualifications: B.Tech in Computer Science or equivalent
    """
    parsed_job = parse_job_description(
        target_job_text,
        title="Backend Software Engineer",
        company="HyperScale Cloud Technologies",
    )
    print(f"   Title: {parsed_job['title']}")
    print(f"   Required Skills: {parsed_job['required_skills']}")
    print(f"   Preferred Skills: {parsed_job['preferred_skills']}")

    # Step 4: Job Matching & Eligibility
    print("\n[Step 4] Deterministic Job Match & Eligibility Check:")
    from unittest.mock import MagicMock
    mock_db = MagicMock()
    mock_db.get.return_value = {
        "job_id": "job_hyperscale_01",
        "user_id": "demo_student",
        "title": parsed_job["title"],
        "required_skills": parsed_job["required_skills"],
        "preferred_skills": parsed_job["preferred_skills"],
        "experience_requirements": ["0-2 years"],
        "qualifications": ["B.Tech in Computer Science"],
    }
    job_service = JobService(database=mock_db)

    match_result = job_service.calculate_job_match(
        job_id="job_hyperscale_01",
        user_id="demo_student",
        candidate_skills=["Python", "FastAPI", "SQL", "Docker"],
        education="B.Tech in Computer Science",
        experience_years=1.0,
        target_role="Backend Software Engineer",
    )
    print(f"   Overall Job Match Score: {match_result['job_match_score']}%")
    print(f"   Eligible: {match_result['eligible']}")
    print(f"   Matched Skills: {match_result['matched_skills']}")
    print(f"   Missing Skills: {match_result['missing_skills']}")

    # Step 5: Skill Agent & Prioritization
    print("\n[Step 5] Skill Agent Gap Analysis & Priority Ranking:")
    skill_agent = SkillAgent()
    skill_analysis = skill_agent.analyze(
        current_skills=["Python", "FastAPI", "SQL", "Docker"],
        required_skills=parsed_job["required_skills"] + parsed_job["preferred_skills"],
        target_role="Backend Software Engineer",
    )
    print(f"   Identified Gaps: {skill_analysis.skill_gaps}")
    print("   Priority Ranking:")
    for p in skill_analysis.priority_skills:
        print(f"     * [{p.priority.value}] {p.skill_name} — Reason: {p.reason}")

    # Step 6: RAG Knowledge Grounding
    print("\n[Step 6] RAG Knowledge Grounding for Top Priority Gap:")
    retriever = CareerRAGRetriever()
    rag_context = retriever.retrieve("System Design distributed caching load balancing", top_k=1)
    if rag_context:
        print(f"   Retrieved Concept: {rag_context[0]['metadata'].get('topic')}")
        snippet = " ".join(rag_context[0]['text'].split()[:30]) + "..."
        print(f"   Context Excerpt: {snippet}")

    # Step 7: Career Manager & Digital Twin Conclusion
    print("\n[Step 7] Career Manager Hand-off:")
    top_recommendation = skill_analysis.priority_skills[0].skill_name
    print(f"   Standard Envelope: {{'agent': 'skill', 'status': 'success', ...}}")
    print(f"   Actionable Verdict: 'Improve {top_recommendation} first'")
    print("\n" + "=" * 70)
    print("  DEMO COMPLETED SUCCESSFULLY — 100% OPERATIONAL")
    print("=" * 70)


if __name__ == "__main__":
    run_demo()
