import re
from backend.services.job_description import normalize_job_description


def normalize_text(text: str) -> str:
    """Normalize whitespace in job description text and split inline section headers."""

    if not text:
        return ""

    text = normalize_job_description(text)
    text = text.replace("\n", "\n")
    text = text.replace("\r", "\n")

    # Split inline section headers that appear after sentence periods
    text = re.sub(r"(?<=\.)\s+(?=[A-Za-z /&-]{3,30}:)", "\n", text)

    lines = []

    for line in text.split("\n"):
        line = re.sub(r"[ \t]+", " ", line).strip()

        if line:
            lines.append(line)

    return "\n".join(lines)


def extract_section(text: str, section_names: list[str]) -> list[str]:
    """Extract bullet points or inline items belonging to a section."""

    lines = text.splitlines()

    section_pattern = "|".join(
        re.escape(section)
        for section in section_names
    )

    start_pattern = re.compile(
        rf"^(?:{section_pattern})\s*:?\s*(.*)$",
        re.IGNORECASE,
    )

    sections = []
    collecting = False

    for line in lines:
        clean_line = line.strip()

        if not clean_line:
            continue

        match = start_pattern.match(clean_line)
        if match:
            collecting = True
            inline_content = match.group(1).strip()
            if inline_content:
                items = re.split(r"[,;]|\band\b", inline_content)
                for item in items:
                    item = item.strip().strip(".")
                    if item:
                        sections.append(item)
            continue

        if collecting:
            # Check if this line is the beginning of the next section
            if not re.match(r"^[•*\-\u2022]", clean_line) and re.match(
                r"^[A-Za-z /&-]{3,50}:\s*", clean_line
            ):
                break

            clean_line = re.sub(
                r"^[•*\-\u2022]\s*",
                "",
                clean_line,
            ).strip()

            if clean_line:
                items = re.split(r"[,;]", clean_line)
                for item in items:
                    item = item.strip().strip(".")
                    if item:
                        sections.append(item)

    return sections



def extract_keywords(text: str) -> list[str]:
    """Extract common technical keywords from job descriptions."""

    if not text:
        return []

    known_keywords = [
        "Python",
        "Java",
        "JavaScript",
        "TypeScript",
        "React",
        "React.js",
        "Node.js",
        "Express.js",
        "FastAPI",
        "Django",
        "Flask",
        "SQL",
        "MySQL",
        "PostgreSQL",
        "MongoDB",
        "Redis",
        "REST API",
        "GraphQL",
        "Docker",
        "Kubernetes",
        "AWS",
        "Azure",
        "Google Cloud",
        "GCP",
        "Git",
        "GitHub",
        "CI/CD",
        "Jenkins",
        "GitHub Actions",
        "Machine Learning",
        "Deep Learning",
        "TensorFlow",
        "PyTorch",
        "Pandas",
        "NumPy",
        "Scikit-learn",
        "NLP",
        "Data Structures",
        "Algorithms",
        "OOP",
        "DBMS",
        "Operating Systems",
        "Computer Networks",
        "Agile",
        "Scrum",
    ]

    normalized_text = text.lower()

    found = []

    for keyword in known_keywords:
        if keyword.lower() in normalized_text:
            found.append(keyword)

    return found


def parse_job_description(
    description: str,
    title: str = "",
    company: str = "",
    location: str = "",
) -> dict:
    """Parse a raw job description into structured job data."""

    description = normalize_text(description)

    if not description:
        raise ValueError("Job description cannot be empty.")

    required_skills = extract_section(
        description,
        [
            "Required Skills",
            "Requirements",
            "Technical Skills",
            "Required Qualifications",
        ],
    )

    preferred_skills = extract_section(
        description,
        [
            "Preferred Skills",
            "Preferred Qualifications",
            "Preferred",
            "Nice to Have",
            "Good to Have",
        ],
    )


    experience_requirements = extract_section(
        description,
        [
            "Experience",
            "Experience Requirements",
            "Required Experience",
        ],
    )

    qualifications = extract_section(
        description,
        [
            "Qualifications",
            "Education",
            "Educational Qualifications",
        ],
    )

    responsibilities = extract_section(
        description,
        [
            "Responsibilities",
            "Job Responsibilities",
            "What You'll Do",
            "What You Will Do",
        ],
    )

    keywords = extract_keywords(description)

    return {
        "title": title.strip(),
        "company": company.strip(),
        "location": location.strip(),
        "description": description,
        "required_skills": required_skills,
        "preferred_skills": preferred_skills,
        "experience_requirements": experience_requirements,
        "qualifications": qualifications,
        "responsibilities": responsibilities,
        "keywords": keywords,
    }
