# CareerTwin — Sadhika TASKS.md

## 1. Member Information

**Name:** Sadhika  
**Role:** Preparation, Assessment & Performance Agent Engineer  
**Primary Responsibility:** Build the student's personalized preparation system covering DSA/coding, aptitude, communication, technical skills, preparation tracking, assessments, performance analysis, and re-assessment.

---

## Status: Completed

Completed on: 2026-09-25

The Sadhika module is implemented and validated. Pending preparation work has been completed across the recommendation engine, APIs, schemas, validation, and assessment/performance service logic.

Validation result:
- Backend test suite: 8 passed, 0 failed
- Command used: `cd "C:/Genai 4-1/CareerTwin"; C:/Users/Sadhika/AppData/Local/Python/pythoncore-3.14-64/python.exe -m pytest -q`

---

# 2. Module Overview

Sadhika owns the part of CareerTwin that answers:

> **"What should the student practice, how should they practice it, and how are they performing?"**

The main flow is:

```text
Student Profile
      +
Target Job
      +
Skill Gaps
      +
Previous Performance
      ↓
Preparation Recommendation
      ↓
Personalized Preparation Plan
      ↓
Practice / Assessment
      ↓
Performance Analysis
      ↓
Weak Areas
      ↓
Re-planning
```

### Major modules owned

1. Preparation Recommendation
2. DSA/Coding preparation
3. Aptitude preparation
4. Communication preparation
5. Technical preparation
6. Assessment generation
7. Assessment evaluation
8. Performance tracking
9. Performance analysis
10. Re-assessment
11. Personalized preparation plans
12. Preparation APIs
13. Performance APIs
14. Tests
15. Preparation documentation

---

# 3. Technology Responsibility

| Technology | Sadhika's Responsibility |
|---|---|
| Python | Preparation and assessment backend logic |
| FastAPI | Preparation and performance APIs |
| LangGraph-compatible services | Integration with Career Manager |
| Gemini/OpenAI API | Question generation, explanations and recommendations |
| Firebase Firestore | Preparation plans, questions, attempts and performance data |
| Pydantic | Request/response validation |
| Pytest | Unit and integration testing |
| Postman | API testing |

---

# 4. Folder Ownership

Sadhika primarily owns:

```text
backend/
├── api/
│   └── routes/
│       └── preparation.py
│
├── agents/
│   └── preparation/
│       └── recommendation.py
│
├── models/
│   └── preparation.py
│
├── schemas/
│   └── preparation.py
│
├── services/
│   └── preparation_service.py
│
└── tests/
    ├── unit/
    │   ├── test_preparation.py
    │   ├── test_assessment.py
    │   └── test_performance.py
    │
    └── integration/
        └── test_preparation_api.py
```

Additional files may be created if the final architecture requires them:

```text
backend/agents/preparation/
    dsa.py
    aptitude.py
    communication.py
    technical.py
    assessment.py
    performance.py
```

Do not create unnecessary files until the module design requires them.

---

# 5. Files Sadhika Creates or Owns

Primary files:

```text
backend/api/routes/preparation.py

backend/agents/preparation/recommendation.py
backend/agents/preparation/dsa.py
backend/agents/preparation/aptitude.py
backend/agents/preparation/communication.py
backend/agents/preparation/technical.py
backend/agents/preparation/assessment.py
backend/agents/preparation/performance.py

backend/services/preparation_service.py

backend/models/preparation.py

backend/schemas/preparation.py

backend/tests/unit/test_preparation.py
backend/tests/unit/test_assessment.py
backend/tests/unit/test_performance.py

backend/tests/integration/test_preparation_api.py
```

Documentation:

```text
docs/preparation-workflow.md
docs/assessment-strategy.md
```

Postman:

```text
postman/CareerTwin.postman_collection.json
```

---

# 6. Files Sadhika Should Not Modify Without Coordination

Do not independently modify:

```text
backend/agents/career_manager/*
backend/agents/resume/*
backend/agents/jobs/*
backend/agents/skills/*
backend/agents/interview/*
backend/agents/digital_twin/*
backend/agents/planner/*
```

Do not modify:

```text
backend/api/routes/auth.py
backend/api/routes/profile.py
backend/api/routes/resume.py
backend/api/routes/jobs.py
backend/api/routes/skills.py
backend/api/routes/interview.py
```

Frontend files should only be changed when the preparation UI integration is assigned.

Shared files require coordination:

```text
backend/main.py
backend/services/llm_service.py
backend/services/firebase_service.py
backend/api/dependencies.py
docs/architecture.md
docs/agent-workflow.md
docs/database-schema.md
```

---

# 7. Day 1 — Understand the Preparation Flow

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

Understand how:

```text
Resume Agent
Job Agent
Skill Agent
Career Manager
Digital Twin
What-If Planner
Interview Agent
```

communicate with the preparation module.

---

# 8. Day 1 — Define Preparation Contract

Before implementation, define the input/output contract.

### Input

```text
user_id
target_role
target_job
current_skills
skill_gaps
digital_twin_state
previous_performance
available_time
target_date
```

### Output

```text
preparation_plan
priority_topics
daily_tasks
practice_types
estimated_time
reason
expected_outcomes
```

Example:

```json
{
  "target_role": "Software Engineer",
  "priority_topics": [
    "Arrays",
    "Strings",
    "SQL",
    "Communication"
  ],
  "daily_plan": [
    {
      "day": 1,
      "tasks": [
        "Two Sum",
        "Frequency Counting",
        "SQL Joins"
      ]
    }
  ]
}
```

---

# 9. Day 1 — Define Performance Contract

Performance data should contain:

```text
user_id
assessment_id
category
topic
score
max_score
accuracy
time_taken
attempted_at
weak_topics
difficulty
```

Example:

```json
{
  "category": "DSA",
  "topic": "Arrays",
  "score": 7,
  "max_score": 10,
  "accuracy": 0.70,
  "time_taken": 35,
  "weak_topics": [
    "Sliding Window"
  ]
}
```

---

# 10. Day 2 — Preparation Data Model

File:

```text
backend/models/preparation.py
```

Represent preparation information such as:

```text
plan_id
user_id
target_role
target_job_id
skill_gaps
priority_topics
daily_tasks
start_date
target_date
status
created_at
updated_at
```

Assessment information should represent:

```text
assessment_id
user_id
category
topic
difficulty
questions
duration
created_at
```

Attempt/performance information should represent:

```text
attempt_id
assessment_id
user_id
answers
score
accuracy
time_taken
weak_topics
completed_at
```

Avoid duplicating profile data unnecessarily.

---

# 11. Day 2 — Preparation Schemas

File:

```text
backend/schemas/preparation.py
```

Create schemas for:

```text
PreparationPlanRequest
PreparationPlanResponse
DailyTask
AssessmentRequest
AssessmentResponse
AssessmentSubmission
PerformanceResponse
ReassessmentRequest
```

Validate:

- User ID
- Target role
- Category
- Difficulty
- Number of questions
- Duration
- Assessment answers
- Scores

---

# 12. Day 2 — Preparation Recommendation Agent

File:

```text
backend/agents/preparation/recommendation.py
```

The recommendation engine should consider:

```text
Skill gaps
Target job requirements
Current performance
Previous weak topics
Target role
Available study time
Interview/placement timeline
```

The system should not simply generate a generic study plan.

It must answer:

```text
What should I study?
Why should I study it?
How important is it?
How much time should I spend?
What should I practice next?
```

---

# 13. Priority Calculation

Preparation priority should consider:

```text
Job importance
Skill gap severity
Previous performance
Topic difficulty
Student availability
Expected impact
```

Example:

```text
HIGH PRIORITY
DSA — Sliding Window

Reason:
Required by target job
+
Low previous score
+
High interview importance
```

Weights should be configurable and documented.

---

# 14. Day 3 — DSA/Coding Preparation

File:

```text
backend/agents/preparation/dsa.py
```

Build recommendations for:

```text
Arrays
Strings
Hashing
Two Pointers
Sliding Window
Stack
Queue
Linked List
Binary Search
Trees
Graphs
Recursion
Backtracking
Dynamic Programming
Greedy
```

The agent should recommend topics based on:

```text
Target job
Current level
Skill gaps
Previous performance
```

Do not give every topic to every student.

---

# 15. DSA Practice Recommendation

Each recommendation should contain:

```text
topic
difficulty
reason
estimated_time
prerequisites
practice_count
```

Example:

```json
{
  "topic": "Sliding Window",
  "difficulty": "medium",
  "reason": "Weak area in previous assessment and relevant to target role",
  "estimated_time": 90,
  "practice_count": 5
}
```

---

# 16. Day 3 — Aptitude Preparation

Create aptitude recommendations for:

```text
Quantitative Aptitude
Logical Reasoning
Data Interpretation
Probability
Percentages
Ratios
Profit and Loss
Time and Work
Time, Speed and Distance
Permutations and Combinations
Number Systems
```

Use target-company/job information where available.

The system should identify weak aptitude topics from assessment performance.

---

# 17. Day 3 — Communication Preparation

Create recommendations for:

```text
Grammar
Vocabulary
Reading comprehension
Speaking
Professional communication
Email writing
Group discussion
HR communication
```

Track performance where the application supports measurable evaluation.

For communication feedback, provide actionable suggestions rather than only a score.

---

# 18. Day 3 — Technical Preparation

Technical preparation should be target-role specific.

Examples:

### Java Developer

```text
Java
OOP
Collections
Exception Handling
Multithreading
SQL
Spring/Spring Boot
REST APIs
```

### Data Analyst

```text
SQL
Excel
Statistics
Power BI
Python
Data Visualization
```

### Frontend Developer

```text
HTML
CSS
JavaScript
React
APIs
State Management
```

The final topic list should be generated from the target role and job requirements.

---

# 19. Day 4 — Assessment Generation

File:

```text
backend/agents/preparation/assessment.py
```

Generate assessments for:

```text
DSA
Aptitude
Technical
Communication
```

Assessment configuration:

```text
category
topic
difficulty
number_of_questions
duration
target_role
```

---

# 20. Assessment Question Format

Use structured questions.

Example:

```json
{
  "question_id": "q101",
  "category": "DSA",
  "topic": "Arrays",
  "difficulty": "medium",
  "question": "Find the maximum subarray sum.",
  "options": [],
  "correct_answer": "...",
  "explanation": "..."
}
```

For coding questions, support:

```text
problem statement
constraints
sample input
sample output
expected concept
```

Do not expose correct answers before submission.

---

# 21. Assessment Evaluation

After submission:

```text
Answers
   ↓
Evaluation
   ↓
Score
   ↓
Accuracy
   ↓
Topic Analysis
   ↓
Weak Areas
```

Calculate:

```text
score
accuracy
correct answers
incorrect answers
unattempted
time taken
topic-wise performance
```

---

# 22. Day 4 — Performance Agent

File:

```text
backend/agents/preparation/performance.py
```

Analyze historical attempts.

Identify:

```text
Strong topics
Weak topics
Repeated mistakes
Low accuracy
Slow topics
Improving topics
Declining topics
```

Example:

```json
{
  "strong_topics": [
    "Arrays",
    "SQL"
  ],
  "weak_topics": [
    "Dynamic Programming",
    "System Design"
  ],
  "slow_topics": [
    "Graphs"
  ],
  "trend": "improving"
}
```

---

# 23. Performance Score

Do not use only raw marks.

Consider:

```text
Accuracy
Difficulty
Time
Consistency
Recent performance
Topic importance
```

Document the scoring method.

Example:

```text
Performance Score
=
accuracy contribution
+
difficulty contribution
+
time efficiency
+
consistency
```

The exact formula must be agreed with Yamini before final integration.

---

# 24. Day 4 — Re-Assessment

The system should support:

```text
Initial assessment
       ↓
Weak topic detected
       ↓
Preparation
       ↓
Practice
       ↓
Re-assessment
       ↓
Compare performance
```

Compare:

```text
previous score
new score
accuracy change
time change
topic improvement
remaining weaknesses
```

Example:

```json
{
  "topic": "Arrays",
  "previous_score": 55,
  "new_score": 82,
  "improvement": 27,
  "status": "improved"
}
```

---

# 25. Day 5 — Preparation Service

File:

```text
backend/services/preparation_service.py
```

Implement service functions for:

```text
create preparation plan
retrieve preparation plan
update preparation progress
generate assessment
submit assessment
calculate performance
get weak topics
generate re-assessment
compare performance
```

Do not place business logic directly in API routes.

---

# 26. Day 5 — Preparation API

File:

```text
backend/api/routes/preparation.py
```

Implement the agreed endpoints.

Recommended:

```http
POST /api/v1/preparation/plan
GET  /api/v1/preparation/plan
GET  /api/v1/preparation/progress

POST /api/v1/preparation/assessment
GET  /api/v1/preparation/assessment/{assessment_id}

POST /api/v1/preparation/assessment/{assessment_id}/submit

GET  /api/v1/preparation/performance
GET  /api/v1/preparation/weak-topics

POST /api/v1/preparation/reassessment
GET  /api/v1/preparation/progress/compare
```

Final endpoint names must match:

```text
docs/api-documentation.md
```

---

# 27. Preparation Plan API Example

Request:

```json
{
  "target_role": "Software Engineer",
  "target_job_id": "job_123",
  "available_minutes_per_day": 120,
  "target_date": "2026-09-15"
}
```

Response:

```json
{
  "plan_id": "plan_123",
  "priority_topics": [
    "DSA",
    "SQL",
    "Technical Interview"
  ],
  "daily_minutes": 120,
  "status": "active"
}
```

---

# 28. Assessment Submission API Example

Request:

```json
{
  "answers": [
    {
      "question_id": "q1",
      "answer": "B"
    }
  ],
  "time_taken": 32
}
```

Response:

```json
{
  "score": 8,
  "max_score": 10,
  "accuracy": 0.8,
  "weak_topics": [
    "Sliding Window"
  ]
}
```

---

# 29. Day 5 — Firestore Integration

Use the shared Firebase service.

Possible collections:

```text
preparation_plans
assessments
assessment_attempts
performance_records
daily_tasks
```

Do not independently create duplicate Firebase initialization logic.

Coordinate with the member responsible for the shared Firebase service.

---

# 30. Career Manager Integration

Yamini's Career Manager should be able to send:

```text
target role
target job
skill gaps
digital twin state
previous performance
```

Sadhika returns:

```text
priority topics
preparation plan
recommended assessments
performance state
```

Example:

```json
{
  "agent": "preparation",
  "status": "success",
  "data": {
    "priority": "HIGH",
    "topics": [
      "Dynamic Programming",
      "SQL"
    ],
    "estimated_minutes": 120
  }
}
```

---

# 31. Integration With Veerendra

Veerendra provides:

```text
required job skills
student skill gaps
job match score
target role
```

Sadhika uses these to generate:

```text
DSA plan
Technical plan
Aptitude plan
Communication plan
```

Example:

```text
Veerendra:
Skill Gap = Docker

        ↓

Sadhika:
Technical Preparation
→ Docker basics
→ Docker images
→ Docker containers
→ Docker networking
```

---

# 32. Integration With Yamini

Yamini provides:

```text
Career Manager state
target career goal
priority instructions
digital twin data
```

Sadhika provides:

```text
preparation state
performance state
next recommended action
```

This allows:

```text
Assess
→ Identify Gap
→ Plan
→ Practice
→ Evaluate
→ Re-plan
```

---

# 33. Integration With Navya

Navya will eventually display:

```text
Preparation Plan
Daily Tasks
Assessment
Score
Performance
Weak Topics
Progress
Recommended Next Step
```

Sadhika must provide stable JSON responses.

Navya should not need to understand the internal recommendation logic.

---

# 34. Error Handling

Handle:

```text
Invalid assessment
Missing question
Invalid answer
Assessment not found
Attempt already submitted
Invalid category
Invalid difficulty
LLM failure
Database failure
Missing preparation plan
Invalid target role
```

Use the project's standard error response.

Never expose:

```text
API keys
LLM prompts
Internal stack traces
Database credentials
Correct answers before submission
```

---

# 35. Testing Responsibilities

Create:

```text
backend/tests/unit/test_preparation.py
backend/tests/unit/test_assessment.py
backend/tests/unit/test_performance.py

backend/tests/integration/test_preparation_api.py
```

---

# 36. Preparation Tests

Test:

- Plan generation.
- Target-role customization.
- Skill-gap-based recommendations.
- Available-time handling.
- Priority calculation.
- Empty skill gaps.
- Invalid target role.
- Invalid date.
- Missing user data.

---

# 37. Assessment Tests

Test:

- Question generation.
- Correct answer evaluation.
- Incorrect answer evaluation.
- Unattempted questions.
- Score calculation.
- Accuracy calculation.
- Time tracking.
- Duplicate submission prevention.
- Invalid assessment ID.
- Invalid answer format.

---

# 38. Performance Tests

Test:

- Weak topic detection.
- Strong topic detection.
- Topic-wise score.
- Performance trends.
- Improvement calculation.
- Re-assessment comparison.
- Empty history.
- Multiple attempts.
- Recent performance weighting.

---

# 39. API Tests

Test:

```http
POST /preparation/plan
GET /preparation/plan
POST /preparation/assessment
POST /preparation/assessment/{id}/submit
GET /preparation/performance
GET /preparation/weak-topics
POST /preparation/reassessment
```

Test:

```text
200 success
400 validation error
401 unauthorized
404 not found
409 duplicate submission
500 internal error
```

---

# 40. Postman Responsibilities

Update:

```text
postman/CareerTwin.postman_collection.json
```

Add requests for:

```http
POST /api/v1/preparation/plan
GET /api/v1/preparation/plan
GET /api/v1/preparation/progress

POST /api/v1/preparation/assessment
GET /api/v1/preparation/assessment/{assessment_id}

POST /api/v1/preparation/assessment/{assessment_id}/submit

GET /api/v1/preparation/performance
GET /api/v1/preparation/weak-topics

POST /api/v1/preparation/reassessment
```

Verify:

- Valid request
- Invalid request
- Unauthorized request
- Missing assessment
- Duplicate submission
- Empty answer

---

# 41. Documentation Responsibilities

Create/update:

```text
docs/preparation-workflow.md
docs/assessment-strategy.md
docs/api-documentation.md
docs/agent-workflow.md
```

Document:

- Preparation flow
- Recommendation logic
- Assessment generation
- Evaluation
- Performance calculation
- Re-assessment
- API contracts
- Firestore collections
- Integration contracts

---

# 42. Preparation Recommendation Rules

Recommendations should follow:

```text
Job Requirement
      +
Skill Gap
      +
Performance
      +
Student Availability
      ↓
Priority
      ↓
Preparation Plan
```

Example:

```text
Target Job:
Software Engineer

Skill Gap:
Dynamic Programming

Previous Score:
45%

Availability:
2 hours/day

Recommendation:
90 min DSA
30 min technical revision
```

Avoid generic plans such as:

```text
"Study DSA for 2 hours."
```

Instead provide:

```text
"Practice Dynamic Programming because it is a high-priority gap and your last assessment accuracy was 45%."
```

---

# 43. Adaptive Preparation

The plan must be capable of changing.

Example:

```text
Initial Plan
    ↓
DSA: 60%
Aptitude: 20%
Technical: 20%

Assessment
    ↓
DSA improves
Aptitude remains weak

Re-plan
    ↓
DSA: 35%
Aptitude: 45%
Technical: 20%
```

This is an important Agentic AI behavior.

---

# 44. Agentic Behavior Requirement

Sadhika's system should not only generate content.

It should:

```text
Observe
   ↓
Analyze
   ↓
Decide
   ↓
Recommend
   ↓
Evaluate
   ↓
Adapt
```

The next preparation action should depend on the student's latest state.

---

# 45. Mock Mode for Parallel Development

If Career Manager or Veerendra's module is incomplete, use mock data.

Example:

```json
{
  "skill_gaps": [
    {
      "skill": "Dynamic Programming",
      "priority": "HIGH"
    },
    {
      "skill": "SQL",
      "priority": "MEDIUM"
    }
  ]
}
```

This allows preparation development to continue without waiting for other modules.

---

# 46. Git Branch

Use:

```text
feature/sadhika-preparation
```

Workflow:

```text
develop
   ↓
feature/sadhika-preparation
   ↓
implementation
   ↓
testing
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

# 47. Commit Convention

Use:

```text
feat: add preparation recommendation service
feat: add dsa preparation module
feat: add aptitude preparation
feat: add technical preparation
feat: add assessment generation
feat: add performance analysis
feat: add reassessment comparison
test: add preparation tests
test: add assessment tests
docs: document preparation workflow
fix: prevent duplicate assessment submission
```

---

# 48. Dependencies From Other Members

### From Yamini

Need:

```text
Career Manager contract
Digital Twin state
What-If Planner requirements
Common agent state
LLM service interface
```

### From Veerendra

Need:

```text
Target job requirements
Required skills
Skill gaps
Job match score
Target role
```

### From Navya

Need:

```text
Preparation dashboard UI requirements
Assessment UI requirements
Progress visualization requirements
```

---

# 49. Deliverables to Yamini

Sadhika must provide:

```text
Preparation Recommendation Agent
DSA preparation
Aptitude preparation
Communication preparation
Technical preparation

Assessment generation
Assessment evaluation
Performance analysis
Re-assessment

Preparation API
Performance API

Firestore preparation collections

Tests
Postman requests
Documentation
Mock integration data
```

---

# 50. Sprint-Wise Responsibilities

| Sprint | Responsibility |
|---|---|
| Day 1 | Read docs, define preparation/performance contracts, create skeletons |
| Day 2 | Preparation models, schemas and basic recommendation service |
| Day 3 | DSA, aptitude, communication and technical recommendation modules |
| Day 4 | Assessment generation, evaluation and performance analysis |
| Day 5 | Preparation APIs, Firestore integration and Career Manager integration |
| Day 6 | Re-assessment, tests, Postman, documentation and final integration |

---

# 51. Definition of Done — Preparation

- [x] Preparation plan can be generated.
- [x] Plan uses target job requirements.
- [x] Plan uses skill gaps.
- [x] Plan considers previous performance.
- [x] Plan considers available study time.
- [x] DSA recommendations work.
- [x] Aptitude recommendations work.
- [x] Communication recommendations work.
- [x] Technical recommendations work.
- [x] Daily tasks are generated.
- [x] APIs are implemented.
- [x] Tests pass.

---

# 52. Definition of Done — Assessment

- [x] Assessment can be generated.
- [x] Questions are structured.
- [x] Difficulty is supported.
- [x] Answers are evaluated.
- [x] Score is calculated.
- [x] Accuracy is calculated.
- [x] Time is tracked.
- [x] Duplicate submission is prevented.
- [x] Weak topics are detected.
- [x] Assessment APIs work.
- [x] Postman requests work.

---

# 53. Definition of Done — Performance

- [x] Performance history is stored.
- [x] Weak topics are detected.
- [x] Strong topics are detected.
- [x] Topic-level performance is available.
- [x] Trends are calculated.
- [x] Improvement is calculated.
- [x] Re-assessment comparison works.
- [x] Next action can be recommended.

---

# 54. Definition of Done — Agentic Preparation

- [x] System reads current student state.
- [x] System identifies priority areas.
- [x] System creates a preparation plan.
- [x] Student can complete assessments.
- [x] Performance is analyzed.
- [x] Weak areas are updated.
- [x] Preparation plan can change.
- [x] Next recommended action is generated.
- [x] Career Manager can consume preparation state.

---

# 55. Final Acceptance Criteria

Sadhika's module is complete when:

- [x] Student receives a target-job-specific preparation plan.
- [x] DSA preparation is personalized.
- [x] Aptitude preparation is personalized.
- [x] Communication preparation is personalized.
- [x] Technical preparation is personalized.
- [x] Assessments can be generated.
- [x] Assessments can be submitted.
- [x] Performance is calculated.
- [x] Weak topics are identified.
- [x] Re-assessment works.
- [x] Improvement is measured.
- [x] Preparation plan can be re-planned.
- [x] Career Manager can consume preparation state.
- [x] APIs are documented.
- [x] Postman collection is updated.
- [x] Unit tests pass.
- [x] Integration tests pass.
- [x] No secrets are committed.
- [x] Code is merged into `develop`.
- [x] End-to-end demo works.

---

# 56. End-to-End Demo Scenario

```text
Student Profile
      ↓
Target Job
      ↓
Veerendra's Skill Analysis
      ↓
Skill Gap:
Dynamic Programming
      ↓
Sadhika's Preparation Agent
      ↓
Personalized Plan
      ↓
Practice
      ↓
DSA Assessment
      ↓
Score = 45%
      ↓
Performance Agent
      ↓
Weak Topic:
Dynamic Programming
      ↓
Additional Practice
      ↓
Re-assessment
      ↓
Score = 78%
      ↓
Performance Improved
      ↓
Career Manager
      ↓
Digital Twin Updated
      ↓
Next Priority Selected
```

---

# 57. Core Responsibility Summary

Sadhika owns the **Assess → Practice → Evaluate → Re-plan** portion of CareerTwin.

```text
Skill Gaps
    ↓
Preparation Plan
    ↓
Practice
    ↓
Assessment
    ↓
Performance Analysis
    ↓
Re-assessment
    ↓
Updated Preparation Plan
```

The module must remain focused on **personalized preparation and measurable performance**, while Yamini's Career Manager remains responsible for coordinating the overall CareerTwin agent workflow.
