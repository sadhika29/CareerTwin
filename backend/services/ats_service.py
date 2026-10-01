import re


def normalize_keyword(keyword: str) -> str:
    """Normalize text for keyword comparison."""
    return re.sub(r"\s+", " ", keyword.strip().lower())


def calculate_keyword_match(
    resume_text: str,
    job_keywords: list[str],
) -> tuple[float, list[str]]:
    """Calculate the percentage of job keywords found in the resume."""

    if not job_keywords:
        return 0.0, []

    normalized_resume = normalize_keyword(resume_text)

    matched = []
    missing = []

    for keyword in job_keywords:
        normalized_keyword = normalize_keyword(keyword)

        if normalized_keyword in normalized_resume:
            matched.append(keyword)
        else:
            missing.append(keyword)

    score = (len(matched) / len(job_keywords)) * 100

    return round(score, 2), missing


def calculate_skill_match(
    resume_skills: list[str],
    required_skills: list[str],
) -> float:
    """Calculate the percentage of required skills found in the resume."""

    if not required_skills:
        return 0.0

    normalized_resume_skills = {
        normalize_keyword(skill)
        for skill in resume_skills
    }

    normalized_required_skills = {
        normalize_keyword(skill)
        for skill in required_skills
    }

    matched_skills = (
        normalized_resume_skills & normalized_required_skills
    )

    score = (
        len(matched_skills)
        / len(normalized_required_skills)
    ) * 100

    return round(score, 2)


def calculate_experience_relevance(
    resume_text: str,
    experience_keywords: list[str],
) -> float:
    """Calculate how strongly the resume matches experience keywords."""

    if not experience_keywords:
        return 0.0

    normalized_resume = normalize_keyword(resume_text)

    matched = sum(
        1
        for keyword in experience_keywords
        if normalize_keyword(keyword) in normalized_resume
    )

    score = (matched / len(experience_keywords)) * 100

    return round(score, 2)


def calculate_section_completeness(
    resume_text: str,
    required_sections: list[str] | None = None,
) -> float:
    """Calculate resume section completeness."""

    if required_sections is None:
        required_sections = [
            "education",
            "experience",
            "projects",
            "skills",
        ]

    normalized_resume = normalize_keyword(resume_text)

    completed_sections = sum(
        1
        for section in required_sections
        if normalize_keyword(section) in normalized_resume
    )

    if not required_sections:
        return 0.0

    score = (
        completed_sections
        / len(required_sections)
    ) * 100

    return round(score, 2)


def validate_resume_document(resume_text: str) -> dict:
    """
    Validate whether an uploaded document is a genuine resume/CV.
    Checks for presence of contact info, structural career sections, and minimum length.
    """
    if not resume_text or len(resume_text.strip()) < 50:
        return {
            "is_valid": False,
            "confidence": 0.0,
            "reason": "The uploaded document is empty or contains insufficient content to evaluate as a resume.",
        }

    lower_text = resume_text.lower()
    
    # Common resume structural section headers
    section_patterns = [
        r"\b(experience|work history|employment|professional background)\b",
        r"\b(education|academic|qualifications|degrees|university|college)\b",
        r"\b(skills|technical skills|competencies|proficiencies|core skills)\b",
        r"\b(projects|portfolio|key projects|academic projects)\b",
        r"\b(summary|objective|profile|about me|professional summary)\b",
        r"\b(certifications|certificates|licenses|achievements|awards)\b",
    ]
    
    detected_sections_count = sum(
        1 for pat in section_patterns if re.search(pat, lower_text)
    )
    
    # Contact patterns (email, phone)
    email_present = bool(re.search(r"[\w\.-]+@[\w\.-]+\.\w+", resume_text))
    phone_present = bool(re.search(r"(\+?\d{1,3}[-.\s]?)?(\(?\d{3}\)?[-.\s]?)?\d{3}[-.\s]?\d{4}", resume_text))
    
    # Non-resume indicators (e.g. invoices, academic papers without career info, random scripts)
    non_resume_flags = [
        r"\binvoice\b",
        r"\bbill to\b",
        r"\bpurchase order\b",
        r"\breceipt\b",
    ]
    is_financial_bill = any(re.search(pat, lower_text) for pat in non_resume_flags)
    
    # Validity criteria: At least 2 career sections OR (1 section + email/phone)
    is_valid = (detected_sections_count >= 2) or (detected_sections_count >= 1 and (email_present or phone_present))
    
    if is_financial_bill and detected_sections_count < 2:
        is_valid = False
        
    reason = "Valid professional resume document." if is_valid else (
        "The uploaded file does not appear to be a standard resume or CV. "
        "It is missing essential career sections (such as Experience, Education, or Skills) or contact information."
    )
    
    confidence = min(1.0, (detected_sections_count * 0.3) + (0.2 if email_present else 0.0) + (0.2 if phone_present else 0.0))
    
    return {
        "is_valid": is_valid,
        "confidence": round(confidence, 2),
        "reason": reason,
        "detected_sections_count": detected_sections_count,
        "has_contact_info": email_present or phone_present,
    }


def detect_contact_info(resume_text: str) -> dict:
    """Detect contact information and professional links in the resume."""
    email_match = re.search(r"[\w\.-]+@[\w\.-]+\.\w+", resume_text)
    phone_match = re.search(r"(\+?\d{1,3}[-.\s]?)?(\(?\d{3}\)?[-.\s]?)?\d{3}[-.\s]?\d{4}", resume_text)
    linkedin_match = re.search(r"linkedin\.com/in/[\w\-]+", resume_text, re.I)
    github_match = re.search(r"github\.com/[\w\-]+", resume_text, re.I)
    portfolio_match = re.search(r"(https?://)?[\w\-]+(\.dev|\.io|\.com|\.me|portfolio)", resume_text, re.I)

    has_email = bool(email_match)
    has_phone = bool(phone_match)
    has_linkedin = bool(linkedin_match)
    has_links = bool(github_match or portfolio_match or linkedin_match)

    completeness = (
        (40.0 if has_email else 0.0)
        + (30.0 if has_phone else 0.0)
        + (15.0 if has_linkedin else 0.0)
        + (15.0 if has_links else 0.0)
    )

    return {
        "email": email_match.group(0) if email_match else None,
        "phone": phone_match.group(0) if phone_match else None,
        "linkedin": linkedin_match.group(0) if linkedin_match else None,
        "contact_score": round(completeness, 1),
    }


ACTION_VERBS = {
    "led", "spearheaded", "developed", "managed", "designed", "created",
    "established", "improved", "increased", "reduced", "achieved", "optimized",
    "analyzed", "coordinated", "delivered", "implemented", "negotiated", "launched",
    "automated", "transformed", "streamlined", "orchestrated", "engineered",
    "mentored", "directed", "built", "drove", "executed", "collaborated",
}


def calculate_action_verbs_score(resume_text: str) -> tuple[float, list[str]]:
    """Detect power action verbs and calculate impact score."""
    lower_text = resume_text.lower()
    found_verbs = [verb.capitalize() for verb in ACTION_VERBS if re.search(r"\b" + verb + r"\b", lower_text)]
    # Target is at least 6 distinct strong action verbs
    score = min(100.0, (len(found_verbs) / 6.0) * 100.0)
    return round(score, 1), found_verbs


def calculate_quantifiable_metrics_score(resume_text: str) -> tuple[float, list[str]]:
    """Detect metrics, percentages, and quantifiable achievements in the resume."""
    metrics_patterns = [
        r"\b\d+%\b",                           # e.g., 25%
        r"\$\s*\d+[\d,]*(\.\d+)?\s*(k|m|b)?\b", # e.g., $50k, $1.2M
        r"\b\d+\s*(x|times)\b",                # e.g., 3x, 5 times
        r"\b\d+\+\b",                          # e.g., 100+
        r"\b(reduced|increased|saved|grew|scaled)\s+by\s+\d+", # e.g. reduced by 40%
        r"\b(revenue|budget|cost|time)\s*(of)?\s*\$?\d+",
    ]
    
    found_metrics = []
    for pat in metrics_patterns:
        matches = re.findall(pat, resume_text, re.I)
        for m in matches:
            val = m if isinstance(m, str) else m[0]
            if val and len(val.strip()) > 1 and val.strip() not in found_metrics:
                found_metrics.append(val.strip())

    # Target is at least 3-4 quantifiable outcome mentions
    score = min(100.0, (len(found_metrics) / 3.0) * 100.0)
    return round(score, 1), found_metrics[:5]


def infer_candidate_domain(resume_text: str, detected_skills: list[str]) -> str:
    """
    Dynamically infer the candidate's primary profession / domain from resume content.
    Works for any industry (Tech, HR, Management, Marketing, Finance, Sales, Design, etc.).
    """
    lower_text = (resume_text + " " + " ".join(detected_skills)).lower()
    
    domain_keywords = {
        "Human Resources": ["hr", "recruitment", "talent acquisition", "onboarding", "payroll", "employee relations", "hris", "workday", "benefits", "labor laws"],
        "Marketing & Growth": ["marketing", "seo", "sem", "content strategy", "social media", "campaigns", "copywriting", "hubspot", "growth", "google analytics", "brand"],
        "Sales & Business Development": ["sales", "b2b", "lead generation", "salesforce", "pipeline", "client relations", "cold calling", "negotiation", "account management"],
        "Finance & Accounting": ["finance", "accounting", "quickbooks", "gaap", "financial modeling", "tax", "auditing", "budgeting", "sap", "forecasting"],
        "UI/UX & Product Design": ["figma", "ui/ux", "wireframing", "prototyping", "design system", "user research", "adobe xd", "photoshop", "illustrator"],
        "Product & Project Management": ["product manager", "scrum", "agile", "jira", "sprint", "roadmap", "stakeholder management", "project management", "backlog"],
        "Data Science & Analytics": ["data science", "machine learning", "tableau", "power bi", "pandas", "statistics", "data analysis", "bigquery", "deep learning", "etl"],
        "Software Engineering": ["software", "developer", "frontend", "backend", "python", "javascript", "react", "fastapi", "docker", "kubernetes", "rest apis", "aws", "git"],
        "Operations & Supply Chain": ["supply chain", "logistics", "procurement", "inventory", "six sigma", "operations manager", "vendor management"],
    }
    
    best_domain = "General Professional"
    best_score = 0
    
    for domain, keywords in domain_keywords.items():
        score = sum(1 for kw in keywords if re.search(r"\b" + re.escape(kw) + r"\b", lower_text))
        if score > best_score:
            best_score = score
            best_domain = domain
            
    return best_domain


def calculate_ats_score(
    keyword_match: float,
    skill_match: float,
    experience_relevance: float,
    section_completeness: float,
    weights: dict[str, float] | None = None,
) -> float:
    """
    Calculate the overall CareerTwin ATS readiness score.

    Default weights:
    - Keyword match: 30%
    - Skill match: 30%
    - Experience relevance: 20%
    - Section completeness: 20%

    Weights can be customized dynamically by callers.
    """
    w_kw = weights.get("keyword_match", 0.30) if weights else 0.30
    w_skill = weights.get("skill_match", 0.30) if weights else 0.30
    w_exp = weights.get("experience_relevance", 0.20) if weights else 0.20
    w_sec = weights.get("section_completeness", 0.20) if weights else 0.20

    score = (
        keyword_match * w_kw
        + skill_match * w_skill
        + experience_relevance * w_exp
        + section_completeness * w_sec
    )

    return round(score, 2)