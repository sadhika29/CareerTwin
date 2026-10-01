# CareerTwin — Comprehensive Testing Strategy

## 1. Overview & Objectives

The CareerTwin testing framework ensures robust, reliable, and explainable multi-agent workflows, API endpoints, assessment evaluations, and test reporting systems.

### Core Testing Pillars:
1. **Unit Testing**: Validating isolated logic across AI agents (Resume, Job, Skills, Preparation, Assessment, Performance), score algorithms, parsers, and schemas.
2. **Integration Testing**: Validating end-to-end API route execution, LangGraph state transitions, dependency injection, and data contracts.
3. **Assessment & Test Report Evaluation**: Ensuring precise calculation of passed, failed, and skipped questions, topic-level accuracy, and remediation workflows.
4. **End-to-End Career Flow**: Ensuring multi-agent coordination from profile setup to placement digital twin and what-if scenarios.

---

## 2. Assessment Evaluation & Test Report Scoring Strategy

### Scoring Methodology
- **Score**: Percentage of correct answers across all questions in the assessment:
  $$\text{Score} = \left(\frac{\text{Correct Answers}}{\text{Total Questions}}\right) \times 100$$
- **Accuracy**: Percentage of correct answers relative to attempted questions (excluding unattempted/skipped):
  $$\text{Accuracy} = \left(\frac{\text{Correct Answers}}{\text{Total Questions} - \text{Skipped Questions}}\right) \times 100$$
- **Weak Topics**: Questions that were either **failed (incorrect)** or **skipped (unattempted)** mark their respective topics as weak areas for remediation:
  $$\text{Weak Topics} = \{ \text{Topic}(q) \mid \text{Status}(q) \in \{\text{failed}, \text{skipped}\} \}$$

### Question Status Classification:
| Status | Condition | Handling in Report |
|---|---|---|
| **Passed** | Submitted answer matches expected correct answer | Recorded in `passed_questions`, contributes to Score & Accuracy |
| **Failed** | Answer provided by student is incorrect | Recorded in `failed_questions`, marks topic as weak, remediation task generated |
| **Skipped** | Question left unattempted, blank, or skipped | Recorded in `skipped_questions`, marks topic as weak, remediation task generated |

### Remediation Workflow
When an assessment has questions left skipped or failed:
1. The test report highlights unfinished work and lists targeted remediation tasks.
2. The user can invoke `POST /api/v1/preparation/assessment/reattempt-incomplete` or click **"Complete Left Skipped & Failed Questions"** in the frontend.
3. A focused assessment is generated with only the incomplete items.
4. Re-submitting the completed questions updates the student's readiness and converts weak topics into mastered skills.

---

## 3. Test Structure & Directory Organization

```text
CareerTwin/
├── tests/
│   ├── backend/
│   │   ├── test_agents.py           # Agent deterministic behavior & ATS scoring
│   │   ├── test_auth.py             # Authentication & token verification
│   │   ├── test_job_matching.py     # Job matching algorithms & weights
│   │   ├── test_rag.py              # Knowledge retrieval & embedding mocks
│   │   ├── test_resume_parser.py    # Resume text extraction & normalization
│   │   ├── test_skill_gap.py        # Skill gap prioritization & recommendations
│   │   └── test_yamini_core.py      # Core routing, readiness & API contracts
│   └── integration/
│       ├── test_agent_workflow.py   # Multi-agent failure tolerance & graph state
│       ├── test_api_endpoints.py    # Health checks, skills catalog & job endpoints
│       ├── test_career_flow.py      # Multi-agent career flow integration
│       └── test_preparation_api.py  # Preparation plan & assessment routes
└── backend/tests/
    ├── unit/
    │   ├── test_assessment.py       # Assessment generation, evaluation & remediation
    │   ├── test_job_agent.py        # Job parser & requirement extraction
    │   ├── test_job_matching.py     # Job service match scores
    │   ├── test_performance.py      # Performance analysis & trend computation
    │   ├── test_preparation.py      # Preparation recommendation agent
    │   ├── test_resume_agent.py     # Resume agent ATS envelope
    │   ├── test_resume_parser.py    # File format validation & text cleaners
    │   ├── test_skill_agent.py      # Skill extraction agent
    │   └── test_skill_gap.py        # Unit skill gap calculations
    └── integration/
        ├── test_job_api.py          # Job endpoints & search
        ├── test_resume_api.py       # Resume upload & ATS analysis
        └── test_skill_api.py        # Skill catalog & gap detection
```

---

## 4. Running the Test Suites

### Execute All Backend & Integration Tests:
```powershell
python -m pytest -v -rs
```

### Run Unit Tests Only:
```powershell
python -m pytest backend/tests/unit -v
```

### Run Assessment & Preparation Tests:
```powershell
python -m pytest backend/tests/unit/test_assessment.py backend/tests/unit/test_performance.py tests/integration/test_preparation_api.py -v
```
