"""
End-to-end verification script for Resume Analysis & Persistence in CareerTwin.
Verifies all 6 test scenarios (A through F) outlined in the requirements.
"""

import asyncio
import os
import sys

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "../..")))

from fastapi.testclient import TestClient
from backend.main import app
from backend.database.firestore import FirestoreDatabase
from backend.services.resume_service import ResumeService

client = TestClient(app)

def test_full_workflow():
    print("=" * 60)
    print("Running CareerTwin Persistence & Missing Keywords Verification")
    print("=" * 60)

    user_a = "test_user_alice_456"
    user_b = "test_user_bob_789"
    auth_headers_a = {"X-User-ID": user_a}
    auth_headers_b = {"X-User-ID": user_b}

    # -------------------------------------------------------------
    # Scenario A: Resume Upload & Persistence
    # -------------------------------------------------------------
    print("\n[Scenario A] Testing Resume Upload & Firestore Persistence...")
    import pymupdf
    pdf_doc = pymupdf.open()
    p = pdf_doc.new_page()
    p.insert_text((50, 50), "Senior Full Stack Software Engineer\nSkills: Python, React, TypeScript, FastApi, Docker, PostgreSQL\nExperience: 5 years designing scalable microservices and cloud backends.\nEducation: B.S. in Computer Science.")
    sample_pdf_bytes = pdf_doc.tobytes()
    pdf_doc.close()
    
    upload_res = client.post(
        "/resumes/upload",
        files={"file": ("alice_resume.pdf", sample_pdf_bytes, "application/pdf")},
        headers=auth_headers_a
    )
    assert upload_res.status_code == 200, f"Upload failed: {upload_res.text}"
    upload_data = upload_res.json()
    resume_id = upload_data["resume_id"]
    print(f" -> Upload Success: resume_id={resume_id}, filename={upload_data['filename']}")
    
    # Verify metadata in Firestore
    fs = FirestoreDatabase()
    doc = fs.get("resumes", resume_id)
    assert doc is not None, "Resume record not found in Firestore!"
    assert doc["user_id"] == user_a, f"Expected owner {user_a}, got {doc.get('user_id')}"
    print(f" -> Verified Firestore document in 'resumes/{resume_id}' with user_id={user_a}")

    # -------------------------------------------------------------
    # Scenario B: Resume Analysis with Job Description (Missing Keywords)
    # -------------------------------------------------------------
    print("\n[Scenario B] Testing Resume Analysis & Missing Keywords derivation...")
    job_desc = (
        "We are looking for a Senior Engineer with deep expertise in Python, React, "
        "Unit Testing, CI/CD, Kubernetes, and Microservices."
    )
    analyze_res = client.post(
        f"/resumes/{resume_id}/analyze",
        json={"user_id": user_a, "job_description": job_desc, "target_role": "Senior Engineer"},
        headers=auth_headers_a
    )
    assert analyze_res.status_code == 200, f"Analysis failed: {analyze_res.text}"
    analysis = analyze_res.json()
    assert analysis["has_target_job"] is True
    assert "missing_keywords" in analysis
    missing_kws = analysis["missing_keywords"]
    print(f" -> Analysis complete. Missing keywords derived: {missing_kws}")
    assert any(k in ["Unit Testing", "CI/CD", "Kubernetes"] for k in missing_kws), "Expected missing keywords not found"

    # Test Save Analysis button endpoint
    save_payload = {
        "user_id": user_a,
        "resume_id": resume_id,
        "filename": "alice_resume.pdf",
        "job_description": job_desc,
        "target_role": "Senior Engineer",
        "ats_score": analysis.get("ats_score", 85.0),
        "resume_score": analysis.get("resume_score", 90.0),
        "extracted_skills": analysis.get("resume_skills", ["Python", "React"]),
        "missing_keywords": missing_kws,
        "recommendations": [r if isinstance(r, str) else r.get("recommendation", "") for r in analysis.get("recommendations", [])]
    }
    save_res = client.post(
        "/resumes/analyses/save",
        json=save_payload,
        headers=auth_headers_a
    )
    assert save_res.status_code == 200, f"Save analysis failed: {save_res.text}"
    saved_meta = save_res.json()
    analysis_id = saved_meta["analysis_id"]
    print(f" -> Save Analysis Success: analysis_id={analysis_id}")

    # Verify Firestore write in collection 'analyses'
    analysis_doc = fs.get("analyses", analysis_id)
    assert analysis_doc is not None, "Saved analysis document not found in Firestore!"
    assert analysis_doc["user_id"] == user_a
    assert analysis_doc["resume_id"] == resume_id
    print(f" -> Verified Firestore document in 'analyses/{analysis_id}' with user_id={user_a}")

    # -------------------------------------------------------------
    # Scenario C & D: Navigation Away, Return, Refresh & Re-login Restoration
    # -------------------------------------------------------------
    print("\n[Scenario C & D] Testing Restoration on navigation/re-login...")
    # Simulate frontend mounting / route change: fetching recent uploads
    list_res = client.get("/resumes", headers=auth_headers_a)
    assert list_res.status_code == 200
    resumes_list = list_res.json().get("resumes", [])
    assert any(r["resume_id"] == resume_id for r in resumes_list)
    print(f" -> Successfully listed user {user_a}'s resumes ({len(resumes_list)} found)")

    # Simulate frontend mounting / route change: fetching saved analyses
    saved_res = client.get("/resumes/analyses/saved", headers=auth_headers_a)
    assert saved_res.status_code == 200
    saved_list = saved_res.json().get("analyses", [])
    assert any(a["analysis_id"] == analysis_id for a in saved_list)
    print(f" -> Successfully listed user {user_a}'s saved analyses ({len(saved_list)} found)")

    # Retrieve specific analysis record
    get_analysis_res = client.get(f"/resumes/analyses/{analysis_id}", headers=auth_headers_a)
    assert get_analysis_res.status_code == 200
    retrieved_analysis = get_analysis_res.json()
    assert retrieved_analysis["analysis_id"] == analysis_id
    assert retrieved_analysis["missing_keywords"] == missing_kws
    print(f" -> Successfully restored full analysis record {analysis_id} without re-running AI model")

    # -------------------------------------------------------------
    # Scenario E: Multiple Resumes and Analyses
    # -------------------------------------------------------------
    print("\n[Scenario E] Testing Multiple Resumes and Analyses...")
    pdf_doc2 = pymupdf.open()
    p2 = pdf_doc2.new_page()
    p2.insert_text((50, 50), "Data Scientist\nSkills: Python, Pandas, PyTorch, SQL\nExperience: ML models.")
    sample_pdf_bytes2 = pdf_doc2.tobytes()
    pdf_doc2.close()
    upload_res2 = client.post(
        "/resumes/upload",
        files={"file": ("alice_ds_resume.pdf", sample_pdf_bytes2, "application/pdf")},
        headers=auth_headers_a
    )
    assert upload_res2.status_code == 200
    resume_id2 = upload_res2.json()["resume_id"]
    
    save_payload2 = {
        "user_id": user_a,
        "resume_id": resume_id2,
        "filename": "alice_ds_resume.pdf",
        "job_description": "Looking for Machine Learning Engineer with MLOps and PyTorch",
        "target_role": "ML Engineer",
        "ats_score": 78.0,
        "resume_score": 82.0,
        "extracted_skills": ["Python", "PyTorch"],
        "missing_keywords": ["MLOps"],
        "recommendations": ["Add deployment metrics"]
    }
    save_res2 = client.post("/resumes/analyses/save", json=save_payload2, headers=auth_headers_a)
    assert save_res2.status_code == 200
    analysis_id2 = save_res2.json()["analysis_id"]
    assert analysis_id2 != analysis_id, "Analyses must be separate"
    print(f" -> Uploaded 2nd resume ({resume_id2}) and saved distinct analysis ({analysis_id2})")

    # -------------------------------------------------------------
    # Scenario F: Failure Handling & Ownership Enforcement
    # -------------------------------------------------------------
    print("\n[Scenario F] Testing Ownership Enforcement and Failure Handling...")
    # User B should NOT be able to view or delete User A's resume
    unauth_get = client.get(f"/resumes/{resume_id}", headers=auth_headers_b)
    assert unauth_get.status_code in [403, 404], f"Expected 403 or 404, got {unauth_get.status_code}"
    print(f" -> Verified User B cannot access User A's resume ({unauth_get.status_code})")

    # User B should NOT be able to view User A's saved analysis
    unauth_analysis_get = client.get(f"/resumes/analyses/{analysis_id}", headers=auth_headers_b)
    assert unauth_analysis_get.status_code in [403, 404], f"Expected 403 or 404, got {unauth_analysis_get.status_code}"
    print(f" -> Verified User B cannot access User A's analysis ({unauth_analysis_get.status_code})")

    # Cleanup test records
    fs.delete("resumes", resume_id)
    fs.delete("resumes", resume_id2)
    fs.delete("analyses", analysis_id)
    fs.delete("analyses", analysis_id2)
    print(" -> Cleaned up test documents in Firestore")

    print("\nALL SCENARIOS A THROUGH F PASSED SUCCESSFULLY!\n")

if __name__ == "__main__":
    test_full_workflow()
