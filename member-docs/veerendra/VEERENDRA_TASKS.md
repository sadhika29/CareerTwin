# CareerTwin — Veerendra TASKS.md

## 1. Member Information

**Name:** Veerendra  
**Role:** Resume, Job Intelligence & Skill Gap Agent Engineer  
**Primary Responsibility:** Resume analysis, ATS evaluation, job analysis/matching, eligibility analysis, skill-gap analysis, RAG-supported career knowledge, and the APIs/services required to provide these results to the Career Manager.

---

## 2. Module Overview

Veerendra owns the **career input analysis layer** of CareerTwin.

This layer converts the student's resume, profile, target role, and job descriptions into structured information that the Career Manager can use.

Main flow:

```text
Student Profile + Resume + Target Job
                ↓
       ┌─────────────────┐
       │ Resume Analysis │
       └────────┬────────┘
                ↓
       ┌─────────────────┐
       │ Job Analysis    │
       └────────┬────────┘
                ↓
       ┌─────────────────┐
       │ Skill Analysis  │
       └────────┬────────┘
                ↓
         Skill Gaps +
         Job Match +
         ATS Score
                ↓
        Career Manager
```

### Major modules owned

1. Resume Agent
2. Resume parser integration
3. ATS analysis
4. Job Agent
5. Job description analysis
6. Eligibility checking
7. Job-match scoring
8. Skill Analysis Agent
9. Skill gap detection
10. RAG integration for career/skill knowledge
11. Resume/Job/Skill APIs
12. Related backend tests
13. Agent documentation

---

# 3. Technology Responsibility

| Technology | Veerendra's Responsibility |
|---|---|
| Python | Agent and backend implementation |
| FastAPI | Resume, job and skill APIs |
| LangGraph/LangChain interfaces | Agent compatibility with Career Manager |
| Gemini/OpenAI API | Structured analysis and recommendations |
| PyMuPDF | PDF resume text extraction |
| python-docx | DOCX resume extraction |
| ChromaDB | Career/job/skill knowledge retrieval |
| Sentence Transformers | Embeddings for RAG |
| Firebase Firestore | Resume, job, skill and analysis persistence through shared service |
| Pydantic | Input/output validation |
| Pytest | Unit and integration tests |
| Postman | API testing |

---

# 4. Folder Ownership

Veerendra primarily owns:

```text
backend/
├── api/
│   └── routes/
│       ├── resume.py
│       ├── jobs.py
│       └── skills.py
│
├── agents/
│   ├── resume/
│   │   ├── agent.py
│   │   └── prompts.py
│   │
│   ├── jobs/
│   │   ├── agent.py
│   │   └── prompts.py
│   │
│   └── skills/
│       ├── agent.py
│       └── prompts.py
│
├── services/
│   ├── resume_parser.py
│   └── job_service.py
│
├── models/
│   ├── resume.py
│   ├── job.py
│   └── skill.py
│
├── schemas/
│   ├── resume.py
│   ├── job.py
│   └── skill.py
│
├── rag/
│   ├── ingestion.py
│   ├── embeddings.py
│   ├── retriever.py
│   └── vector_store.py
│
└── tests/
    ├── unit/
    └── integration/
```

---

# 5. Files Veerendra Creates or Owns

```text
backend/api/routes/resume.py
backend/api/routes/jobs.py
backend/api/routes/skills.py

backend/agents/resume/agent.py
backend/agents/resume/prompts.py

backend/agents/jobs/agent.py
backend/agents/jobs/prompts.py

backend/agents/skills/agent.py
backend/agents/skills/prompts.py

backend/services/resume_parser.py
backend/services/job_service.py

backend/models/resume.py
backend/models/job.py
backend/models/skill.py

backend/schemas/resume.py
backend/schemas/job.py
backend/schemas/skill.py

backend/rag/ingestion.py
backend/rag/embeddings.py
backend/rag/retriever.py
backend/rag/vector_store.py

backend/tests/unit/test_resume_agent.py
backend/tests/unit/test_job_agent.py
backend/tests/unit/test_skill_agent.py
backend/tests/unit/test_resume_parser.py
backend/tests/unit/test_job_matching.py
backend/tests/unit/test_skill_gap.py

backend/tests/integration/test_resume_api.py
backend/tests/integration/test_job_api.py
backend/tests/integration/test_skill_api.py
```

---

# 6. Files Veerendra Should Not Modify Without Coordination

Do not independently modify:

```text
backend/agents/career_manager/*
backend/agents/digital_twin/*
backend/agents/planner/*
backend/agents/preparation/*
backend/agents/interview/*

backend/api/routes/auth.py
backend/api/routes/profile.py
backend/api/routes/applications.py
backend/api/routes/preparation.py
backend/api/routes/interview.py

frontend/*
```

Shared files requiring coordination:

```text
backend/main.py
backend/services/firebase_service.py
backend/services/llm_service.py
backend/api/dependencies.py
docs/architecture.md
docs/agent-workflow.md
docs/database-schema.md
```

---

# 7. Day 1 — Read Project Documentation

Read:

```text
README.md
docs/architecture.md
docs/agent-workflow.md
docs/api-documentation.md
docs/database-schema.md
docs/integration-plan.md
docs/testing-strategy.md
docs/team-responsibilities.md
```

Understand:

- CareerTwin architecture
- Agent communication
- Common state structure
- Firestore conventions
- API naming conventions
- Resume flow
- Job flow
- Skill flow
- Career Manager expectations

### Deliverable

Create/update:

```text
docs/agent-workflow.md
```

with the input/output contracts of Resume, Job and Skill agents.

---

# 8. Day 1 — Define Agent Contracts

Before implementing agents, define stable interfaces.

## Resume Agent

Input:

```text
resume_text
profile
target_role
target_job
```

Output:

```text
resume_score
ats_score
resume_skills
resume_strengths
resume_weaknesses
missing_sections
keyword_gaps
recommendations
```

## Job Agent

Input:

```text
job_description
student_profile
resume_analysis
```

Output:

```text
job_title
company
required_skills
preferred_skills
eligibility
experience_requirements
education_requirements
job_match_score
missing_requirements
```

## Skill Agent

Input:

```text
current_skills
resume_skills
job_required_skills
target_role
```

Output:

```text
current_skills
required_skills
skill_gaps
matched_skills
skill_gap_score
priority_skills
learning_recommendations
```

### Definition of Done

All three contracts are documented and shared with Yamini.

---

# 9. Day 2 — Resume Parser

File:

```text
backend/services/resume_parser.py
```

Support:

```text
PDF
DOCX
```

Use:

```text
PyMuPDF
python-docx
```

Responsibilities:

1. Validate uploaded file type.
2. Read the document.
3. Extract text.
4. Normalize unnecessary whitespace.
5. Detect empty/invalid documents.
6. Return structured parsing result.
7. Handle extraction errors safely.

Example result:

```json
{
  "filename": "resume.pdf",
  "file_type": "pdf",
  "text": "extracted resume text",
  "page_count": 2,
  "status": "success"
}
```

### Error cases

Handle:

- Unsupported extension
- Empty file
- Corrupted PDF
- Corrupted DOCX
- Extraction failure
- Excessively large file

---

# 10. Day 2 — Resume Data Model

File:

```text
backend/models/resume.py
```

Represent:

```text
resume_id
user_id
file_name
file_type
storage_path
extracted_text
skills
education
experience
projects
certifications
resume_score
ats_score
created_at
updated_at
```

Do not store unnecessary duplicate information.

Sensitive information must not be logged.

---

# 11. Day 2 — Resume Schemas

File:

```text
backend/schemas/resume.py
```

Create schemas for:

```text
ResumeUploadResponse
ResumeAnalysisRequest
ResumeAnalysisResponse
ResumeUpdateRequest
```

Validate:

- File metadata
- User ID
- Target role
- Target job ID
- Analysis response fields

---

# 12. Day 3 — Resume Agent

File:

```text
backend/agents/resume/agent.py
```

The Resume Agent must analyze:

```text
Contact information
Summary
Education
Experience
Projects
Skills
Certifications
Formatting/content completeness
Keywords
Achievements
```

Output structured information rather than only free-form text.

---

# 13. ATS Analysis

The ATS score should evaluate:

```text
Keyword alignment
Required skills
Job-specific terminology
Resume section completeness
Experience relevance
Education relevance
Project relevance
Formatting/content readability
```

Example:

```json
{
  "ats_score": 78,
  "keyword_match": 82,
  "skill_match": 75,
  "experience_relevance": 80,
  "section_completeness": 90,
  "missing_keywords": [
    "Docker",
    "REST APIs"
  ]
}
```

### Important

The ATS score is an internal CareerTwin readiness metric, not a guarantee of passing any real company's ATS.

---

# 14. Resume Improvement Recommendations

Generate actionable suggestions:

```text
Add missing skills
Improve project descriptions
Add measurable achievements
Improve summary
Remove irrelevant content
Improve job-specific keyword alignment
```

Recommendations must be based on the selected target job where available.

---

# 15. Day 3 — Job Agent

Files:

```text
backend/agents/jobs/agent.py
backend/agents/jobs/prompts.py
```

The Job Agent should analyze job descriptions.

Extract:

```text
Job title
Company
Location
Experience
Education
Required skills
Preferred skills
Responsibilities
Technologies
Eligibility requirements
Application information
```

---

# 16. Job Data Model

File:

```text
backend/models/job.py
```

Represent:

```text
job_id
company
title
location
description
required_skills
preferred_skills
experience_required
education_required
eligibility
source
source_url
created_at
```

---

# 17. Job Analysis

The Job Agent should convert an unstructured job description into structured data.

Example:

```json
{
  "title": "Software Engineer",
  "required_skills": [
    "Java",
    "DSA",
    "SQL",
    "REST APIs"
  ],
  "preferred_skills": [
    "Docker",
    "AWS"
  ],
  "education": "B.Tech or equivalent",
  "experience": "0-2 years"
}
```

---

# 18. Job Eligibility

Implement deterministic checks wherever possible.

Check:

```text
Education
Graduation status
Experience
Required skills
Location constraints
Other explicit requirements
```

Return:

```json
{
  "eligible": true,
  "matched_requirements": [],
  "missing_requirements": []
}
```

Do not allow the LLM alone to decide deterministic eligibility when structured data is available.

---

# 19. Job Match Score

Calculate:

```text
Student Profile
      +
Resume Skills
      +
Job Requirements
      ↓
Job Match Score
```

Consider:

```text
Required skill match
Preferred skill match
Experience match
Education match
Role alignment
Eligibility
```

Example:

```json
{
  "job_match_score": 84,
  "skill_match": 88,
  "education_match": 100,
  "experience_match": 75,
  "role_alignment": 90
}
```

Weights must be configurable.

---

# 20. Day 4 — Job Service

File:

```text
backend/services/job_service.py
```

Implement service functions for:

```text
create/store job
retrieve job
search/filter jobs
analyze job
calculate match
check eligibility
```

The service should be the bridge between API routes and database repositories.

Do not place large business rules directly in route files.

---

# 21. Day 4 — Skill Analysis Agent

Files:

```text
backend/agents/skills/agent.py
backend/agents/skills/prompts.py
```

Compare:

```text
Student Skills
        vs
Target Job Skills
        ↓
Matched Skills
        +
Missing Skills
        ↓
Skill Gaps
```

Output:

```json
{
  "matched_skills": [
    "Java",
    "SQL"
  ],
  "skill_gaps": [
    "Docker",
    "System Design"
  ],
  "priority_skills": [
    "System Design",
    "Docker"
  ]
}
```

---

# 22. Skill Priority

Prioritize skill gaps based on:

```text
Job importance
Frequency in target jobs
Current proficiency
Career goal
Prerequisites
Impact on job match
```

Example:

```text
HIGH:
System Design

MEDIUM:
Docker

LOW:
Kubernetes
```

---

# 23. Skill Data Model

File:

```text
backend/models/skill.py
```

Represent:

```text
skill_id
name
category
aliases
description
difficulty
related_skills
```

Student-specific skill state should be handled through the appropriate profile/career-state data rather than duplicating records unnecessarily.

---

# 24. Day 4 — RAG Setup

Folder:

```text
backend/rag/
```

Files:

```text
ingestion.py
embeddings.py
retriever.py
vector_store.py
```

Use RAG for knowledge such as:

```text
Skill descriptions
Technology prerequisites
Career role requirements
DSA topic relationships
Interview concepts
Learning resources
Job-role knowledge
```

Do not use RAG merely because the project contains an LLM.

---

# 25. RAG Ingestion

File:

```text
backend/rag/ingestion.py
```

Tasks:

1. Load approved knowledge documents.
2. Clean text.
3. Split into chunks.
4. Generate metadata.
5. Send chunks for embedding.
6. Store vectors in ChromaDB.

Metadata should include:

```text
source
topic
role
skill
document_type
```

---

# 26. RAG Embeddings

File:

```text
backend/rag/embeddings.py
```

Use Sentence Transformers.

Tasks:

- Load embedding model.
- Convert chunks into embeddings.
- Provide reusable embedding function.
- Handle batch processing.

Do not repeatedly initialize the embedding model for every request.

---

# 27. RAG Retriever

File:

```text
backend/rag/retriever.py
```

Implement:

```text
query
top_k
metadata filters
similarity retrieval
```

Example:

```text
Query:
"What skills are required for a backend Java developer?"

Retriever:
→ Java
→ Spring Boot
→ REST APIs
→ SQL
→ Microservices
```

The retrieved context can then be passed to the appropriate agent/LLM.

---

# 28. RAG Vector Store

File:

```text
backend/rag/vector_store.py
```

Responsibilities:

- Initialize ChromaDB.
- Create/get collection.
- Add documents.
- Search vectors.
- Delete/update documents where required.

Keep vector-store logic separate from agent logic.

---

# 29. Day 5 — Resume API

File:

```text
backend/api/routes/resume.py
```

Implement agreed endpoints:

```http
POST /api/v1/resume/upload
GET  /api/v1/resume
GET  /api/v1/resume/{resume_id}
POST /api/v1/resume/analyze
POST /api/v1/resume/ats-score
```

The exact final endpoint names must match `docs/api-documentation.md`.

### API flow

```text
Frontend
   ↓
Resume API
   ↓
Authentication
   ↓
Resume Parser
   ↓
Resume Agent
   ↓
Firebase Storage / Firestore
   ↓
Structured Response
```

---

# 30. Day 5 — Job API

File:

```text
backend/api/routes/jobs.py
```

Implement agreed endpoints such as:

```http
POST /api/v1/jobs
GET  /api/v1/jobs
GET  /api/v1/jobs/{job_id}
POST /api/v1/jobs/{job_id}/analyze
POST /api/v1/jobs/{job_id}/match
```

Possible request:

```json
{
  "job_description": "...",
  "target_role": "Software Engineer"
}
```

Possible response:

```json
{
  "job_id": "job_123",
  "job_match_score": 84,
  "eligible": true,
  "required_skills": [
    "Java",
    "SQL",
    "DSA"
  ],
  "skill_gaps": [
    "Docker"
  ]
}
```

---

# 31. Day 5 — Skills API

File:

```text
backend/api/routes/skills.py
```

Implement agreed endpoints:

```http
GET  /api/v1/skills
POST /api/v1/skills/analyze
GET  /api/v1/skills/gaps
```

Response example:

```json
{
  "current_skills": [
    "Java",
    "Python",
    "SQL"
  ],
  "required_skills": [
    "Java",
    "SQL",
    "Docker",
    "System Design"
  ],
  "skill_gaps": [
    "Docker",
    "System Design"
  ]
}
```

---

# 32. Integration With Yamini's Career Manager

Yamini's Career Manager consumes these outputs.

### Resume Agent provides

```text
resume_score
ats_score
resume_skills
resume_strengths
resume_weaknesses
keyword_gaps
```

### Job Agent provides

```text
job details
required skills
eligibility
job match score
```

### Skill Agent provides

```text
current skills
required skills
matched skills
skill gaps
priority skills
```

### Required contract

Use structured results similar to:

```json
{
  "agent": "resume",
  "status": "success",
  "data": {}
}
```

Do not return inconsistent structures between requests.

---

# 33. Integration With Sadhika's Preparation Module

The skill gaps generated here should be available to the preparation system.

Example:

```text
Skill Gap:
Advanced DSA

        ↓

Preparation Agent

        ↓

DSA Practice Plan
```

Share:

```text
skill_id
skill_name
priority
target_role
reason
```

---

# 34. Integration With Navya's Frontend

Frontend needs:

```text
Resume score
ATS score
Missing keywords
Job match score
Eligibility
Required skills
Skill gaps
Skill priorities
```

Provide stable API response formats.

Do not require Navya to understand internal agent implementation.

---

# 35. Error Handling

Handle:

```text
Invalid resume
Unsupported file
Empty resume
Corrupted document
Missing job
Invalid job description
LLM failure
RAG failure
Embedding failure
Database failure
Unauthorized request
```

Use the project's standard error format.

Never expose:

```text
API keys
stack traces
internal prompts
database credentials
```

---

# 36. Testing Responsibilities

Create:

```text
backend/tests/unit/test_resume_agent.py
backend/tests/unit/test_job_agent.py
backend/tests/unit/test_skill_agent.py
backend/tests/unit/test_resume_parser.py
backend/tests/unit/test_job_matching.py
backend/tests/unit/test_skill_gap.py

backend/tests/integration/test_resume_api.py
backend/tests/integration/test_job_api.py
backend/tests/integration/test_skill_api.py
```

---

# 37. Resume Test Cases

Test:

- Valid PDF extraction.
- Valid DOCX extraction.
- Unsupported file type.
- Empty document.
- Corrupted document.
- Resume with missing sections.
- Resume with no skills.
- ATS scoring.
- Keyword gap detection.
- Target-job-specific recommendations.
- Invalid request.
- LLM failure.

---

# 38. Job Test Cases

Test:

- Valid job description.
- Required skill extraction.
- Preferred skill extraction.
- Eligibility match.
- Eligibility failure.
- Job match score.
- Missing requirements.
- Invalid job data.
- Job not found.
- LLM failure.

---

# 39. Skill Test Cases

Test:

- Current vs required skills.
- Skill aliases.
- Matched skills.
- Missing skills.
- Priority calculation.
- Empty skill list.
- Duplicate skills.
- Case-insensitive skill comparison.

Example:

```text
JavaScript
javascript
JS
```

should be normalized appropriately.

---

# 40. RAG Test Cases

Test:

- Document ingestion.
- Chunk creation.
- Embedding generation.
- Vector insertion.
- Retrieval.
- Top-k behavior.
- Metadata filtering.
- Empty query.
- Vector-store unavailable.

Automated tests should use controlled test documents.

---

# 41. Postman Responsibilities

Update:

```text
postman/CareerTwin.postman_collection.json
```

Add:

```http
POST /api/v1/resume/upload
GET  /api/v1/resume
POST /api/v1/resume/analyze
POST /api/v1/resume/ats-score

POST /api/v1/jobs
GET  /api/v1/jobs
GET  /api/v1/jobs/{job_id}
POST /api/v1/jobs/{job_id}/analyze
POST /api/v1/jobs/{job_id}/match

GET  /api/v1/skills
POST /api/v1/skills/analyze
GET  /api/v1/skills/gaps
```

Test:

- Success
- Validation errors
- Unauthorized access
- Missing resources
- Invalid files
- Agent failures

---

# 42. Documentation Responsibilities

Update:

```text
docs/api-documentation.md
docs/agent-workflow.md
docs/database-schema.md
```

Document:

- Resume API
- Job API
- Skill API
- Agent input/output
- Firestore fields
- RAG workflow
- Scoring methodology
- Integration contracts

---

# 43. Scoring Rules Documentation

Document the formulas/weights used for:

```text
ATS score
Job match score
Skill gap score
Eligibility
Skill priority
```

Do not hard-code unexplained weights.

Example:

```text
Job Match =
40% required skills
20% preferred skills
15% education
15% experience
10% role alignment
```

The final weights must be agreed with Yamini and recorded in documentation.

---

# 44. Git Branch

Use:

```text
feature/veerendra-analysis-agents
```

Workflow:

```text
develop
   ↓
feature/veerendra-analysis-agents
   ↓
commit
   ↓
push
   ↓
Pull Request
   ↓
review
   ↓
develop
```

---

# 45. Commit Convention

Use:

```text
feat: add resume parser
feat: add resume analysis agent
feat: add ATS scoring
feat: add job analysis agent
feat: add job matching
feat: add skill gap agent
feat: add RAG retriever
test: add resume parser tests
test: add job matching tests
docs: document agent contracts
fix: handle corrupted resume files
```

---

# 46. Dependencies From Other Members

### From Yamini

Need:

```text
CareerTwin shared state
Agent execution contract
LLM service interface
Authentication dependency
Career Manager routing contract
```

### From Database implementation

Need:

```text
Firebase service
Firestore repository interfaces
collection names
schema conventions
```

### From Sadhika

Potential input:

```text
Preparation performance data
```

This can improve skill-gap prioritization.

### From Navya

Need:

```text
Final UI requirements
API consumption requirements
```

---

# 47. Deliverables to Yamini

Veerendra must provide:

```text
Resume Agent
Job Agent
Skill Agent

Resume Parser
Job Service

Resume/Job/Skill APIs

RAG modules

Structured agent contracts

Test cases

Postman requests

Documentation
```

Most importantly, provide sample mock outputs so Yamini can integrate the agents before all functionality is complete.

---

# 48. Parallel Development Strategy

Veerendra should not wait for the entire system.

Use mock data initially.

Example:

```json
{
  "agent": "job",
  "status": "success",
  "data": {
    "job_match_score": 82,
    "required_skills": ["Java", "SQL", "DSA"],
    "eligibility": true
  }
}
```

Yamini can immediately integrate this into the Career Manager.

Later replace mock logic with the real Job Agent.

---

# 49. Sprint-Wise Responsibilities

| Sprint | Veerendra's Work |
|---|---|
| Day 1 | Read docs, define Resume/Job/Skill contracts, create module skeletons |
| Day 2 | Resume parser, resume schemas/models, basic resume storage interface |
| Day 3 | Resume Agent, ATS analysis, Job Agent and job extraction |
| Day 4 | Job matching, eligibility, Skill Agent, skill-gap prioritization |
| Day 5 | RAG pipeline, Resume/Job/Skill APIs, Career Manager integration |
| Day 6 | Tests, Postman, documentation, bug fixing and final integration |

---

# 50. Definition of Done — Resume Module

- [ ] PDF extraction works.
- [ ] DOCX extraction works.
- [ ] Resume validation works.
- [ ] Resume Agent works.
- [ ] ATS score is generated.
- [ ] Missing keywords are identified.
- [ ] Resume recommendations are generated.
- [ ] API is implemented.
- [ ] Errors are handled.
- [ ] Tests pass.
- [ ] Postman requests work.
- [ ] Documentation is complete.

---

# 51. Definition of Done — Job Module

- [ ] Job description can be stored.
- [ ] Job requirements are extracted.
- [ ] Required skills are identified.
- [ ] Preferred skills are identified.
- [ ] Eligibility is calculated.
- [ ] Job match score is calculated.
- [ ] API is implemented.
- [ ] Tests pass.
- [ ] Postman requests work.
- [ ] Documentation is complete.

---

# 52. Definition of Done — Skill Module

- [ ] Current skills identified.
- [ ] Required skills identified.
- [ ] Skill aliases normalized.
- [ ] Matched skills calculated.
- [ ] Skill gaps calculated.
- [ ] Priority gaps calculated.
- [ ] API is implemented.
- [ ] Tests pass.
- [ ] Career Manager contract works.

---

# 53. Definition of Done — RAG Module

- [ ] Documents can be ingested.
- [ ] Text is chunked.
- [ ] Embeddings are generated.
- [ ] ChromaDB collection works.
- [ ] Retrieval works.
- [ ] Metadata filtering works.
- [ ] Agents can consume retrieved context.
- [ ] Test documents are available.
- [ ] RAG errors are handled.

---

# 54. Final Acceptance Criteria

Veerendra's module is complete when:

- [ ] Resume can be uploaded and parsed.
- [ ] Resume can be analyzed against a target job.
- [ ] ATS score is available.
- [ ] Job description can be analyzed.
- [ ] Eligibility can be determined.
- [ ] Job match score is available.
- [ ] Skill gaps can be identified.
- [ ] Skill priorities can be generated.
- [ ] RAG retrieval works where required.
- [ ] All agent outputs follow the agreed contract.
- [ ] Career Manager can consume all three agents.
- [ ] APIs are documented.
- [ ] Postman collection is updated.
- [ ] Unit tests pass.
- [ ] Integration tests pass.
- [ ] No secrets are committed.
- [ ] Code is merged into `develop`.
- [ ] End-to-end CareerTwin demo works.

---

# 55. End-to-End Demo Scenario

```text
Student uploads Resume
        ↓
Resume Parser
        ↓
Resume Agent
        ↓
ATS Score + Resume Skills
        ↓
Student selects Target Job
        ↓
Job Agent
        ↓
Required Skills + Eligibility
        ↓
Skill Agent
        ↓
Skill Gaps + Priority Skills
        ↓
Career Manager
        ↓
Digital Twin
        ↓
What-If Planner
        ↓
"Improve System Design first"
```

This module therefore provides the **career intelligence foundation** that allows CareerTwin to move from simply storing a student's resume to actually understanding the student's suitability for a target job.
