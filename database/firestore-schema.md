# CareerTwin Complete Firestore Schema Specification

This document details the complete Firestore schema, ownership models, indexing strategies, and document structures for the CareerTwin platform.

---

## 1. Top-Level Architectural Overview

CareerTwin uses Cloud Firestore with isolated document identifiers and authenticated user boundaries. Every user-owned record is explicitly tagged with `user_id` matching Firebase Authentication `request.auth.uid`.

```
/profiles/{user_id}
/resumes/{resume_id}
/applications/{user_id}_{app_id}
/interviews/{session_id}
/assessments/{user_id}_{assessment_id}
/jobs/{job_id}
/skills/{skill_id}
```

---

## 2. Collection Details

### 2.1 Collection: `profiles`
Stores user profile information, educational background, professional summary, technical skills, and career preferences.

- **Document ID:** `user_id` (Firebase Auth UID)
- **Ownership:** Document ID equals `request.auth.uid`

| Field | Type | Description |
|---|---|---|
| `user_id` | String | Owner Firebase UID |
| `full_name` | String | User's full name |
| `email` | String | Primary contact email |
| `title` | String | Current or target job title (e.g., "Full Stack Engineer") |
| `bio` | String | Professional biography / summary |
| `skills` | Array [String] | Self-reported technical skills |
| `experience_years` | Number | Years of relevant experience |
| `education` | Array [Object] | Degrees, institutions, and completion years |
| `preferences` | Object | Target roles, preferred locations, compensation goals |
| `updated_at` | Timestamp | Last modified date |

---

### 2.2 Collection: `resumes`
Stores uploaded resume documents, extracted text, metadata, deterministic ATS evaluation, and AI feedback.

- **Document ID:** `resume_id` (UUID string)
- **Ownership:** `user_id` must match `request.auth.uid`

| Field | Type | Description |
|---|---|---|
| `resume_id` | String | Unique identifier for resume |
| `user_id` | String | Owner Firebase UID |
| `filename` | String | Original uploaded filename |
| `file_type` | String | Format: `"pdf"` or `"docx"` |
| `storage_path` | String | Cloud Storage or safe storage URI |
| `text` | String | Extracted text content |
| `page_count` | Number | Document page count |
| `status` | String | Status: `"pending"`, `"success"`, `"failed"` |
| `skills` | Array [String] | Skills extracted from resume text |
| `ats_score` | Number | Normalized ATS matching score (0–100) |
| `ats_analysis` | Object | Detailed category breakdown, keyword matches |
| `analysis` | Object | Structured LLM resume recommendations |
| `created_at` | Timestamp | Upload timestamp |
| `updated_at` | Timestamp | Analysis update timestamp |

---

### 2.3 Collection: `applications`
Stores job applications tracked by the user, stages, notes, and company details.

- **Document ID:** `{user_id}_{app_id}` (Composed for deterministic lookup)
- **Ownership:** `user_id` field must match `request.auth.uid`

| Field | Type | Description |
|---|---|---|
| `id` | String | Unique application ID |
| `user_id` | String | Owner Firebase UID |
| `company` | String | Employer / hiring company name |
| `role` | String | Position or role title |
| `status` | String | Stage: `"Applied"`, `"Interviewing"`, `"Offer"`, `"Rejected"` |
| `applied_date` | String / Timestamp | Application submission date |
| `notes` | String | User notes, recruiter contacts, preparation items |
| `match_score` | Number | Computed match score with user profile |
| `created_at` | Timestamp | Record creation timestamp |
| `updated_at` | Timestamp | Last update timestamp |

---

### 2.4 Collection: `interviews`
Stores mock interview sessions, questions, candidate answers, and AI grading.

- **Document ID:** `session_id` (UUID string)
- **Ownership:** `user_id` field must match `request.auth.uid`

| Field | Type | Description |
|---|---|---|
| `session_id` | String | Unique interview session ID |
| `user_id` | String | Owner Firebase UID |
| `role` | String | Target role (e.g., "Frontend Developer") |
| `topic` | String | Primary topic (e.g., "System Design", "Behavioral") |
| `difficulty` | String | Difficulty tier: `"junior"`, `"mid"`, `"senior"` |
| `score` | Number | Overall evaluation score (0–100) |
| `status` | String | `"active"` or `"completed"` |
| `questions` | Array [Object] | Question texts, candidate answers, individual scores |
| `feedback` | Object | Strengths, weaknesses, suggestions |
| `created_at` | Timestamp | Session start timestamp |
| `updated_at` | Timestamp | Evaluation completion timestamp |

---

### 2.5 Collection: `assessments`
Stores technical diagnostic tests, quizzes, and skill evaluation reports.

- **Document ID:** `{user_id}_{assessment_id}`
- **Ownership:** `user_id` field must match `request.auth.uid`

| Field | Type | Description |
|---|---|---|
| `assessment_id` | String | Unique assessment ID |
| `user_id` | String | Owner Firebase UID |
| `category` | String | Category: `"dsa"`, `"aptitude"`, `"technical"` |
| `score` | Number | Normalized test score (0–100) |
| `questions_answered`| Number | Number of completed questions |
| `weak_topics` | Array [String] | Identified concept deficiencies |
| `recommendations` | Array [String] | Target practice modules |
| `created_at` | Timestamp | Test completion timestamp |

---

### 2.6 Collection: `resume_chunks` & Subcollection `users/{user_id}/resumes/{resume_id}/chunks`
Stores segmented text chunks extracted from uploaded resumes for durable RAG, semantic search, and vector index reconstruction.

- **Document ID:** `{resume_id}_chunk_{idx}`
- **Ownership:** `user_id` field must match `request.auth.uid`

| Field | Type | Description |
|---|---|---|
| `chunk_id` | String | Unique chunk identifier (`{resume_id}_chunk_{idx}`) |
| `resume_id` | String | Parent resume UUID |
| `user_id` | String | Owner Firebase UID |
| `sequence_number` | Number | Sequential index (0, 1, 2, ...) |
| `text` | String | Extracted text chunk |
| `page` | Number | Document page number |
| `total_chunks` | Number | Total chunk count for parent resume |
| `created_at` | Timestamp | Ingestion timestamp |

---

### 2.7 Collection: `digital_twin_snapshots`
Stores historical career readiness evaluations and persona metrics computed by CareerTwin.

- **Document ID:** `{user_id}:{created_at}`
- **Ownership:** `user_id` field must match `request.auth.uid`

| Field | Type | Description |
|---|---|---|
| `user_id` | String | Owner Firebase UID |
| `target_role` | String | Target career role |
| `overall_score`| Number | Weighted readiness percentage (0–100) |
| `resume_score` | Number | ATS resume score |
| `dsa_score` | Number | DSA proficiency score |
| `technical_score`| Number| Domain technical score |
| `interview_score`| Number| Interview simulation score |
| `created_at` | Timestamp | ISO 8601 evaluation timestamp |

---

## 3. Storage Architecture

Binary files (resumes, documents) are stored in Firebase Storage / designated persistent storage paths:
- `users/{user_id}/resumes/{resume_id}/{filename}`
- `resumes/{user_id}/{resume_id}.pdf`
- Document blobs are never stored directly in Firestore documents to maintain document size limits (< 1MB) and ensure rapid read performance.

