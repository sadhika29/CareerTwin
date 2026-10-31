"""
Resume Biographical & Professional Information Extractor.
Extracts candidate identity, contact, education, experience, skills,
projects, and certifications from parsed resume text.
"""
from __future__ import annotations

import logging
import re
from typing import Any, Dict, List, Optional

from backend.services.ats_service import detect_contact_info
from backend.services.skill_service import SKILL_ALIASES

logger = logging.getLogger(__name__)


def extract_full_name(resume_text: str) -> Optional[str]:
    """
    Extract candidate's full name from resume text.
    Resumes typically have the candidate's name on the first 1-4 lines,
    usually formatted in Title Case or UPPERCASE, without punctuation,
    email addresses, or URLs.
    """
    if not resume_text:
        return None

    lines = [line.strip() for line in resume_text.splitlines() if line.strip()]
    if not lines:
        return None

    # Noise headers to ignore
    ignored_keywords = {
        "resume", "curriculum", "vitae", "cv", "page", "profile",
        "contact", "summary", "objective", "experience", "education",
        "skills", "projects", "phone", "email", "address", "linkedin",
        "github", "portfolio", "http", "https", "www", "com", "org",
        "developer", "engineer", "designer", "manager", "intern"
    }

    candidate_names = []
    # Check top 6 lines
    for line in lines[:6]:
        cleaned = re.sub(r"[^\w\s\.-]", "", line).strip()
        # Remove emails, urls, phone numbers
        cleaned = re.sub(r"[\w\.-]+@[\w\.-]+\.\w+", "", cleaned).strip()
        cleaned = re.sub(r"https?://\S+", "", cleaned).strip()
        cleaned = re.sub(r"\+?\d[\d\s-]{7,}\d", "", cleaned).strip()

        if not cleaned:
            continue

        words = cleaned.split()
        # A name typically has 2 to 4 words
        if 2 <= len(words) <= 4:
            first_word_lower = words[0].lower()
            if first_word_lower in ignored_keywords:
                continue

            # Ensure words are mostly alphabetic
            if all(re.match(r"^[A-Za-z\.-]+$", w) for w in words):
                candidate_names.append(" ".join(words).title())

    if candidate_names:
        return candidate_names[0]

    return None


def extract_education_details(resume_text: str) -> Dict[str, Any]:
    """
    Extract education level, college/university, and graduation year.
    """
    edu_data = {
        "degree": "",
        "college": "",
        "graduation_year": "",
    }
    if not resume_text:
        return edu_data

    # 1. Graduation Year: 4 digits between 2000 and 2035
    year_matches = re.findall(r"\b(20[0-3]\d)\b", resume_text)
    if year_matches:
        # Choose the latest year as graduation year (typically recent past or near future)
        valid_years = [int(y) for y in year_matches if 2010 <= int(y) <= 2032]
        if valid_years:
            edu_data["graduation_year"] = str(max(valid_years))

    # 2. Degree Pattern
    degree_patterns = [
        r"\b(B\.?Tech(?:nology)?(?:\s+(?:in|of)\s+[A-Za-z\s]+)?)\b",
        r"\b(Bachelor\s+of\s+(?:Technology|Engineering|Science|Arts|Business Administration)(?:\s+(?:in|of)\s+[A-Za-z\s]+)?)\b",
        r"\b(B\.?E\.?(?:\s+(?:in|of)\s+[A-Za-z\s]+)?)\b",
        r"\b(B\.?S\.?(?:\s+(?:in|of)\s+[A-Za-z\s]+)?)\b",
        r"\b(M\.?Tech(?:nology)?(?:\s+(?:in|of)\s+[A-Za-z\s]+)?)\b",
        r"\b(Master\s+of\s+(?:Technology|Engineering|Science|Business Administration|Computer Applications))\b",
        r"\b(M\.?S\.?|M\.?B\.?A\.?|M\.?C\.?A\.?|B\.?C\.?A\.?)\b",
    ]
    for pat in degree_patterns:
        m = re.search(pat, resume_text, re.IGNORECASE)
        if m:
            edu_data["degree"] = m.group(0).strip()
            break

    # 3. College / University Pattern
    college_patterns = [
        r"([A-Z][A-Za-z\s,]+(?:Institute\s+of\s+Technology|University|College\s+of\s+Engineering|Polytechnic|Academy))",
        r"([A-Z][A-Za-z\s]+(?:Institute|University|College|Campus))",
    ]
    for pat in college_patterns:
        m = re.search(pat, resume_text)
        if m:
            candidate = m.group(1).strip().replace("\n", " ")
            # Basic sanity check on length
            if 6 <= len(candidate) <= 80:
                edu_data["college"] = candidate
                break

    return edu_data


def extract_skills_from_text(resume_text: str) -> List[str]:
    """Extract canonical skills from text using SKILL_ALIASES."""
    if not resume_text:
        return []
    lower_text = resume_text.lower()
    detected_skills = set()
    for alias, canonical in SKILL_ALIASES.items():
        pattern = r"\b" + re.escape(alias) + r"\b"
        if re.search(pattern, lower_text):
            detected_skills.add(canonical)
    return sorted(list(detected_skills))


def extract_headline_and_role(resume_text: str, inferred_skills: List[str]) -> str:
    """Infer candidate's professional headline / target role."""
    lower = resume_text.lower()
    roles = [
        ("Full Stack Developer", ["full stack", "full-stack", "mern", "mean"]),
        ("Frontend Developer", ["frontend", "front-end", "react", "vue", "angular", "css", "html"]),
        ("Backend Developer", ["backend", "back-end", "node.js", "django", "fastapi", "spring boot"]),
        ("Data Scientist / ML Engineer", ["machine learning", "deep learning", "data science", "pytorch", "tensorflow"]),
        ("Mobile App Developer", ["android", "flutter", "react native", "ios", "swift"]),
        ("DevOps / Cloud Engineer", ["devops", "docker", "kubernetes", "aws", "terraform", "ci/cd"]),
        ("Software Engineer", ["software engineer", "software developer", "computer science"]),
    ]
    for role_name, kws in roles:
        if any(kw in lower for kw in kws):
            return role_name

    return "Software Engineer"


def extract_experience_and_projects(resume_text: str) -> Dict[str, Any]:
    """Extract experience highlights and project names."""
    res = {
        "has_experience": False,
        "has_internships": False,
        "projects_count": 0,
        "experience_snippets": [],
        "project_titles": [],
    }
    if not resume_text:
        return res

    lower = resume_text.lower()
    if "intern" in lower or "internship" in lower:
        res["has_internships"] = True
    if any(k in lower for k in ["experience", "work history", "employment", "professional background"]):
        res["has_experience"] = True

    # Check for projects
    lines = [l.strip() for l in resume_text.splitlines() if l.strip()]
    in_project_section = False
    for line in lines:
        if re.match(r"^(key\s+)?projects?(\s+and\s+innovations?)?$", line, re.IGNORECASE):
            in_project_section = True
            continue
        if in_project_section:
            if re.match(r"^(education|skills|experience|certifications|achievements|awards|summary)$", line, re.IGNORECASE):
                in_project_section = False
                break
            # Bullet or bold project line
            if len(line) < 60 and not line.startswith("•") and not line.startswith("-") and not line.startswith("*"):
                res["project_titles"].append(line)

    res["projects_count"] = len(res["project_titles"])
    return res


def extract_comprehensive_resume_data(resume_text: str) -> Dict[str, Any]:
    """
    Master extraction function that synthesizes all candidate professional
    information from raw resume text without fabricating facts.
    """
    if not resume_text:
        return {}

    contact = detect_contact_info(resume_text)
    name = extract_full_name(resume_text)
    edu = extract_education_details(resume_text)
    skills = extract_skills_from_text(resume_text)
    role = extract_headline_and_role(resume_text, skills)
    exp = extract_experience_and_projects(resume_text)

    # Compose structured education string
    edu_str = edu.get("degree") or ""
    if edu.get("college"):
        edu_str = f"{edu_str} at {edu['college']}".strip(" at ")

    bio = f"{role} with focus on {', '.join(skills[:4])}" if skills else f"{role} passionate about software technology."

    return {
        "full_name": name or "",
        "email": contact.get("email") or "",
        "phone": contact.get("phone") or "",
        "linkedin": contact.get("linkedin") or "",
        "github": contact.get("github") or "",
        "target_role": role,
        "education": edu_str,
        "college": edu.get("college") or "",
        "graduation_year": edu.get("graduation_year") or "",
        "degree": edu.get("degree") or "",
        "skills": skills,
        "bio": bio,
        "has_experience": exp.get("has_experience", False),
        "has_internships": exp.get("has_internships", False),
        "projects_count": exp.get("projects_count", 0),
        "project_titles": exp.get("project_titles", []),
    }

