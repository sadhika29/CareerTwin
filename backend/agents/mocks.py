"""
Mock agent output contracts for Yamini's Career Manager integration.
Adheres to Section 47 and Section 48 of member-docs/veerendra/TASKS.md.
"""

MOCK_RESUME_AGENT_OUTPUT = {
    "agent": "resume",
    "status": "success",
    "data": {
        "resume_score": 85.0,
        "ats_score": 78.5,
        "resume_skills": [
            "Python",
            "FastAPI",
            "SQL",
            "PostgreSQL",
            "REST APIs",
            "Git",
            "Docker",
        ],
        "resume_strengths": [
            "Strong core backend foundation in Python and FastAPI",
            "Clear project explanations with measurable outcomes",
            "Good database schema design experience",
        ],
        "resume_weaknesses": [
            "Lack of formal cloud platform certifications",
            "Missing system design and distributed systems details",
        ],
        "missing_sections": ["Certifications"],
        "keyword_gaps": ["Kubernetes", "Redis", "CI/CD"],
        "recommendations": [
            "Highlight scalability metrics in your primary backend project",
            "Add mention of container orchestration and caching strategies",
        ],
        "keyword_match": 80.0,
        "skill_match": 85.0,
        "experience_relevance": 75.0,
        "section_completeness": 90.0,
        "missing_keywords": ["Kubernetes", "Redis"],
    },
}

MOCK_JOB_AGENT_OUTPUT = {
    "agent": "job",
    "status": "success",
    "data": {
        "job_id": "job_sample_backend_101",
        "job_title": "Backend Software Engineer",
        "company": "Tech Innovations Corp",
        "required_skills": ["Python", "FastAPI", "SQL", "System Design"],
        "preferred_skills": ["Docker", "Kubernetes", "Redis"],
        "experience_requirements": ["1-3 years of backend experience"],
        "qualifications": ["B.Tech/B.E. in Computer Science or related degree"],
        "responsibilities": [
            "Design and build low-latency REST APIs using FastAPI",
            "Collaborate with frontend engineers on data contracts",
            "Optimize PostgreSQL database queries",
        ],
        "keywords": ["Python", "FastAPI", "SQL", "Docker", "Microservices"],
        "summary": "Looking for a proactive backend engineer to scale web services.",
        "job_match_score": 82.0,
        "eligibility": True,
    },
}

MOCK_SKILL_AGENT_OUTPUT = {
    "agent": "skill",
    "status": "success",
    "data": {
        "current_skills": ["Python", "FastAPI", "SQL", "Docker"],
        "required_skills": [
            "Python",
            "FastAPI",
            "SQL",
            "System Design",
            "Docker",
            "Kubernetes",
        ],
        "matched_skills": ["Python", "FastAPI", "SQL", "Docker"],
        "skill_gaps": ["System Design", "Kubernetes"],
        "skill_gap_score": 33.33,
        "priority_skills": [
            {
                "skill_id": "skill_sys_design",
                "skill_name": "System Design",
                "priority": "HIGH",
                "category": "Architecture",
                "target_role": "Backend Software Engineer",
                "reason": "Crucial architectural foundation needed for technical interviews.",
                "prerequisites": ["Data Structures & Algorithms", "DBMS", "REST APIs"],
            },
            {
                "skill_id": "skill_k8s",
                "skill_name": "Kubernetes",
                "priority": "LOW",
                "category": "DevOps",
                "target_role": "Backend Software Engineer",
                "reason": "Secondary container orchestration tool for high-scale microservices.",
                "prerequisites": ["Docker"],
            },
        ],
        "learning_recommendations": [
            "Improve System Design first before applying to senior roles.",
            "Review caching patterns (Redis) and load balancing.",
        ],
    },
}
