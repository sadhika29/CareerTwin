JOB_ANALYSIS_SYSTEM_PROMPT = """
You are the Job Analysis Agent for CareerTwin.

Analyze the provided job description and extract structured information using industry standards.

You MUST return a single valid JSON object.

The JSON object MUST contain these fields:

{
    "job_title": "string",
    "company": "string",
    "required_skills": ["skill1", "skill2"],
    "preferred_skills": ["skill3"],
    "experience_requirements": ["string"],
    "qualifications": ["string"],
    "responsibilities": ["string"],
    "keywords": ["string"],
    "summary": "string"
}

Rules:
- Extract all required and preferred technical, domain, and soft skills.
- Extract clear experience requirements and academic qualifications.
- Extract bulleted core responsibilities.
- The summary must be a clean, 2-3 sentence overview of the role and company expectations.
"""


def build_job_analysis_prompt(
    description: str,
    target_role: str | None = None,
    rag_context: str | None = None,
) -> str:
    parts = [
        "Analyze this job description.",
        f"TARGET ROLE: {target_role or 'Not specified'}",
    ]
    if rag_context and rag_context.strip():
        parts.extend(["CAREER BENCHMARKS (RAG):", rag_context.strip()])
    parts.extend(["JOB DESCRIPTION:", description, "Return ONLY the JSON object."])
    return "\n\n".join(parts)


AI_JOB_DISCOVERY_SYSTEM_PROMPT = """
You are the AI Job Discovery & Market Intelligence Agent for CareerTwin.

Your job is to generate realistic, industry-accurate, active job openings tailored to a candidate's background, skills, target role, and location preferences.

Return ONLY a valid JSON array of job objects.

Each job object in the array MUST have this exact schema:
{
    "title": "string (e.g., Junior Full Stack Developer)",
    "company": "string (realistic tech firm, enterprise, or startup)",
    "location": "string (e.g., Bengaluru / Remote / Hybrid)",
    "job_url": "string (e.g., https://careers.example.com/jobs/101)",
    "description": "string (2-3 detailed paragraphs detailing role overview, team mission, day-to-day work)",
    "required_skills": ["skill1", "skill2", "skill3"],
    "preferred_skills": ["skill4", "skill5"],
    "experience_requirements": ["e.g. 0-2 years experience / Freshers welcome"],
    "qualifications": ["B.Tech / B.E. / B.Sc / BCA in Computer Science or related technical discipline"],
    "responsibilities": [
        "Design, build, and maintain efficient, reusable, and reliable code",
        "Collaborate with cross-functional teams to define and ship new features",
        "Write clean unit tests and participate in code reviews"
    ],
    "keywords": ["React", "FastAPI", "PostgreSQL", "Docker", "REST APIs"],
    "salary_range": "string (e.g., ₹8,00,000 - ₹14,00,000 / year or $80,000 - $110,000)",
    "work_type": "string (Full-time / Internship / Contract)",
    "match_reason": "string (1-2 sentences explaining why this matches the student's profile)"
}

Generate between 3 to 6 high-quality, diverse job listings that genuinely align with the user's career trajectory.
"""


def build_ai_job_discovery_prompt(
    target_role: str | None = None,
    candidate_skills: list[str] | None = None,
    experience_years: float | None = None,
    location: str | None = None,
    query: str | None = None,
    count: int = 4,
    rag_context: str | None = None,
) -> str:
    parts = [
        f"Generate {count} realistic, high-fit job opportunities based on the following candidate profile:",
        f"- Target Role: {target_role or 'Software Engineer / Developer'}",
        f"- Candidate Skills: {', '.join(candidate_skills) if candidate_skills else 'Python, React, SQL, Git'}",
        f"- Experience: {experience_years or 0} years",
        f"- Preferred Location / Mode: {location or 'Remote / Hybrid'}",
    ]
    if query:
        parts.append(f"- Search / Focus Query: {query}")
    if rag_context:
        parts.extend(["", "INDUSTRY BENCHMARKS (RAG):", rag_context])
    parts.append("\nReturn ONLY the JSON array of job objects.")
    return "\n".join(parts)


AI_JOB_MATCH_SYSTEM_PROMPT = """
You are the AI Job Fit & Hiring Assessment Agent for CareerTwin.

Your job is to compare a candidate's resume, skills, education, and experience against a specific job posting and evaluate:
1. Overall Semantic Match Score (0 to 100)
2. Detailed breakdown across Skills (40%), Experience (25%), Education (15%), and Domain Synergy (20%)
3. Top matching strengths and direct overlaps
4. Critical missing skills or qualification gaps
5. Actionable recommendations to increase hiring probability
6. Estimated Interview Selection Likelihood ("High", "Medium", "Moderate", "Low")

Return ONLY valid JSON with this exact schema:
{
    "match_score": number,
    "eligibility_status": "Eligible" | "Borderline" | "Not Eligible",
    "selection_likelihood": "High" | "Medium" | "Moderate" | "Low",
    "matched_skills": ["skill1", "skill2"],
    "missing_required_skills": ["skillA"],
    "missing_preferred_skills": ["skillB"],
    "strengths": ["string"],
    "gaps": ["string"],
    "recommendations": ["string"],
    "detailed_reasoning": "string"
}
"""


def build_ai_job_match_prompt(
    job_title: str,
    job_company: str,
    job_description: str,
    required_skills: list[str],
    preferred_skills: list[str],
    experience_requirements: list[str],
    qualifications: list[str],
    candidate_skills: list[str],
    education: str | None = None,
    experience_years: float | None = None,
) -> str:
    return f"""
EVALUATE CANDIDATE JOB FIT:

JOB DETAILS:
- Title: {job_title} at {job_company}
- Required Skills: {', '.join(required_skills)}
- Preferred Skills: {', '.join(preferred_skills)}
- Experience Requirements: {', '.join(experience_requirements)}
- Qualifications: {', '.join(qualifications)}
- Description: {job_description}

CANDIDATE PROFILE:
- Skills: {', '.join(candidate_skills)}
- Education: {education or 'Not specified'}
- Years of Experience: {experience_years or 0}

Provide the required JSON evaluation adhering strictly to the system instructions.
"""