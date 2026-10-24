import json
import pytest
from unittest.mock import MagicMock

from backend.agents.resume.agent import ResumeAgent
from backend.database.firestore import FirestoreDatabase
from backend.database.local_storage import LocalResumeStorage
from backend.schemas.resume import (
    ResumeAnalysisRequest,
    SaveAnalysisRequest,
)
from backend.services.resume_service import ResumeService


@pytest.fixture
def mock_storage():
    storage = MagicMock()
    storage.upload.return_value = "users/test-user/resumes/res-123/resume.pdf"
    return storage


@pytest.fixture
def mock_database():
    db = MagicMock()
    fake_docs = {}

    def fake_create(collection, document_id, data):
        key = f"{collection}:{document_id}"
        fake_docs[key] = dict(data)
        return document_id

    def fake_get(collection, document_id):
        key = f"{collection}:{document_id}"
        doc = fake_docs.get(key)
        return dict(doc) if doc else None

    def fake_update(collection, document_id, data):
        key = f"{collection}:{document_id}"
        if key in fake_docs:
            fake_docs[key].update(data)
        else:
            fake_docs[key] = dict(data)

    def fake_delete(collection, document_id):
        key = f"{collection}:{document_id}"
        fake_docs.pop(key, None)

    def fake_list(collection, filters=None, limit=50):
        res = []
        for key, val in fake_docs.items():
            if key.startswith(f"{collection}:"):
                if filters:
                    matches = True
                    for fk, fv in filters.items():
                        if val.get(fk) != fv:
                            matches = False
                            break
                    if matches:
                        res.append(dict(val))
                else:
                    res.append(dict(val))
        return res[:limit]

    db.create.side_effect = fake_create
    db.get.side_effect = fake_get
    db.update.side_effect = fake_update
    db.delete.side_effect = fake_delete
    db.list.side_effect = fake_list
    return db


SAMPLE_RESUME_TEXT = """
Jane Doe
Email: jane.doe@example.com | Phone: 555-123-4567 | Location: New York, NY
LinkedIn: linkedin.com/in/janedoe | GitHub: github.com/janedoe

PROFESSIONAL SUMMARY
Dynamic software engineer with 3 years of experiance building scalable backend APIs.

WORK EXPERIENCE
Software Engineer | Acme Corp | 2022 - Present
- Worked on backend features and database integration using python, fastapi, and postgresql.
- In order to optimize server performance, reduced latency by 35% across 200,000 monthly active users.
- Responsible for the development of user authentication and data streaming endpoints.
- Spearheaded automated test deployment pipeline, cutting defect turnaround time by 40%.

EDUCATION
B.S. in Computer Science | University of Technology | 2018 - 2022
CGPA: 3.8 / 4.0

TECHNICAL SKILLS
Languages: Python, JavaScript, SQL, HTML, CSS
Frameworks & Tools: FastAPI, Docker, Git, REST APIs
"""

SAMPLE_JOB_DESCRIPTION = """
Senior Backend Engineer
We are seeking an experienced Backend Engineer to lead our cloud microservices.
Required Qualifications:
- 3+ years experience with Python and FastAPI
- Strong experience with Kubernetes, AWS, and GraphQL for cloud deployments
- Proficiency in Docker and PostgreSQL
- Experience architecting Redis caching layers and high-concurrency microservices
- Demonstrated track record designing scalable REST APIs and CI/CD pipelines
"""


# -------------------------------------------------------------------------
# Case A: Resume without a Job Description
# -------------------------------------------------------------------------
def test_case_a_resume_without_job_description():
    agent = ResumeAgent(llm_client=None)
    res = agent.analyze(
        resume_text=SAMPLE_RESUME_TEXT,
        target_role="Software Engineer",
        job_description=None,
    )

    # 1. Document recognized
    assert res.is_valid_resume is True
    assert "Software" in res.inferred_domain

    # 2. General resume feedback available
    assert res.resume_score > 50.0  # Overall quality score calculated
    assert len(res.resume_skills) >= 4
    assert "Python" in res.resume_skills
    assert "FastAPI" in res.resume_skills

    # 3. Confirm job-specific missing keywords are NOT fabricated
    assert res.has_target_job is False
    assert res.ats_score is None  # Must NOT fabricate a job-specific ATS score
    assert len(res.missing_keyword_details) == 0
    assert len(res.keyword_gaps) == 0
    assert len(res.missing_keywords) == 0

    # 4. General recommendations provided
    assert len(res.structured_recommendations) > 0


# -------------------------------------------------------------------------
# Case B: Resume with a Job Description
# -------------------------------------------------------------------------
def test_case_b_resume_with_job_description():
    agent = ResumeAgent(llm_client=None)
    res = agent.analyze(
        resume_text=SAMPLE_RESUME_TEXT,
        target_role="Senior Backend Engineer",
        job_description=SAMPLE_JOB_DESCRIPTION,
    )

    # 1. Job-specific flags active
    assert res.has_target_job is True
    assert res.ats_score is not None
    assert 40.0 <= res.ats_score <= 100.0

    # 2. Confirm missing keywords are extracted strictly from that JD
    missing_names = [item.keyword for item in res.missing_keyword_details]
    assert any("Kubernetes" in kw for kw in missing_names)
    assert any("AWS" in kw for kw in missing_names)
    assert any("Redis" in kw or "GraphQL" in kw for kw in missing_names)

    # Missing keywords must have context (relevance, status, placement)
    k8s_item = next(item for item in res.missing_keyword_details if "Kubernetes" in item.keyword)
    assert k8s_item.status == "absent"
    assert "job description" in k8s_item.relevance.lower()
    assert len(k8s_item.suggested_placement) > 0

    # 3. Real grammar/spelling issues detected from actual resume text
    # (Notice 'experiance', 'python', 'in order to' in SAMPLE_RESUME_TEXT)
    grammar_problems = [g.problem.lower() for g in res.grammar_issues]
    grammar_types = [g.issue_type for g in res.grammar_issues]
    assert "spelling" in grammar_types or any("experiance" in p for p in grammar_problems)
    assert any("wordiness" in t or "formatting" in t or "spelling" in t for t in grammar_types)

    # 4. Recommendations prioritized to the JD
    rec_areas = [r.area for r in res.structured_recommendations]
    assert "Target Role Keyword Coverage" in rec_areas or "Quantifiable Impact & Metrics" in rec_areas


# -------------------------------------------------------------------------
# Case C: Save and Retrieve Analysis Persistence
# -------------------------------------------------------------------------
def test_case_c_save_and_retrieve_analysis(mock_storage, mock_database):
    agent = ResumeAgent(llm_client=None)
    service = ResumeService(storage=mock_storage, database=mock_database, agent=agent)


    # Setup initial resume
    mock_database.create(
        collection="resumes",
        document_id="res-abc",
        data={
            "resume_id": "res-abc",
            "user_id": "user-456",
            "filename": "Jane_Doe_Resume.pdf",
            "text": SAMPLE_RESUME_TEXT,
        },
    )

    # Perform analysis
    analysis_res = service.analyze_resume(
        resume_id="res-abc",
        user_id="user-456",
        target_role="Software Engineer",
        job_description=SAMPLE_JOB_DESCRIPTION,
    )

    # Save the analysis
    saved_doc = service.save_analysis(
        user_id="user-456",
        resume_id="res-abc",
        filename="Jane_Doe_Resume.pdf",
        analysis_data=analysis_res.model_dump(),
        job_description=SAMPLE_JOB_DESCRIPTION,
        target_role="Software Engineer",
    )

    assert "analysis_id" in saved_doc
    analysis_id = saved_doc["analysis_id"]
    assert saved_doc["user_id"] == "user-456"
    assert saved_doc["has_target_job"] is True
    assert saved_doc["ats_score"] is not None

    # Retrieve by ID
    retrieved = service.get_saved_analysis(analysis_id=analysis_id, user_id="user-456")
    assert retrieved["analysis_id"] == analysis_id
    assert retrieved["resume_score"] == saved_doc["resume_score"]
    assert len(retrieved["missing_keyword_details"]) == len(saved_doc["missing_keyword_details"])

    # List saved analyses
    analyses_list = service.list_saved_analyses(user_id="user-456")
    assert len(analyses_list) >= 1
    assert analyses_list[0]["analysis_id"] == analysis_id

    # Delete saved analysis
    deleted = service.delete_saved_analysis(analysis_id=analysis_id, user_id="user-456")
    assert deleted is True

    # Confirm deletion
    with pytest.raises(FileNotFoundError):
        service.get_saved_analysis(analysis_id=analysis_id, user_id="user-456")


# -------------------------------------------------------------------------
# Case D: Security, Authorization, and Input Validation
# -------------------------------------------------------------------------
def test_case_d_security_and_authorization(mock_storage, mock_database):
    service = ResumeService(storage=mock_storage, database=mock_database)

    # 1. Reject empty resume_id or user_id
    with pytest.raises(ValueError, match="resume_id cannot be empty"):
        service.analyze_resume(resume_id="", user_id="user-123")

    with pytest.raises(ValueError, match="user_id cannot be empty"):
        service.analyze_resume(resume_id="res-1", user_id="")

    # 2. Reject unauthorized access to another user's resume
    mock_database.create(
        collection="resumes",
        document_id="res-owner1",
        data={
            "resume_id": "res-owner1",
            "user_id": "owner-1",
            "filename": "private.pdf",
            "text": SAMPLE_RESUME_TEXT,
        },
    )

    with pytest.raises(ValueError, match="Resume does not belong to this user"):
        service.analyze_resume(resume_id="res-owner1", user_id="intruder-2")

    # 3. Reject unauthorized access to another user's saved analysis
    saved = service.save_analysis(
        user_id="owner-1",
        resume_id="res-owner1",
        filename="private.pdf",
        analysis_data={"resume_score": 80.0, "has_target_job": False},
    )

    with pytest.raises(ValueError, match="Analysis does not belong to this user"):
        service.get_saved_analysis(analysis_id=saved["analysis_id"], user_id="intruder-2")

    with pytest.raises(ValueError, match="Analysis does not belong to this user"):
        service.delete_saved_analysis(analysis_id=saved["analysis_id"], user_id="intruder-2")
