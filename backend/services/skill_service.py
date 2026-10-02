import re
from uuid import uuid4

from backend.models.skill import Skill
from backend.schemas.skill import (
    PriorityLevel,
    SkillGapItem,
    SkillItem,
)


# Canonical mapping for skill normalization and alias resolution
SKILL_ALIASES: dict[str, str] = {
    "js": "JavaScript",
    "javascript": "JavaScript",
    "ts": "TypeScript",
    "typescript": "TypeScript",
    "py": "Python",
    "python": "Python",
    "python3": "Python",
    "react": "React",
    "reactjs": "React",
    "react.js": "React",
    "node": "Node.js",
    "nodejs": "Node.js",
    "node.js": "Node.js",
    "fastapi": "FastAPI",
    "django": "Django",
    "flask": "Flask",
    "k8s": "Kubernetes",
    "kubernetes": "Kubernetes",
    "docker": "Docker",
    "postgres": "PostgreSQL",
    "postgresql": "PostgreSQL",
    "mongo": "MongoDB",
    "mongodb": "MongoDB",
    "sql": "SQL",
    "mysql": "MySQL",
    "redis": "Redis",
    "aws": "AWS",
    "gcp": "Google Cloud",
    "azure": "Azure",
    "git": "Git",
    "github": "GitHub",
    "rest": "REST APIs",
    "rest api": "REST APIs",
    "rest apis": "REST APIs",
    "restful": "REST APIs",
    "graphql": "GraphQL",
    "dsa": "Data Structures & Algorithms",
    "data structures": "Data Structures & Algorithms",
    "algorithms": "Data Structures & Algorithms",
    "system design": "System Design",
    "oop": "Object-Oriented Programming",
    "dbms": "DBMS",
    "os": "Operating Systems",
    "cn": "Computer Networks",
    "ci/cd": "CI/CD",
    "cicd": "CI/CD",
    "machine learning": "Machine Learning",
    "ml": "Machine Learning",
    "dl": "Deep Learning",
    "deep learning": "Deep Learning",
    "nlp": "Natural Language Processing",
    "tableau": "Tableau",
    "power bi": "Power BI",
    "powerbi": "Power BI",
    "excel": "Excel",
    "advanced excel": "Excel",
    "pandas": "Pandas",
    "numpy": "NumPy",
    "java": "Java",
    "c": "C",
    "c++": "C++",
    "cpp": "C++",
    "c#": "C#",
    "csharp": "C#",
    "html": "HTML",
    "html5": "HTML",
    "css": "CSS",
    "css3": "CSS",
    "mern": "MERN Stack",
    "mern stack": "MERN Stack",
    "mean": "MEAN Stack",
    "mean stack": "MEAN Stack",
    "generative ai": "Generative AI",
    "genai": "Generative AI",
    "gen ai": "Generative AI",
    "gemini": "Gemini API",
    "stable diffusion": "Stable Diffusion",
    "jwt": "JWT",
    "spring": "Spring Boot",
    "spring boot": "Spring Boot",
    "vs code": "VS Code",
    "vscode": "VS Code",
    "visual studio code": "VS Code",
    "leetcode": "LeetCode",
    "networking": "Computer Networks",
    "computer networks": "Computer Networks",
    "operating systems": "Operating Systems",
    "sklearn": "Scikit-Learn",
    "scikit-learn": "Scikit-Learn",
    "tensorflow": "TensorFlow",
    "pytorch": "PyTorch",
    "bigquery": "BigQuery",
    "spark": "Apache Spark",
    # HR & Talent Acquisition
    "talent acquisition": "Talent Acquisition",
    "recruitment": "Recruitment",
    "recruiting": "Recruitment",
    "hris": "HRIS",
    "workday": "Workday",
    "employee relations": "Employee Relations",
    "performance management": "Performance Management",
    "onboarding": "Onboarding",
    "payroll": "Payroll",
    "labor laws": "Labor Laws",
    "compensation": "Compensation & Benefits",
    "benefits administration": "Compensation & Benefits",
    # Management & Leadership
    "project management": "Project Management",
    "program management": "Program Management",
    "agile": "Agile",
    "scrum": "Scrum",
    "jira": "Jira",
    "stakeholder management": "Stakeholder Management",
    "team leadership": "Team Leadership",
    "leadership": "Leadership",
    "strategic planning": "Strategic Planning",
    "budgeting": "Budget Management",
    "risk management": "Risk Management",
    "process improvement": "Process Improvement",
    # Marketing & Growth
    "seo": "SEO",
    "sem": "SEM",
    "digital marketing": "Digital Marketing",
    "content marketing": "Content Strategy",
    "content strategy": "Content Strategy",
    "social media marketing": "Social Media Marketing",
    "google analytics": "Google Analytics",
    "copywriting": "Copywriting",
    "email marketing": "Email Marketing",
    "hubspot": "HubSpot",
    "brand strategy": "Brand Strategy",
    "market research": "Market Research",
    # Sales & Business Development
    "b2b sales": "B2B Sales",
    "lead generation": "Lead Generation",
    "salesforce": "Salesforce",
    "crm": "CRM",
    "pipeline management": "Pipeline Management",
    "account management": "Account Management",
    "negotiation": "Negotiation",
    "cold calling": "Cold Calling",
    "customer success": "Customer Success",
    "client relations": "Client Relations",
    # Finance & Accounting
    "financial modeling": "Financial Modeling",
    "financial analysis": "Financial Analysis",
    "accounting": "Accounting",
    "quickbooks": "QuickBooks",
    "gaap": "GAAP",
    "auditing": "Auditing",
    "tax preparation": "Tax Preparation",
    "sap": "SAP",
    "budget variance": "Financial Forecasting",
    "forecasting": "Financial Forecasting",
    # Design & UI/UX
    "figma": "Figma",
    "adobe xd": "Adobe XD",
    "photoshop": "Adobe Photoshop",
    "illustrator": "Adobe Illustrator",
    "ui/ux": "UI/UX Design",
    "user experience": "UI/UX Design",
    "user interface": "UI/UX Design",
    "wireframing": "Wireframing",
    "prototyping": "Prototyping",
    "user research": "User Research",
    "design systems": "Design Systems",
    # Operations & Supply Chain
    "supply chain": "Supply Chain Management",
    "logistics": "Logistics",
    "inventory management": "Inventory Management",
    "procurement": "Procurement",
    "six sigma": "Six Sigma",
    "lean": "Lean Operations",
    "vendor management": "Vendor Management",
    # Universal / Professional
    "communication": "Communication",
    "problem solving": "Problem Solving",
    "critical thinking": "Critical Thinking",
    "collaboration": "Cross-Functional Collaboration",
    "time management": "Time Management",
}

# Skill categorization and priority rules
SKILL_METADATA: dict[str, dict] = {
    "System Design": {
        "category": "Architecture",
        "default_priority": PriorityLevel.HIGH,
        "prerequisites": ["Data Structures & Algorithms", "DBMS", "REST APIs"],
        "reason": "Crucial architectural foundation needed for mid-to-senior technical interviews.",
    },
    "Data Structures & Algorithms": {
        "category": "CS Fundamentals",
        "default_priority": PriorityLevel.HIGH,
        "prerequisites": ["Python", "Java", "C++"],
        "reason": "Primary screening criteria across tech company coding rounds.",
    },
    "Python": {
        "category": "Languages",
        "default_priority": PriorityLevel.HIGH,
        "prerequisites": [],
        "reason": "Core programming language required for implementation.",
    },
    "Java": {
        "category": "Languages",
        "default_priority": PriorityLevel.HIGH,
        "prerequisites": [],
        "reason": "Core enterprise backend language.",
    },
    "SQL": {
        "category": "Databases",
        "default_priority": PriorityLevel.HIGH,
        "prerequisites": ["DBMS"],
        "reason": "Essential for backend data persistence and query optimization.",
    },
    "REST APIs": {
        "category": "Backend",
        "default_priority": PriorityLevel.HIGH,
        "prerequisites": ["HTTP Basics"],
        "reason": "Standard protocol for backend service communication.",
    },
    "Docker": {
        "category": "DevOps",
        "default_priority": PriorityLevel.MEDIUM,
        "prerequisites": ["Linux Basics"],
        "reason": "Standard containerization technology for reliable deployment.",
    },
    "FastAPI": {
        "category": "Frameworks",
        "default_priority": PriorityLevel.MEDIUM,
        "prerequisites": ["Python", "REST APIs"],
        "reason": "Modern asynchronous web framework for high performance APIs.",
    },
    "React": {
        "category": "Frontend",
        "default_priority": PriorityLevel.MEDIUM,
        "prerequisites": ["JavaScript", "HTML/CSS"],
        "reason": "Primary client-side library for frontend web development.",
    },
    "PostgreSQL": {
        "category": "Databases",
        "default_priority": PriorityLevel.MEDIUM,
        "prerequisites": ["SQL"],
        "reason": "Leading open-source relational database in modern software stacks.",
    },
    "Kubernetes": {
        "category": "DevOps",
        "default_priority": PriorityLevel.LOW,
        "prerequisites": ["Docker"],
        "reason": "Advanced container orchestration; usually secondary for entry-level roles.",
    },
    "Redis": {
        "category": "Databases",
        "default_priority": PriorityLevel.LOW,
        "prerequisites": ["Databases"],
        "reason": "In-memory caching layer; good to have for high-scale applications.",
    },
}


class SkillService:
    """Service handling skill normalization, gap analysis, and priority ranking."""

    @classmethod
    def extract_skills(cls, text: str) -> list[str]:
        """Extract all known canonical skills from text based on aliases and boundaries."""
        if not text:
            return []
        lower_text = text.lower()
        detected = set()
        for alias, canonical in SKILL_ALIASES.items():
            pattern = r"\b" + re.escape(alias) + r"\b"
            if re.search(pattern, lower_text):
                detected.add(canonical)
        return sorted(list(detected))

    def normalize_skill_name(self, name: str) -> str:
        """Clean and normalize a skill name to its canonical form."""
        if not name or not name.strip():
            return ""

        clean = re.sub(r"\s+", " ", name.strip().lower())
        return SKILL_ALIASES.get(clean, name.strip())

    def normalize_skill_list(self, skills: list[str]) -> list[str]:
        """Normalize and deduplicate a list of skill names."""
        seen = set()
        normalized = []

        for skill in skills:
            canonical = self.normalize_skill_name(skill)
            if canonical and canonical.lower() not in seen:
                seen.add(canonical.lower())
                normalized.append(canonical)

        return normalized

    def compare_skills(
        self,
        current_skills: list[str],
        required_skills: list[str],
    ) -> tuple[list[str], list[str], float]:
        """
        Compare current skills with required skills.
        Returns (matched_skills, skill_gaps, skill_gap_score).
        """
        norm_current = self.normalize_skill_list(current_skills)
        norm_required = self.normalize_skill_list(required_skills)

        current_set = {s.lower() for s in norm_current}

        matched = [s for s in norm_required if s.lower() in current_set]
        gaps = [s for s in norm_required if s.lower() not in current_set]

        gap_score = 0.0
        if norm_required:
            gap_score = round((len(gaps) / len(norm_required)) * 100.0, 2)

        return matched, gaps, gap_score

    def prioritize_gaps(
        self,
        skill_gaps: list[str],
        target_role: str = "",
    ) -> list[SkillGapItem]:
        """
        Prioritize identified skill gaps into HIGH, MEDIUM, and LOW tiers.
        Adheres to Section 22:
        - HIGH: Core prerequisites, high frequency, architecture fundamentals
        - MEDIUM: Secondary frameworks, containerization, common web tools
        - LOW: Specialized tools, niche infrastructure
        """
        prioritized_items: list[SkillGapItem] = []
        normalized_gaps = self.normalize_skill_list(skill_gaps)

        for skill in normalized_gaps:
            meta = SKILL_METADATA.get(skill, {})
            category = meta.get("category", "Technical")
            prerequisites = meta.get("prerequisites", [])
            priority = meta.get("default_priority", PriorityLevel.MEDIUM)

            # Heuristics for unknown skills:
            if skill not in SKILL_METADATA:
                lower = skill.lower()
                if any(kw in lower for kw in ["design", "architecture", "dsa", "algorithms", "core"]):
                    priority = PriorityLevel.HIGH
                    category = "Architecture / Core"
                elif any(kw in lower for kw in ["framework", "database", "api", "backend", "frontend"]):
                    priority = PriorityLevel.MEDIUM
                    category = "Frameworks & Tools"
                else:
                    priority = PriorityLevel.LOW
                    category = "Specialized Tools"

            reason = meta.get(
                "reason",
                f"Essential for role '{target_role or 'Target Role'}' to satisfy job requirements.",
            )

            prioritized_items.append(
                SkillGapItem(
                    skill_id=f"skill_{uuid4().hex[:8]}",
                    skill_name=skill,
                    priority=priority,
                    category=category,
                    target_role=target_role or "Target Role",
                    reason=reason,
                    prerequisites=prerequisites,
                )
            )

        # Sort order: HIGH first, then MEDIUM, then LOW
        order = {PriorityLevel.HIGH: 0, PriorityLevel.MEDIUM: 1, PriorityLevel.LOW: 2}
        prioritized_items.sort(key=lambda x: order.get(x.priority, 1))

        return prioritized_items

    def generate_recommendations(
        self,
        priority_skills: list[SkillGapItem],
        target_role: str = "",
    ) -> list[str]:
        """Generate structured learning recommendations based on gaps."""
        if not priority_skills:
            return ["All required skills matched! Ready to prepare for domain interviews."]

        recommendations = []
        high_gaps = [item for item in priority_skills if item.priority == PriorityLevel.HIGH]
        med_gaps = [item for item in priority_skills if item.priority == PriorityLevel.MEDIUM]

        if high_gaps:
            skills_str = ", ".join(item.skill_name for item in high_gaps)
            recommendations.append(
                f"Prioritize mastering core high-impact skills: {skills_str}. These are essential for qualifying initial technical rounds."
            )

        if med_gaps:
            skills_str = ", ".join(item.skill_name for item in med_gaps)
            recommendations.append(
                f"Build practical hands-on projects using: {skills_str} to demonstrate real-world competence."
            )

        for item in high_gaps[:2]:
            if item.prerequisites:
                recommendations.append(
                    f"For {item.skill_name}, ensure strong grasp of prerequisites: {', '.join(item.prerequisites)}."
                )

        return recommendations

    def get_standard_catalog(self) -> list[Skill]:
        """Return the base skills catalog for taxonomy endpoints."""
        catalog = []
        for name, meta in SKILL_METADATA.items():
            aliases = [k for k, v in SKILL_ALIASES.items() if v == name]
            catalog.append(
                Skill(
                    skill_id=f"skill_{name.lower().replace(' ', '_')}",
                    name=name,
                    category=meta.get("category", "General"),
                    aliases=aliases,
                    description=meta.get("reason", ""),
                    difficulty="advanced" if meta.get("default_priority") == PriorityLevel.HIGH else "intermediate",
                    prerequisites=meta.get("prerequisites", []),
                )
            )
        return catalog
