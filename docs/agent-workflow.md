# CareerTwin Agent Workflow & Intelligence Specification

## 1. System Overview

The FastAPI layer accepts a user request and creates a typed `CareerState`. The Career Manager selects only the required agents, maps each stable `{agent, status, data, error}` result into its designated fields, calculates Digital Twin readiness, and optionally runs the What-If Planner.

```text
request -> profile/goal -> selected agents -> CareerState
                                      -> Digital Twin -> What-If Planner -> next action
```

The state is Pydantic-validated and supports partial workflows. Resume, job, skills, preparation, and interview agents are injected through `CareerManager.agent_runner`, so their implementations can be integrated without changing orchestration contracts. Digital Twin snapshots use the shared `FirebaseService` boundary.

---

## 2. Career Input Analysis Layer

The **Career Input Analysis Layer** converts raw unstructured inputs (resumes, job postings, candidate profiles) into structured intelligence required by the Career Manager, Digital Twin, and Preparation modules.

```text
Student Resume (PDF/DOCX) + Student Profile + Target Job Posting
                            ↓
                  ┌────────────────────┐
                  │   Resume Agent     │
                  └─────────┬──────────┘
                            │ (Extracted text, Resume Skills, ATS Score, Strengths)
                            ↓
                  ┌────────────────────┐
                  │    Job Agent       │
                  └─────────┬──────────┘
                            │ (Required/Preferred Skills, Experience, Eligibility)
                            ↓
                  ┌────────────────────┐
                  │   Skill Agent      │
                  └─────────┬──────────┘
                            │ (Normalized Gaps, Priority Tiers, Recommendations)
                            ↓
                Standard Inter-Agent Envelope
                            ↓
                      Career Manager
```

---

## 3. Agent Input & Output Contracts

### 3.1 Resume Agent Contract
- **Input:**
  - `resume_text` (str): Raw or parsed document text.
  - `profile` (dict): Student biographical & educational metadata.
  - `target_role` (str | None): Optional target job role.
  - `target_job` (str | None): Target job description or ID.
- **Output:**
  - `resume_score` (float: 0–100): Overall resume quality score.
  - `ats_score` (float: 0–100): ATS alignment score.
  - `resume_skills` (list[str]): Skills identified explicitly in resume.
  - `resume_strengths` (list[str]): Key strengths extracted.
  - `resume_weaknesses` (list[str]): Areas needing improvement.
  - `missing_sections` (list[str]): Omitted standard sections.
  - `keyword_gaps` (list[str]): Missing role-relevant keywords.
  - `recommendations` (list[str]): Actionable suggestions.

### 3.2 Job Agent Contract
- **Input:**
  - `description` (str): Raw job posting description.
  - `job_id` (str): Canonical database ID.
  - `target_role` (str | None): Optional target role name.
- **Output:**
  - `job_id` (str)
  - `job_title` (str)
  - `company` (str)
  - `required_skills` (list[str]): Mandatory technical and domain skills.
  - `preferred_skills` (list[str]): Nice-to-have technologies.
  - `experience_requirements` (list[str]): Minimum years / seniority.
  - `qualifications` (list[str]): Degrees, majors, certifications.
  - `responsibilities` (list[str]): Core duties.
  - `keywords` (list[str]): Domain terminology.
  - `summary` (str): Concise role description.

### 3.3 Skill Agent Contract
- **Input:**
  - `current_skills` (list[str]): Student's current and resume skills.
  - `required_skills` (list[str]): Required job skills.
  - `target_role` (str | None): Target career role.
- **Output:**
  - `current_skills` (list[str]): Normalized current skills.
  - `required_skills` (list[str]): Normalized target skills.
  - `matched_skills` (list[str]): Overlapping skills present.
  - `skill_gaps` (list[str]): Missing required skills.
  - `skill_gap_score` (float: 0–100): Percentage of target skills missing.
  - `priority_skills` (list[SkillGapItem]):
    - `skill_name` (str)
    - `priority` (HIGH | MEDIUM | LOW)
    - `category` (str)
    - `target_role` (str)
    - `reason` (str)
    - `prerequisites` (list[str])
  - `learning_recommendations` (list[str]): Actionable learning advice.

---

## 4. Career Manager Shared Contract Envelope

All three agents provide standard envelopes adhering to Section 32:

```json
{
  "agent": "resume" | "job" | "skill",
  "status": "success",
  "data": { ... }
}
```

This guarantees seamless consumption by Yamini's Career Manager without internal schema mismatches.

---

## 5. Scoring Formulas & Weights (Section 43)

### 5.1 ATS Score Calculation
Evaluates resume readiness against a specific target job:
- **Keyword Match (35%)**: Ratio of job keywords present in resume.
- **Skill Match (35%)**: Ratio of required skills present in resume skills.
- **Experience Relevance (15%)**: Overlap with job experience requirements.
- **Section Completeness (15%)**: Presence of Education, Experience, Projects, Skills sections.

$$\text{ATS Score} = (0.35 \times \text{Keyword}) + (0.35 \times \text{Skill}) + (0.15 \times \text{Exp}) + (0.15 \times \text{Completeness})$$

### 5.2 Job Match Score Calculation
Configurable multi-factor match score:
- **Required Skills Match**: 40%
- **Preferred Skills Match**: 20%
- **Education Match**: 15%
- **Experience Match**: 15%
- **Role Alignment**: 10%

$$\text{Job Match Score} = (0.40 \times S_{\text{req}}) + (0.20 \times S_{\text{pref}}) + (0.15 \times S_{\text{edu}}) + (0.15 \times S_{\text{exp}}) + (0.10 \times S_{\text{role}})$$

### 5.3 Skill Gap Prioritization Rules (Section 22)
- **HIGH Priority**:
  - Core programming languages (e.g. Python, Java, C++).
  - CS Fundamentals (Data Structures & Algorithms, DBMS, Operating Systems).
  - Architecture foundations (System Design, REST APIs).
- **MEDIUM Priority**:
  - Web & application frameworks (FastAPI, React, Django).
  - Containerization & databases (Docker, PostgreSQL, MySQL).
- **LOW Priority**:
  - Secondary / niche infrastructure (Kubernetes, Redis caching, specialized cloud tools).

---

## 6. RAG Knowledge Pipeline

The RAG module enhances agent intelligence with grounded career and role knowledge:
1. **Documents**: Ingests role guides, DSA roadmaps, System Design concepts, and prerequisite mappings.
2. **Chunking**: Text is cleaned and split into 400-word segments with 50-word overlaps.
3. **Embeddings**: Dual-mode embeddings (Gemini Embeddings with deterministic vector fallback).
4. **Vector Store**: Cosine similarity search with metadata filtering (`role`, `skill`, `topic`).
5. **Retriever**: Provides top-$k$ contextual excerpts directly to prompts for high accuracy.
