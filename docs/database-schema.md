# CareerTwin Database Schema Documentation (Firestore)

This document describes the Firestore collections and schema specifications owned and utilized by the **Career Input Analysis Layer**.

---

## 1. Collection: `resumes`

Stores uploaded resume documents, extracted text, metadata, and analysis results.

- **Document ID:** `resume_id` (UUID string)
- **Fields:**

| Field | Type | Description |
|---|---|---|
| `resume_id` | String | Unique identifier for the resume |
| `user_id` | String | User ID owning the resume (Indexed for user filtering) |
| `filename` | String | Original uploaded filename (e.g., `resume.pdf`) |
| `file_type` | String | File extension / format: `"pdf"` or `"docx"` |
| `storage_path` | String | Cloud or local storage URI of the uploaded file |
| `text` | String | Normalized raw text extracted from the document |
| `page_count` | Number (Integer) | Total page count of the document |
| `status` | String | Status: `"pending"`, `"success"`, `"failed"` |
| `skills` | Array [String] | List of skills identified in resume |
| `analysis` | Map (Object) | Stored results from `ResumeAgent.analyze()` |
| `ats_analysis` | Map (Object) | Stored results from deterministic ATS scoring |
| `metadata` | Map (Object) | Extensible metadata (file size, mime type, candidate name) |
| `created_at` | Timestamp | Document creation timestamp (UTC) |
| `updated_at` | Timestamp | Last update timestamp (UTC) |

---

## 2. Collection: `jobs`

Stores job descriptions, parsed technical requirements, and AI analysis data.

- **Document ID:** `job_id` (UUID string)
- **Fields:**

| Field | Type | Description |
|---|---|---|
| `job_id` | String | Unique identifier for the job posting |
| `user_id` | String | User who saved or created the job posting (Indexed) |
| `title` | String | Position or role title (e.g., `"Backend Developer"`) |
| `company` | String | Company or hiring organization name |
| `location` | String | Work location or `"Remote"` |
| `job_url` | String | URL to the original job posting |
| `description` | String | Full raw or normalized job description text |
| `required_skills` | Array [String] | Mandatory technical and domain skills |
| `preferred_skills` | Array [String] | Desirable / nice-to-have technical skills |
| `experience_requirements` | Array [String] | Seniority or minimum years required |
| `qualifications` | Array [String] | Degree, major, and education requirements |
| `responsibilities` | Array [String] | Bullet points describing duties |
| `keywords` | Array [String] | Important technical and domain keywords |
| `analysis` | Map (Object) | Stored results from `JobAgent.analyze()` |
| `created_at` | Timestamp | Document creation timestamp (UTC) |
| `updated_at` | Timestamp | Last update timestamp (UTC) |

---

## 3. Collection: `skills` (Taxonomy / Catalog)

Stores standard taxonomy skills, aliases, and prerequisites.

- **Document ID:** `skill_id` (e.g., `"skill_system_design"`)
- **Fields:**

| Field | Type | Description |
|---|---|---|
| `skill_id` | String | Unique canonical skill identifier |
| `name` | String | Canonical display name (e.g., `"System Design"`) |
| `category` | String | Taxonomy category (e.g., `"Architecture"`, `"Languages"`) |
| `aliases` | Array [String] | Alternative names and abbreviations (e.g., `["js", "javascript"]`) |
| `difficulty` | String | Difficulty tier: `"beginner"`, `"intermediate"`, `"advanced"` |
| `prerequisites` | Array [String] | Foundational skills recommended before this skill |
| `description` | String | Brief conceptual overview of the skill |
