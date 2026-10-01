from backend.schemas.skill import PriorityLevel
from backend.services.skill_service import SkillService


def test_normalize_skill_aliases():
    service = SkillService()

    assert service.normalize_skill_name("js") == "JavaScript"
    assert service.normalize_skill_name("JavaScript") == "JavaScript"
    assert service.normalize_skill_name("  JAVASCRIPT  ") == "JavaScript"
    assert service.normalize_skill_name("py") == "Python"
    assert service.normalize_skill_name("python3") == "Python"
    assert service.normalize_skill_name("k8s") == "Kubernetes"
    assert service.normalize_skill_name("reactjs") == "React"
    assert service.normalize_skill_name("dsa") == "Data Structures & Algorithms"


def test_normalize_skill_list_deduplication():
    service = SkillService()

    raw_skills = ["js", "JavaScript", "JS", "python", "py", "Python", "FastAPI"]
    normalized = service.normalize_skill_list(raw_skills)

    assert len(normalized) == 3
    assert "JavaScript" in normalized
    assert "Python" in normalized
    assert "FastAPI" in normalized


def test_compare_skills():
    service = SkillService()

    current = ["python", "fastapi", "sql"]
    required = ["Python", "FastAPI", "Docker", "System Design"]

    matched, gaps, gap_score = service.compare_skills(
        current_skills=current,
        required_skills=required,
    )

    assert set(matched) == {"Python", "FastAPI"}
    assert set(gaps) == {"Docker", "System Design"}
    assert gap_score == 50.0  # 2 of 4 missing = 50%


def test_compare_empty_skills():
    service = SkillService()

    matched, gaps, score = service.compare_skills(current_skills=[], required_skills=[])
    assert matched == []
    assert gaps == []
    assert score == 0.0


def test_prioritize_gaps_ranking():
    service = SkillService()

    gaps = ["Kubernetes", "System Design", "Docker", "Data Structures & Algorithms"]
    priority_items = service.prioritize_gaps(skill_gaps=gaps, target_role="Software Engineer")

    # HIGH priority items must come before MEDIUM and LOW
    assert len(priority_items) == 4
    priorities = [item.priority for item in priority_items]

    # Verify System Design and DSA are ranked HIGH
    high_skills = [
        item.skill_name for item in priority_items if item.priority == PriorityLevel.HIGH
    ]
    assert "System Design" in high_skills
    assert "Data Structures & Algorithms" in high_skills

    # Verify Docker is MEDIUM
    med_skills = [
        item.skill_name for item in priority_items if item.priority == PriorityLevel.MEDIUM
    ]
    assert "Docker" in med_skills

    # Verify Kubernetes is LOW
    low_skills = [
        item.skill_name for item in priority_items if item.priority == PriorityLevel.LOW
    ]
    assert "Kubernetes" in low_skills

    # Ensure items are ordered by priority: HIGH before MEDIUM before LOW
    high_idx = [i for i, p in enumerate(priorities) if p == PriorityLevel.HIGH]
    low_idx = [i for i, p in enumerate(priorities) if p == PriorityLevel.LOW]
    assert max(high_idx) < min(low_idx)


def test_generate_learning_recommendations():
    service = SkillService()

    gaps = ["System Design", "Docker"]
    priority_items = service.prioritize_gaps(skill_gaps=gaps, target_role="Backend Developer")
    recs = service.generate_recommendations(priority_skills=priority_items, target_role="Backend Developer")

    assert len(recs) > 0
    assert any("System Design" in r for r in recs)


def test_get_standard_catalog():
    service = SkillService()
    catalog = service.get_standard_catalog()

    assert len(catalog) >= 10
    names = [s.name for s in catalog]
    assert "Python" in names
    assert "System Design" in names
    assert "Docker" in names
