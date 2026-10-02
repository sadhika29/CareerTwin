import io
from unittest.mock import MagicMock, patch
from fastapi.testclient import TestClient

from backend.main import app
from backend.models.resume import Resume

client = TestClient(app)


def test_resume_upload_endpoint():
    """Test POST /api/v1/resumes/upload with a multipart file upload."""
    mock_resume = Resume(
        resume_id="res_test_123",
        user_id="usr_1",
        filename="test_resume.pdf",
        file_type="pdf",
        text="Full Stack Developer with React, Python, and SQL expertise.",
        page_count=1,
        status="success",
        storage_path="users/usr_1/resumes/res_test_123/test_resume.pdf",
    )

    with patch("backend.api.routes.resume.ResumeService.process_resume", return_value=mock_resume):
        fake_pdf_content = b"%PDF-1.4 Fake PDF Content"
        files = {
            "file": ("test_resume.pdf", io.BytesIO(fake_pdf_content), "application/pdf"),
        }
        data = {
            "user_id": "usr_1",
        }

        response = client.post("/api/v1/resumes/upload", data=data, files=files)
        assert response.status_code == 200
        result = response.json()
        assert result["resume_id"] == "res_test_123"
        assert result["filename"] == "test_resume.pdf"
        assert result["file_type"] == "pdf"
        assert result["status"] == "success"


def test_resume_upload_invalid_extension():
    """Test POST /api/v1/resumes/upload rejects unsupported file types."""
    files = {
        "file": ("test_resume.txt", io.BytesIO(b"Unsupported text file"), "text/plain"),
    }
    data = {"user_id": "usr_1"}
    response = client.post("/api/v1/resumes/upload", data=data, files=files)
    assert response.status_code == 400
    assert "Only PDF and DOCX files are supported" in response.json()["detail"]


def test_get_resume_by_id_endpoint():
    """Test GET /api/v1/resumes/{resume_id}."""
    with patch("backend.api.routes.resume.FirestoreDatabase.get") as mock_get:
        mock_get.return_value = {
            "resume_id": "res_1",
            "user_id": "usr_1",
            "filename": "my_resume.pdf",
            "file_type": "pdf",
            "page_count": 1,
            "status": "success",
            "storage_path": "users/usr_1/resumes/res_1/my_resume.pdf",
            "text": "Experienced Python and React Engineer.",
            "skills": ["Python", "React", "SQL"],
            "analysis": {"summary": "Strong software background"},
            "ats_analysis": {"ats_score": 85.0},
        }

        response = client.get("/api/v1/resumes/res_1?user_id=usr_1")
        assert response.status_code == 200
        data = response.json()
        assert data["resume_id"] == "res_1"
        assert data["filename"] == "my_resume.pdf"
        assert "Python" in data["skills"]
        assert data["text"] == "Experienced Python and React Engineer."


def test_get_resume_not_found():
    """Test GET /api/v1/resumes/{resume_id} returns 404 if not found."""
    with patch("backend.api.routes.resume.FirestoreDatabase.get", return_value=None):
        response = client.get("/api/v1/resumes/non_existent?user_id=usr_1")
        assert response.status_code == 404


def test_analyze_resume_endpoint():
    """Test POST /api/v1/resumes/{resume_id}/analyze."""
    from backend.schemas.resume import ResumeAnalysisResponse

    mock_analysis_result = ResumeAnalysisResponse(
        resume_score=82.0,
        ats_score=78.0,
        resume_skills=["Python", "FastAPI", "SQL"],
        resume_strengths=["Strong backend API experience"],
        resume_weaknesses=["Lacks containerization details"],
        missing_sections=[],
        keyword_gaps=["Docker", "Kubernetes"],
        recommendations=["Add Docker containerization bullets"],
        keyword_match=80.0,
        skill_match=85.0,
        experience_relevance=75.0,
        section_completeness=90.0,
        missing_keywords=["Docker"],
    )

    with patch("backend.api.routes.resume.ResumeService.analyze_resume", return_value=mock_analysis_result):
        payload = {
            "user_id": "usr_1",
            "target_role": "Backend Engineer",
            "target_job_id": "job_1",
        }
        response = client.post("/api/v1/resumes/res_1/analyze", json=payload)
        assert response.status_code == 200
        data = response.json()
        assert data["resume_score"] == 82.0
        assert data["ats_score"] == 78.0
        assert "Python" in data["resume_skills"]
        assert "Docker" in data["keyword_gaps"]



def test_resume_ats_endpoint():
    """Test POST /api/v1/resumes/{resume_id}/ats."""
    with patch("backend.api.routes.resume.FirestoreDatabase.get") as mock_get:
        def side_effect(collection, document_id):
            if collection == "resumes":
                return {
                    "resume_id": "res_1",
                    "user_id": "usr_1",
                    "text": "Experienced Python and FastAPI backend developer with SQL skills.",
                    "skills": ["Python", "FastAPI", "SQL"],
                }
            elif collection == "jobs":
                return {
                    "job_id": "job_1",
                    "user_id": "usr_1",
                    "required_skills": ["Python", "FastAPI"],
                    "keywords": ["Python", "FastAPI", "SQL"],
                    "experience_requirements": ["backend"],
                }
            return None

        mock_get.side_effect = side_effect

        with patch("backend.api.routes.resume.FirestoreDatabase.update", return_value=None):
            payload = {"user_id": "usr_1", "job_id": "job_1"}
            resp = client.post("/api/v1/resumes/res_1/ats", json=payload)
            assert resp.status_code == 200
            data = resp.json()
            assert data["ats_score"] > 60.0
            assert data["skill_match"] == 100.0


def test_list_resumes_endpoint():
    """Test GET /api/v1/resumes?user_id=usr_1."""
    with patch("backend.api.routes.resume.FirestoreDatabase.list") as mock_list:
        mock_list.return_value = [
            {
                "resume_id": "r1",
                "user_id": "usr_1",
                "filename": "my_resume.pdf",
                "file_type": "pdf",
                "page_count": 1,
                "status": "success",
                "storage_path": "path/to/res",
            }
        ]
        resp = client.get("/api/v1/resumes?user_id=usr_1")
        assert resp.status_code == 200
        data = resp.json()
        assert data["total"] == 1
        assert data["resumes"][0]["filename"] == "my_resume.pdf"
