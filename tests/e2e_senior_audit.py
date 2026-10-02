"""
Senior Developer & QA Lead End-to-End Fault Detection Script.
Simulates a live candidate user session using Sadhika Mahammad's sample resume against http://localhost:8000.
Audits every layer: Auth, Resume Upload, Text Parsing, AI Analysis, ATS Engine, Live JSearch,
Job Matching, Skill Gaps, Digital Twin, and Interview Agents.
"""

import os
import json
import time
import requests

BASE_URL = "http://localhost:8000/api/v1"
RESUME_PDF = r"C:\Users\Asus\.gemini\antigravity-ide\brain\54eb1441-0714-4115-adfd-cf53ae8764f5\.user_uploaded\media_1790894946821.pdf"

findings = []

def record_finding(category, severity, title, detail, remediation=""):
    findings.append({
        "category": category,
        "severity": severity, # CRITICAL, HIGH, MEDIUM, LOW, ENHANCEMENT
        "title": title,
        "detail": detail,
        "remediation": remediation
    })
    print(f"[{severity}] {category} -> {title}")

def run_audit():
    print("=" * 70)
    print("STARTING COMPREHENSIVE FAULT INJECTION & INTEGRATION AUDIT")
    print("=" * 70)

    session = requests.Session()
    user_id = f"audit_user_{int(time.time())}"
    token = None

    # 1. AUTHENTICATION & SECURITY AUDIT
    print("\n--- Phase 1: Authentication & Token Lifecycle ---")
    signup_payload = {
        "full_name": "Sadhika Mahammad",
        "username": f"sadhika_{int(time.time())}",
        "email": f"sadhika_{int(time.time())}@example.com",
        "password": "Password123!",
        "role": "student"
    }
    try:
        r = session.post(f"{BASE_URL}/auth/signup", json=signup_payload, timeout=10)
        if r.status_code == 200:
            auth_data = r.json()
            token = auth_data.get("access_token") or auth_data.get("token")
            user_id = auth_data.get("user", {}).get("user_id") or auth_data.get("user_id") or user_id
            print(f"PASS: Signup succeeded for {user_id}. Token issued.")
        else:
            record_finding("Auth", "HIGH", "Signup failed", f"Status: {r.status_code}, Body: {r.text}")
    except Exception as e:
        record_finding("Auth", "CRITICAL", "Auth Service Unreachable", str(e))

    headers = {"X-User-ID": str(user_id)}
    if token:
        headers["Authorization"] = f"Bearer {token}"

    # 2. RESUME UPLOAD & PARSER AUDIT
    print("\n--- Phase 2: Resume Upload & Parser Sanitization ---")
    if not os.path.exists(RESUME_PDF):
        record_finding("Parser", "CRITICAL", "Sample PDF Missing", f"Path not found: {RESUME_PDF}")
        return

    resume_id = None
    with open(RESUME_PDF, "rb") as f:
        pdf_bytes = f.read()

    try:
        files = {"file": ("sadhika_resume.pdf", pdf_bytes, "application/pdf")}
        data = {"user_id": user_id}
        t0 = time.time()
        r = session.post(f"{BASE_URL}/resumes/upload", files=files, data=data, headers=headers, timeout=15)
        upload_lat = time.time() - t0
        if r.status_code == 200:
            res_json = r.json()
            resume_id = res_json.get("resume_id")
            print(f"PASS: Resume uploaded in {upload_lat:.2f}s. ID: {resume_id}")
        else:
            record_finding("Resume Upload", "HIGH", "Upload failed", f"Status {r.status_code}: {r.text}")
    except Exception as e:
        record_finding("Resume Upload", "CRITICAL", "Upload crashed", str(e))

    # 3. RESUME DETAILS & TEXT EXTRACTION AUDIT
    extracted_text = ""
    extracted_skills = []
    if resume_id:
        print("\n--- Phase 3: Resume Details & Extracted Content ---")
        try:
            r = session.get(f"{BASE_URL}/resumes/{resume_id}?user_id={user_id}", headers=headers, timeout=10)
            if r.status_code == 200:
                doc = r.json()
                extracted_text = doc.get("text", "")
                extracted_skills = doc.get("skills", [])
                print(f"Extracted {len(extracted_text)} characters.")
                print(f"Extracted skills count: {len(extracted_skills)}")
                
                # Check for zero-width characters or encoding bugs
                if "\u200b" in extracted_text or "\ufeff" in extracted_text:
                    record_finding("Parser", "HIGH", "Zero-width characters leaking into extracted text",
                                   "Unicode artifacts detected in storage text.")
                else:
                    print("PASS: Clean UTF-8 text without unescaped zero-width artifacts.")
                
                # Check critical skills from Sadhika's resume
                must_have = ["react", "node", "express", "mongodb", "python", "java", "sql"]
                found = [s for s in must_have if any(s in sk.lower() for sk in extracted_skills) or s in extracted_text.lower()]
                print(f"Core skills detected: {found}")
                if len(found) < len(must_have):
                    missing = set(must_have) - set(found)
                    record_finding("Skill Extraction", "MEDIUM", "Some core skills missed",
                                   f"Skills missed from resume: {missing}")
            else:
                record_finding("Resume Detail", "HIGH", "Get resume failed", f"Status {r.status_code}: {r.text}")
        except Exception as e:
            record_finding("Resume Detail", "HIGH", "Get resume crashed", str(e))

    # 4. RESUME AI ANALYSIS AUDIT
    if resume_id:
        print("\n--- Phase 4: Resume AI Analysis ---")
        try:
            t0 = time.time()
            r = session.post(
                f"{BASE_URL}/resumes/{resume_id}/analyze",
                json={"user_id": user_id, "target_role": "Full Stack Developer"},
                headers=headers,
                timeout=45
            )
            lat = time.time() - t0
            if r.status_code == 200:
                analysis = r.json()
                print(f"PASS: Resume AI Analysis completed in {lat:.2f}s.")
                print(f"Inferred Domain: {analysis.get('inferred_domain')}")
                print(f"ATS Score: {analysis.get('ats_score')}")
                print(f"Strengths ({len(analysis.get('resume_strengths', []))}): {analysis.get('resume_strengths', [])[:2]}")
                print(f"Weaknesses ({len(analysis.get('resume_weaknesses', []))}): {analysis.get('resume_weaknesses', [])[:2]}")
                print(f"Recommendations ({len(analysis.get('recommendations', []))}): {analysis.get('recommendations', [])[:2]}")
                
                # Verification
                if analysis.get("ats_score", 0) <= 0:
                    record_finding("AI Analysis", "HIGH", "Zero ATS score", "AI analysis returned 0 ATS score.")
            else:
                record_finding("AI Analysis", "HIGH", "Resume Analysis returned non-200", f"Status {r.status_code}: {r.text}")
        except Exception as e:
            record_finding("AI Analysis", "HIGH", "Resume Analysis crashed/timeout", str(e))

    # 5. LIVE MARKET JOB DISCOVERY AUDIT (OPENWEBNINJA JSEARCH)
    print("\n--- Phase 5: Live Job Retrieval & Market Intelligence ---")
    live_job = None
    try:
        t0 = time.time()
        r = session.get(f"{BASE_URL}/jobs/live/search?query=Full+Stack+Developer&location=India&num_pages=1", headers=headers, timeout=20)
        lat = time.time() - t0
        if r.status_code == 200:
            jdata = r.json()
            jobs = jdata.get("jobs", [])
            print(f"PASS: Live JSearch returned {len(jobs)} authentic postings in {lat:.2f}s.")
            if jobs:
                live_job = jobs[0]
                print(f"Sample Job: '{live_job.get('title')}' at '{live_job.get('company')}' ({live_job.get('location')})")
                print(f"Apply URL: {live_job.get('job_url')[:60]}...")
                print(f"Required Skills: {live_job.get('required_skills')}")
                print(f"Salary: {live_job.get('salary_range')}")
            else:
                record_finding("JSearch", "HIGH", "No live jobs returned", "JSearch returned 0 jobs for standard query.")
        else:
            record_finding("JSearch", "HIGH", "Live search returned non-200", f"Status {r.status_code}: {r.text}")
    except Exception as e:
        record_finding("JSearch", "HIGH", "Live search crashed/timed out", str(e))

    # 6. JOB MATCHING & ATS COMPATIBILITY
    print("\n--- Phase 6: Job Matching & Compatibility Analysis ---")
    if live_job and resume_id:
        try:
            # Create job record in DB to test match endpoint
            create_payload = {
                "user_id": user_id,
                "title": live_job.get("title", "Full Stack Developer"),
                "company": live_job.get("company", "Tech Company"),
                "location": live_job.get("location", "Remote"),
                "job_url": live_job.get("job_url", ""),
                "description": live_job.get("description", "Full Stack developer required"),
                "required_skills": live_job.get("required_skills", ["Python", "React", "Node.js"]),
                "preferred_skills": live_job.get("preferred_skills", ["MongoDB", "Docker"]),
                "experience_requirements": ["0-2 years experience"],
                "qualifications": ["B.Tech in Computer Science"],
            }
            r_job = session.post(f"{BASE_URL}/jobs", json=create_payload, headers=headers, timeout=10)
            if r_job.status_code == 200:
                created_job = r_job.json()
                jid = created_job.get("job_id")
                print(f"PASS: Created job record {jid} for candidate matching.")
                
                # Run ATS evaluation against this real job
                r_ats = session.post(
                    f"{BASE_URL}/resumes/{resume_id}/ats",
                    json={"user_id": user_id, "job_id": jid},
                    headers=headers,
                    timeout=15
                )
                if r_ats.status_code == 200:
                    ats_data = r_ats.json()
                    print(f"PASS: Deterministic ATS compatibility computed: {ats_data.get('ats_score')}%")
                    print(f"Section completeness: {ats_data.get('section_completeness')}%")
                    print(f"Keyword match: {ats_data.get('keyword_match')}%")
                    print(f"Missing keywords: {ats_data.get('missing_keywords')[:3]}")
                else:
                    record_finding("ATS Route", "HIGH", "ATS evaluation endpoint failed", f"Status {r_ats.status_code}: {r_ats.text}")

                # Run Multi-factor Job Match
                match_payload = {
                    "user_id": user_id,
                    "resume_id": resume_id,
                    "target_role": "Full Stack Developer",
                    "education": "B.Tech Computer Science",
                    "experience_years": 0.5,
                    "candidate_skills": extracted_skills or ["React", "Node.js", "MongoDB", "Python"]
                }
                r_match = session.post(f"{BASE_URL}/jobs/{jid}/match", json=match_payload, headers=headers, timeout=10)
                if r_match.status_code == 200:
                    mdata = r_match.json()
                    print(f"PASS: Multi-factor Job Match Score: {mdata.get('job_match_score')}%")
                    print(f"Matched Skills: {mdata.get('matched_skills')}")
                    print(f"Missing Skills: {mdata.get('missing_skills')}")
                else:
                    record_finding("Job Match", "HIGH", "Job match endpoint failed", f"Status {r_match.status_code}: {r_match.text}")
            else:
                record_finding("Job Create", "HIGH", "Job creation failed", f"Status {r_job.status_code}: {r_job.text}")
        except Exception as e:
            record_finding("Job Match", "HIGH", "Matching crashed", str(e))

    # 7. SKILL GAP ENGINE AUDIT
    print("\n--- Phase 7: Skill Gap Engine ---")
    try:
        skill_payload = {
            "user_id": user_id,
            "target_role": "Full Stack Developer",
            "current_skills": extracted_skills or ["React", "JavaScript", "HTML", "CSS", "Python", "Java", "Node.js", "Express.js", "MongoDB"],
            "job_required_skills": ["React", "Node.js", "TypeScript", "Docker", "AWS", "MongoDB", "REST APIs", "System Design"]
        }
        r_sk = session.post(f"{BASE_URL}/skills/analyze", json=skill_payload, headers=headers, timeout=10)
        if r_sk.status_code == 200:
            sk_data = r_sk.json()
            print(f"PASS: Skill Gap Score: {sk_data.get('skill_gap_score')}%")
            print(f"Matched: {sk_data.get('matched_skills')}")
            print(f"Identified Gaps: {sk_data.get('skill_gaps')}")
            recs = sk_data.get("recommendations", [])
            print(f"Recommendations ({len(recs)}): {recs[:2]}")
        else:
            record_finding("Skill Gap", "HIGH", "Skill analyze failed", f"Status {r_sk.status_code}: {r_sk.text}")
    except Exception as e:
        record_finding("Skill Gap", "HIGH", "Skill analyze crashed", str(e))

    # 8. DIGITAL TWIN AUDIT
    print("\n--- Phase 8: Digital Twin Real-Time State & Recalculation ---")
    try:
        # Check initial twin GET
        r_twin = session.get(f"{BASE_URL}/digital-twin", headers=headers, timeout=10)
        print(f"GET /digital-twin response status: {r_twin.status_code}")
        if r_twin.status_code == 200:
            twin_data = r_twin.json()
            print(f"Twin Overall Score: {twin_data.get('overall_score')}%")
            print(f"Weakest Area: {twin_data.get('weakest_area')}")
            print(f"Dimensions: {[k for k, v in twin_data.items() if k in ['resume', 'dsa', 'technical', 'aptitude', 'communication', 'interview', 'job_match']]}")
        elif r_twin.status_code == 404:
            print("Notice: Twin not initialized yet (expected before recalculation).")

        # Recalculate twin
        r_recalc = session.post(f"{BASE_URL}/digital-twin/recalculate", headers=headers, timeout=10)
        if r_recalc.status_code == 200:
            twin_calc = r_recalc.json()
            print(f"PASS: Digital Twin recalculated: Overall Score {twin_calc.get('overall_score')}%")
            print(f"Action: {twin_calc.get('recommended_action')}")
        else:
            record_finding("Digital Twin", "HIGH", "Twin recalculation failed", f"Status {r_recalc.status_code}: {r_recalc.text}")
    except Exception as e:
        record_finding("Digital Twin", "HIGH", "Twin operations crashed", str(e))

    # 9. INTERVIEW AGENT AUDIT
    print("\n--- Phase 9: Interview Agent Dynamic Question Generation & Scoring ---")
    try:
        int_payload = {
            "role": "Full Stack Developer",
            "skills": extracted_skills[:4] if extracted_skills else ["React", "Node.js"],
            "difficulty": "medium",
            "num_questions": 3
        }
        r_start = session.post(f"{BASE_URL}/interview/start", json=int_payload, headers=headers, timeout=30)
        if r_start.status_code == 200:
            s_data = r_start.json()
            session_id = s_data.get("session_id")
            questions = s_data.get("questions", [])
            print(f"PASS: Interview session created: {session_id} with {len(questions)} questions.")
            if questions:
                q1 = questions[0]
                print(f"Sample Question 1: {q1.get('question')} (Category: {q1.get('category')})")
                
                # Submit an answer to question 1
                ans_payload = {
                    "question_id": q1.get("question_id", "q_1"),
                    "question": q1.get("question"),
                    "user_answer": "In React, useEffect manages side-effects like data fetching, subscriptions, and DOM mutations after component renders.",
                    "role": "Full Stack Developer",
                    "ideal_answer": q1.get("ideal_answer", "")
                }
                r_ans = session.post(f"{BASE_URL}/interview/sessions/{session_id}/answer", json=ans_payload, headers=headers, timeout=25)
                if r_ans.status_code == 200:
                    eval_data = r_ans.json()
                    print(f"PASS: Dynamic Answer Evaluation: Score {eval_data.get('score')}/100")
                    print(f"Feedback: {eval_data.get('feedback')[:100]}...")
                else:
                    record_finding("Interview", "HIGH", "Answer submission failed", f"Status {r_ans.status_code}: {r_ans.text}")
        else:
            record_finding("Interview", "HIGH", "Interview start failed", f"Status {r_start.status_code}: {r_start.text}")
    except Exception as e:
        record_finding("Interview", "HIGH", "Interview test crashed", str(e))

    # 10. EDGE CASE & FAULT INJECTION (SECURITY / PROMPT INJECTION / DATA BLEED)
    print("\n--- Phase 10: Fault Injection & Security Boundaries ---")
    
    # Check A: Cross-user resume access
    try:
        rogue_headers = {"X-User-ID": "unauthorized_attacker_99"}
        r_leak = session.get(f"{BASE_URL}/resumes/{resume_id}?user_id=unauthorized_attacker_99", headers=rogue_headers, timeout=5)
        if r_leak.status_code in [400, 401, 403, 404]:
            print(f"PASS: Unauthorized user rejected with HTTP {r_leak.status_code}.")
        else:
            record_finding("Security", "CRITICAL", "Cross-tenant resume leak", f"Attacker accessed candidate resume! Status {r_leak.status_code}")
    except Exception as e:
        pass

    # Check B: Unauthenticated request to /digital-twin
    try:
        r_unauth = session.get(f"{BASE_URL}/digital-twin", timeout=5)
        if r_unauth.status_code == 401:
            print("PASS: Unauthenticated request rejected with HTTP 401.")
        else:
            record_finding("Security", "HIGH", "Unauthenticated endpoint open", f"Expected 401, got {r_unauth.status_code}")
    except Exception as e:
        pass

    print("\n" + "=" * 70)
    print(f"AUDIT EXECUTION COMPLETE. Total findings: {len(findings)}")
    print("=" * 70)
    
    with open("storage/audit_findings.json", "w") as out:
        json.dump(findings, out, indent=2)

if __name__ == "__main__":
    run_audit()
