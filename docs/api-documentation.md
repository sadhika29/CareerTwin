# CareerTwin API Documentation — Resume, Job & Skill Intelligence

This document specifies the REST API endpoints provided by the **Career Input Analysis Layer** (Veerendra's module).

Base URL: `http://localhost:8000/api/v1` (also accessible directly via root `/resumes`, `/jobs`, `/skills`).

---

## 1. Resume API

### 1.1 Upload Resume
Upload a PDF or DOCX resume, extract raw text, calculate page count, store file, and create record.

- **Endpoint:** `POST /resumes/upload`
- **Content-Type:** `multipart/form-data`
- **Parameters:**
  - `user_id` (string, required): ID of the user uploading the resume.
  - `file` (binary file, required): PDF or DOCX resume document.
- **Success Response (200 OK):**
```json
{
  "resume_id": "97e68222-1d54-4632-9cb9-c85244585145",
  "user_id": "usr_12345",
  "filename": "john_doe_resume.pdf",
  "file_type": "pdf",
  "page_count": 2,
  "status": "success",
  "storage_path": "storage/resumes/users/usr_12345/resumes/97e68222-1d54-4632-9cb9-c85244585145/john_doe_resume.pdf"
}
```

### 1.2 List User Resumes
List all resumes uploaded by a specific user.

- **Endpoint:** `GET /resumes?user_id={user_id}&limit={limit}`
- **Success Response (200 OK):**
```json
{
  "resumes": [
    {
      "resume_id": "97e68222-1d54-4632-9cb9-c85244585145",
      "user_id": "usr_12345",
      "filename": "john_doe_resume.pdf",
      "file_type": "pdf",
      "page_count": 2,
      "status": "success",
      "storage_path": "storage/resumes/..."
    }
  ],
  "total": 1
}
```

### 1.3 Get Resume Details
Retrieve extracted text, metadata, and stored analysis for a resume.

- **Endpoint:** `GET /resumes/{resume_id}?user_id={user_id}`
- **Success Response (200 OK):**
```json
{
  "resume_id": "97e68222-1d54-4632-9cb9-c85244585145",
  "user_id": "usr_12345",
  "filename": "john_doe_resume.pdf",
  "file_type": "pdf",
  "page_count": 2,
  "status": "success",
  "storage_path": "...",
  "text": "Full extracted resume text...",
  "skills": ["Python", "FastAPI", "Docker", "SQL"],
  "analysis": {},
  "ats_analysis": {}
}
```

### 1.4 Analyze Resume (AI Agent)
Triggers ResumeAgent to analyze content, detect strengths/weaknesses, missing sections, and actionable recommendations.

- **Endpoint:** `POST /resumes/{resume_id}/analyze`
- **Request Body:**
```json
{
  "user_id": "usr_12345",
  "target_role": "Python Backend Developer",
  "target_job_id": "job_998877"
}
```
- **Success Response (200 OK):**
```json
{
  "resume_score": 85.0,
  "ats_score": 78.5,
  "resume_skills": ["Python", "FastAPI", "SQL", "Git"],
  "resume_strengths": ["Clear technical stack", "Detailed project metrics"],
  "resume_weaknesses": ["Missing cloud deployment keywords"],
  "missing_sections": ["Certifications"],
  "keyword_gaps": ["Docker", "Kubernetes", "Redis"],
  "recommendations": ["Add measurable metrics to the e-commerce backend project."]
}
```

### 1.5 Deterministic ATS Score
Calculates ATS metrics by cross-referencing candidate resume text/skills against target job requirements.

- **Endpoint:** `POST /resumes/{resume_id}/ats` (or `POST /resumes/ats-score?resume_id={id}`)
- **Request Body:**
```json
{
  "user_id": "usr_12345",
  "job_id": "job_998877"
}
```
- **Success Response (200 OK):**
```json
{
  "ats_score": 81.25,
  "keyword_match": 85.0,
  "skill_match": 80.0,
  "experience_relevance": 75.0,
  "section_completeness": 100.0,
  "missing_keywords": ["Kubernetes", "AWS"]
}
```

---

## 2. Job API

### 2.1 Create Job Posting
- **Endpoint:** `POST /jobs`
- **Request Body:**
```json
{
  "user_id": "usr_12345",
  "title": "Backend Software Engineer",
  "company": "Tech Corp",
  "location": "Bangalore / Remote",
  "job_url": "https://example.com/careers/123",
  "description": "We are seeking a backend engineer experienced in Python and FastAPI...",
  "required_skills": ["Python", "FastAPI", "SQL"],
  "preferred_skills": ["Docker", "AWS", "Redis"],
  "experience_requirements": ["2+ years of experience in backend development"],
  "qualifications": ["B.Tech/B.E. in Computer Science or equivalent"]
}
```

### 2.2 Parse Raw Job Description
Extracts structured sections, required skills, preferred skills, experience, and keywords from unstructured job text.

- **Endpoint:** `POST /jobs/parse`
- **Request Body:**
```json
{
  "user_id": "usr_12345",
  "title": "Backend Software Engineer",
  "description": "Responsibilities: Develop APIs in FastAPI. Requirements: Python, SQL. Experience: 2 years."
}
```

### 2.3 List Jobs
- **Endpoint:** `GET /jobs?user_id={user_id}&limit={limit}`

### 2.4 Get Job by ID
- **Endpoint:** `GET /jobs/{job_id}?user_id={user_id}`

### 2.5 Job Match Score
Calculates multi-factor weighted job match score (40% required skills, 20% preferred skills, 15% education, 15% experience, 10% role alignment).

- **Endpoint:** `POST /jobs/{job_id}/match`
- **Request Body:**
```json
{
  "user_id": "usr_12345",
  "resume_id": "97e68222-1d54-4632-9cb9-c85244585145",
  "candidate_skills": ["Python", "FastAPI", "SQL"],
  "education": "B.Tech Computer Science",
  "experience_years": 2.5,
  "target_role": "Backend Software Engineer"
}
```
- **Success Response (200 OK):**
```json
{
  "job_id": "job_998877",
  "job_match_score": 88.0,
  "skill_match": 100.0,
  "education_match": 100.0,
  "experience_match": 100.0,
  "role_alignment": 100.0,
  "eligible": true,
  "matched_skills": ["Python", "FastAPI", "SQL"],
  "missing_skills": ["Docker", "AWS", "Redis"],
  "missing_requirements": []
}
```

### 2.6 Deterministic Job Eligibility
- **Endpoint:** `POST /jobs/{job_id}/eligibility`
- **Success Response (200 OK):**
```json
{
  "eligible": true,
  "matched_requirements": [
    "Education: B.Tech Computer Science",
    "Experience: 2.5 years meets required 2.0 years",
    "Skills threshold met (3/3 required skills matched)"
  ],
  "missing_requirements": []
}
```

---

## 3. Skills API

### 3.1 Get Skills Taxonomy Catalog
- **Endpoint:** `GET /skills`
- **Success Response (200 OK):**
```json
{
  "skills": [
    {
      "skill_id": "skill_python",
      "name": "Python",
      "category": "Languages",
      "difficulty": "advanced",
      "aliases": ["py", "python3"]
    }
  ],
  "total": 12
}
```

### 3.2 Analyze Skills & Recommendations
- **Endpoint:** `POST /skills/analyze`
- **Request Body:**
```json
{
  "user_id": "usr_12345",
  "current_skills": ["Python", "FastAPI", "SQL"],
  "job_required_skills": ["Python", "SQL", "System Design", "Docker"],
  "target_role": "Senior Backend Developer"
}
```
- **Success Response (200 OK):**
```json
{
  "current_skills": ["Python", "FastAPI", "SQL"],
  "required_skills": ["Python", "SQL", "System Design", "Docker"],
  "matched_skills": ["Python", "SQL"],
  "skill_gaps": ["System Design", "Docker"],
  "skill_gap_score": 50.0,
  "priority_skills": [
    {
      "skill_id": "skill_1",
      "skill_name": "System Design",
      "priority": "HIGH",
      "category": "Architecture",
      "target_role": "Senior Backend Developer",
      "reason": "Crucial architectural foundation needed for technical interviews.",
      "prerequisites": ["Data Structures & Algorithms", "DBMS", "REST APIs"]
    },
    {
      "skill_id": "skill_2",
      "skill_name": "Docker",
      "priority": "MEDIUM",
      "category": "DevOps",
      "target_role": "Senior Backend Developer",
      "reason": "Standard containerization technology for reliable deployment.",
      "prerequisites": ["Linux Basics"]
    }
  ],
  "learning_recommendations": [
    "Prioritize mastering core high-impact skills: System Design.",
    "Build practical hands-on projects using: Docker to demonstrate competence."
  ]
}
```

### 3.3 Detect Skill Gaps
- **Endpoint:** `POST /skills/gaps`
- **Request Body:**
```json
{
  "user_id": "usr_12345",
  "current_skills": ["js", "react"],
  "job_required_skills": ["JavaScript", "React", "TypeScript", "Node.js"],
  "target_role": "Frontend Developer"
}
```
- **Success Response (200 OK):**
Normalizes aliases (`js` -> `JavaScript`, `react` -> `React`), computes matched vs missing skills, and categorizes priorities.
