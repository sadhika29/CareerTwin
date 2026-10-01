import io
import json
from unittest.mock import MagicMock, patch
import pytest
from fastapi.testclient import TestClient

from backend.main import app
from backend.agents.career_manager.state import CareerState
from backend.api.dependencies import career_states


client = TestClient(app)


# ==========================================
# 1. SYSTEM & HEALTH ENDPOINTS
# ==========================================
def test_system_health():
    res = client.get("/health")
    assert res.status_code == 200
    assert res.json()["status"] == "ok"


def test_system_root_redirect():
    res = client.get("/", follow_redirects=False)
    assert res.status_code in (307, 302, 200)


# ==========================================
# 2. AUTH ENDPOINTS
# ==========================================
def test_auth_register_and_login():
    unique_user = f"user_ep_{pytest.__version__.replace('.', '')}"
    register_payload = {
        "full_name": "Test Engineer",
        "username": f"u_{unique_user[:8]}",
        "email": f"{unique_user[:8]}@example.com",
        "password": "Password123!",
        "confirm_password": "Password123!",
    }
    res = client.post("/api/v1/auth/register", json=register_payload)
    assert res.status_code in (201, 400)

    login_payload = {
        "identifier": register_payload["username"],
        "password": register_payload["password"],
    }
    res_login = client.post("/api/v1/auth/login", json=login_payload)
    if res.status_code == 201:
        assert res_login.status_code == 200
        assert "access_token" in res_login.json()


# ==========================================
# 3. SKILL INTELLIGENCE ENDPOINTS
# ==========================================
def test_skills_catalog_and_gaps():
    # GET /api/v1/skills
    res = client.get("/api/v1/skills")
    assert res.status_code == 200
    data = res.json()
    assert "skills" in data
    assert data["total"] > 0

    # POST /api/v1/skills/analyze
    analyze_payload = {
        "user_id": "test_user_endpoint",
        "current_skills": ["Python", "SQL"],
        "job_required_skills": ["Python", "SQL", "Docker", "System Design"],
        "target_role": "Backend Engineer",
    }
    res_analyze = client.post("/api/v1/skills/analyze", json=analyze_payload)
    assert res_analyze.status_code == 200
    assert "matched_skills" in res_analyze.json()
    assert "skill_gaps" in res_analyze.json()

    # POST /api/v1/skills/gaps
    gap_payload = {
        "user_id": "test_user_endpoint",
        "current_skills": ["JavaScript"],
        "job_required_skills": ["JavaScript", "TypeScript", "React"],
        "target_role": "Frontend Developer",
    }
    res_gaps = client.post("/api/v1/skills/gaps", json=gap_payload)
    assert res_gaps.status_code == 200
    assert "TypeScript" in res_gaps.json()["skill_gaps"]


# ==========================================
# 4. JOB INTELLIGENCE ENDPOINTS
# ==========================================
def test_jobs_create_get_list_match_and_delete():
    mock_job = {
        "job_id": "job_mock_001",
        "user_id": "test_user_endpoint",
        "title": "Full Stack Developer",
        "company": "Apex Labs",
        "location": "San Francisco, CA",
        "job_url": "https://example.com/job",
        "description": "Full stack role requiring React and Python.",
        "required_skills": ["React", "Python", "SQL"],
        "preferred_skills": ["Docker"],
        "experience_requirements": ["2 years"],
        "qualifications": ["Bachelor's in CS"],
        "responsibilities": ["Build web apps"],
        "keywords": ["React", "Python", "SQL", "Docker"],
        "created_at": None,
        "updated_at": None,
    }

    with patch("backend.services.job_service.FirestoreDatabase.create") as mock_create, \
         patch("backend.services.job_service.FirestoreDatabase.get") as mock_get_svc, \
         patch("backend.services.job_service.FirestoreDatabase.list") as mock_list, \
         patch("backend.services.job_service.FirestoreDatabase.delete") as mock_del, \
         patch("backend.api.routes.jobs.FirestoreDatabase.get") as mock_get_route, \
         patch("backend.api.routes.jobs.FirestoreDatabase.update") as mock_upd_route:

        mock_create.return_value = "job_mock_001"
        mock_get_svc.return_value = mock_job
        mock_get_route.return_value = mock_job
        mock_list.return_value = [mock_job]

        # POST /api/v1/jobs
        create_payload = {
            "user_id": "test_user_endpoint",
            "title": "Full Stack Developer",
            "company": "Apex Labs",
            "location": "San Francisco, CA",
            "description": "Full stack role",
            "required_skills": ["React", "Python", "SQL"],
            "preferred_skills": ["Docker"],
        }
        res_create = client.post("/api/v1/jobs", json=create_payload)
        assert res_create.status_code == 200
        assert res_create.json()["title"] == "Full Stack Developer"

        # GET /api/v1/jobs
        res_list = client.get("/api/v1/jobs?user_id=test_user_endpoint")
        assert res_list.status_code == 200
        assert res_list.json()["total"] >= 1

        # GET /api/v1/jobs/{job_id}
        res_get = client.get("/api/v1/jobs/job_mock_001?user_id=test_user_endpoint")
        assert res_get.status_code == 200
        assert res_get.json()["job_id"] == "job_mock_001"

        # POST /api/v1/jobs/{job_id}/match
        match_payload = {
            "user_id": "test_user_endpoint",
            "candidate_skills": ["React", "Python", "SQL", "Docker"],
            "education": "Bachelor's in CS",
            "experience_years": 2.5,
            "target_role": "Full Stack Developer",
        }
        res_match = client.post("/api/v1/jobs/job_mock_001/match", json=match_payload)
        assert res_match.status_code == 200
        assert res_match.json()["job_match_score"] >= 80.0

        # POST /api/v1/jobs/{job_id}/eligibility
        res_elig = client.post("/api/v1/jobs/job_mock_001/eligibility", json=match_payload)
        assert res_elig.status_code == 200
        assert res_elig.json()["eligible"] is True

        # POST /api/v1/jobs/{job_id}/analyze
        res_ana = client.post(
            "/api/v1/jobs/job_mock_001/analyze",
            json={"user_id": "test_user_endpoint", "target_role": "Full Stack Developer"},
        )
        assert res_ana.status_code == 200

        # DELETE /api/v1/jobs/{job_id}
        res_del = client.delete("/api/v1/jobs/job_mock_001?user_id=test_user_endpoint")
        assert res_del.status_code == 200


# ==========================================
# 5. RESUME INTELLIGENCE ENDPOINTS
# ==========================================
def test_resume_upload_analyze_and_ats():
    pdf_content = b"%PDF-1.4\n1 0 obj<<>>endobj\ntrailer<<>>\n%%EOF"

    mock_resume_doc = {
        "resume_id": "res_mock_001",
        "user_id": "test_user_endpoint",
        "filename": "john_doe_resume.pdf",
        "file_type": "pdf",
        "page_count": 1,
        "status": "parsed",
        "storage_path": "users/test/resumes/res_mock_001.pdf",
        "text": (
            "John Doe\nEmail: john@example.com\nPhone: (555) 123-4567\n"
            "Summary: Senior Software Engineer with 5+ years experience.\n"
            "Experience: Spearheaded backend microservices and reduced latency by 35%.\n"
            "Education: Bachelor of Science in Computer Science.\n"
            "Skills: Python, FastAPI, Docker, SQL, PostgreSQL, REST APIs, Git."
        ),
        "created_at": "2026-09-26T00:00:00Z",
        "updated_at": "2026-09-26T00:00:00Z",
    }

    mock_job_doc = {
        "job_id": "job_mock_001",
        "user_id": "test_user_endpoint",
        "title": "Backend Engineer",
        "required_skills": ["Python", "SQL", "FastAPI"],
        "preferred_skills": ["Docker"],
        "keywords": ["Python", "SQL", "FastAPI"],
    }

    with patch("backend.services.resume_service.ResumeService.process_resume") as mock_proc, \
         patch("backend.database.firestore.FirestoreDatabase.get") as mock_get, \
         patch("backend.database.firestore.FirestoreDatabase.list") as mock_list, \
         patch("backend.database.firestore.FirestoreDatabase.update") as mock_upd, \
         patch("backend.database.firestore.FirestoreDatabase.delete") as mock_del:

        mock_proc.return_value = MagicMock(
            resume_id="res_mock_001",
            user_id="test_user_endpoint",
            filename="sample_resume.pdf",
            file_type="pdf",
            page_count=1,
            status="parsed",
            storage_path="users/test/res_mock_001.pdf",
        )
        def mock_get_side_effect(collection, document_id):
            if collection == "resumes":
                return mock_resume_doc
            if collection == "jobs":
                return mock_job_doc
            return None

        mock_get.side_effect = mock_get_side_effect
        mock_list.return_value = [mock_resume_doc]

        # POST /api/v1/resumes/upload
        res_upload = client.post(
            "/api/v1/resumes/upload",
            data={"user_id": "test_user_endpoint"},
            files={"file": ("sample_resume.pdf", io.BytesIO(pdf_content), "application/pdf")},
        )
        assert res_upload.status_code == 200
        assert res_upload.json()["resume_id"] == "res_mock_001"

        # GET /api/v1/resumes
        res_list = client.get("/api/v1/resumes?user_id=test_user_endpoint")
        assert res_list.status_code == 200

        # GET /api/v1/resumes/{id}
        res_detail = client.get("/api/v1/resumes/res_mock_001?user_id=test_user_endpoint")
        assert res_detail.status_code == 200
        assert res_detail.json()["resume_id"] == "res_mock_001"

        # POST /api/v1/resumes/{id}/analyze
        res_analyze = client.post(
            "/api/v1/resumes/res_mock_001/analyze",
            json={"user_id": "test_user_endpoint", "target_role": "Backend Developer"},
        )
        assert res_analyze.status_code == 200
        data_ana = res_analyze.json()
        assert data_ana["resume_score"] > 0
        assert data_ana["is_valid_resume"] is True

        # POST /api/v1/resumes/{id}/ats
        res_ats = client.post(
            "/api/v1/resumes/res_mock_001/ats",
            json={"user_id": "test_user_endpoint", "job_id": "job_mock_001"},
        )
        assert res_ats.status_code == 200
        assert "ats_score" in res_ats.json()

        # DELETE /api/v1/resumes/{id}
        res_del = client.delete("/api/v1/resumes/res_mock_001?user_id=test_user_endpoint")
        assert res_del.status_code == 200


# ==========================================
# 6. PREPARATION & ASSESSMENT ENDPOINTS
# ==========================================
def test_preparation_and_assessment_endpoints():
    user_id = "test_user_endpoint"
    headers = {"X-User-ID": user_id}

    # POST /api/v1/preparation/plan
    plan_payload = {
        "user_id": user_id,
        "target_role": "Backend Engineer",
        "current_skills": ["Python", "SQL"],
        "skill_gaps": ["System Design", "Docker"],
        "available_time": 60,
    }
    res_plan = client.post("/api/v1/preparation/plan", json=plan_payload, headers=headers)
    assert res_plan.status_code == 200
    assert len(res_plan.json()["daily_plan"]) > 0

    # GET /api/v1/preparation/today
    res_today = client.get("/api/v1/preparation/today", headers=headers)
    assert res_today.status_code == 200
    assert "tasks" in res_today.json()

    # GET /api/v1/preparation/progress
    res_prog = client.get("/api/v1/preparation/progress", headers=headers)
    assert res_prog.status_code == 200
    assert "completion" in res_prog.json()

    # GET /api/v1/preparation/weak-topics
    res_weak = client.get("/api/v1/preparation/weak-topics", headers=headers)
    assert res_weak.status_code == 200

    # POST /api/v1/preparation/assessment
    asmt_payload = {
        "user_id": user_id,
        "category": "DSA",
        "topic": "Arrays & Hashing",
        "difficulty": "medium",
        "number_of_questions": 4,
        "duration": 20,
        "target_role": "Backend Engineer",
    }
    res_asmt = client.post("/api/v1/preparation/assessment", json=asmt_payload, headers=headers)
    assert res_asmt.status_code == 200
    asmt_data = res_asmt.json()
    assert len(asmt_data["questions"]) == 4

    # POST /api/v1/preparation/assessment/submit
    submit_payload = {
        "assessment_id": asmt_data["assessment_id"],
        "user_id": user_id,
        "answers": {
            asmt_data["questions"][0]["question_id"]: asmt_data["questions"][0]["correct_answer"],
            asmt_data["questions"][1]["question_id"]: "Wrong Answer",
        },
        "time_taken": 12,
    }
    res_submit = client.post("/api/v1/preparation/assessment/submit", json=submit_payload)
    assert res_submit.status_code == 200
    report_data = res_submit.json()
    assert "passed_questions" in report_data
    assert "failed_questions" in report_data
    assert "skipped_questions" in report_data

    # POST /api/v1/preparation/assessment/reattempt-incomplete
    reattempt_payload = {
        "user_id": user_id,
        "assessment_id": asmt_data["assessment_id"],
        "category": "DSA",
        "specific_question_ids": [q["question_id"] for q in report_data["failed_questions"] + report_data["skipped_questions"]],
    }
    res_reattempt = client.post("/api/v1/preparation/assessment/reattempt-incomplete", json=reattempt_payload)
    assert res_reattempt.status_code == 200

    # GET /api/v1/preparation/reports
    res_reports = client.get("/api/v1/preparation/reports", headers=headers)
    assert res_reports.status_code == 200
    assert "reports" in res_reports.json()

    # POST /api/v1/preparation/performance
    res_perf = client.post("/api/v1/preparation/performance", json=[
        {"score": 80.0, "time_spent": 15, "category": "DSA"},
        {"score": 90.0, "time_spent": 20, "category": "Technical"},
    ])
    assert res_perf.status_code == 200
    assert res_perf.json()["score"] == 85.0

    # POST /api/v1/preparation/reassess
    res_reassess = client.post("/api/v1/preparation/reassess", json={
        "topic": "Dynamic Programming",
        "previous_score": 50.0,
        "new_score": 85.0,
    })
    assert res_reassess.status_code == 200
    assert res_reassess.json()["status"] == "improved"

    # POST /api/v1/preparation/recommendation
    res_rec = client.post("/api/v1/preparation/recommendation", json={
        "target_role": "Backend Engineer",
        "skill_gaps": ["Docker"],
        "current_skills": ["Python"],
        "available_time": 45,
    })
    assert res_rec.status_code == 200


# ==========================================
# 7. CAREER MANAGER & WHAT-IF ENDPOINTS
# ==========================================
def test_career_and_digital_twin_endpoints():
    user_id = "test_user_endpoint"
    headers = {"X-User-ID": user_id}

    # Setup state
    career_states[user_id] = CareerState(
        user_id=user_id,
        target_role="Software Engineer",
        digital_twin_score=82.5,
        resume_score=85.0,
        dsa_score=80.0,
        aptitude_score=75.0,
        communication_score=80.0,
        technical_score=85.0,
        interview_score=70.0,
        job_match_score=90.0,
        metadata={
            "digital_twin": {"readiness_score": 82.5, "weakest_area": "interview"},
            "what_if": {"dsa": 85.0},
        },
    )

    # GET /api/v1/career/readiness
    res_readiness = client.get("/api/v1/career/readiness", headers=headers)
    assert res_readiness.status_code == 200
    assert res_readiness.json()["user_id"] == user_id

    # POST /api/v1/career/what-if
    whatif_payload = {
        "scores": {
            "resume": 85.0,
            "dsa": 80.0,
            "aptitude": 75.0,
            "communication": 80.0,
            "technical": 85.0,
            "interview": 70.0,
            "job_match": 90.0,
        }
    }
    res_whatif = client.post("/api/v1/career/what-if", json=whatif_payload, headers=headers)
    assert res_whatif.status_code == 200

    # POST /api/v1/career/next-action
    res_action = client.post("/api/v1/career/next-action", headers=headers)
    assert res_action.status_code == 200

    # GET /api/v1/digital-twin
    res_twin = client.get("/api/v1/digital-twin", headers=headers)
    assert res_twin.status_code == 200
    assert res_twin.json()["readiness_score"] == 82.5
