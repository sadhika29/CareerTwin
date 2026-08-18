# CareerTwin — Yamini TASKS.md

## 1. Member Information

**Name:** Yamini  
**Role:** Lead Backend & Agentic AI Integration Engineer  
**Primary Responsibility:** Backend foundation, Career Manager/Orchestrator Agent, LangGraph workflow, LLM integration, Placement Digital Twin integration, What-If Career Planner, backend integration, testing, and AI workflow documentation.

---

## 2. Module Overview

Yamini owns the **core intelligence and orchestration layer** of CareerTwin.

The main goal is to make the individual agents work together as one Agentic AI system:

**Student Profile → Career Manager → Specialized Agents → Digital Twin → Performance Analysis → What-If Planner → Personalized Plan → Practice → Re-assessment**

### Major modules owned

1. Backend application foundation
2. Career Manager / Orchestrator Agent
3. LangGraph state and routing
4. LLM service
5. Agent communication contracts
6. Placement Digital Twin
7. Performance aggregation
8. What-If Career Planner
9. Career analysis APIs
10. Backend integration
11. Backend and agent testing
12. Agent workflow documentation

---

# 3. Technology Responsibility

| Technology | Yamini's Responsibility |
|---|---|
| Python | Backend and AI implementation |
| FastAPI | Backend API layer |
| LangGraph | Multi-agent orchestration |
| Gemini API / OpenAI API | LLM calls |
| Firebase Firestore | Read/write career state through shared services |
| ChromaDB | Consume RAG retrieval interfaces |
| Sentence Transformers | Consume embedding/retrieval interfaces |
| Pydantic | API and agent state validation |
| Pytest | Backend and agent testing |
| Postman | API testing |
| Git/GitHub | Branch-based development and integration |

---

# 4. Folder Ownership

Yamini primarily owns:

```text
backend/
├── api/
│   ├── routes/
│   │   ├── career.py
│   │   └── digital_twin.py
│   └── dependencies.py
│
├── agents/
│   ├── career_manager/
│   │   ├── graph.py
│   │   ├── nodes.py
│   │   ├── routing.py
│   │   └── state.py
│   │
│   ├── digital_twin/
│   │   ├── calculator.py
│   │   └── service.py
│   │
│   └── planner/
│       └── service.py
│
├── services/
│   └── llm_service.py
│
├── models/
│   └── career_state.py
│
├── schemas/
│   └── career.py
│
├── utils/
│   ├── errors.py
│   └── logging.py
│
└── tests/
    ├── unit/
    └── integration/
```

Shared files requiring coordination:

```text
backend/main.py
backend/api/dependencies.py
backend/services/firebase_service.py
backend/models/career_state.py
backend/schemas/career.py
docs/architecture.md
docs/agent-workflow.md
docs/integration-plan.md
```

---

# 5. Files Yamini Creates or Owns

```text
backend/main.py
backend/api/dependencies.py
backend/api/routes/career.py
backend/api/routes/digital_twin.py

backend/agents/career_manager/graph.py
backend/agents/career_manager/nodes.py
backend/agents/career_manager/routing.py
backend/agents/career_manager/state.py

backend/agents/digital_twin/calculator.py
backend/agents/digital_twin/service.py
backend/agents/planner/service.py

backend/services/llm_service.py

backend/models/career_state.py
backend/schemas/career.py

backend/utils/errors.py
backend/utils/logging.py

backend/tests/unit/test_career_manager.py
backend/tests/unit/test_digital_twin.py
backend/tests/unit/test_planner.py
backend/tests/integration/test_career_flow.py
backend/tests/integration/test_agent_workflow.py

docs/architecture.md
docs/agent-workflow.md
docs/integration-plan.md
```

---

# 6. Files Yamini Should Not Modify Without Coordination

Do not independently modify:

```text
backend/api/routes/auth.py
backend/api/routes/profile.py
backend/api/routes/resume.py
backend/api/routes/skills.py
backend/api/routes/jobs.py
backend/api/routes/applications.py
backend/api/routes/preparation.py
backend/api/routes/interview.py

backend/agents/resume/*
backend/agents/skills/*
backend/agents/jobs/*
backend/agents/preparation/*
backend/agents/interview/*

frontend/*
```

If an integration change is required, inform the relevant owner first.

---

# 7. Core Agent State Contract

File:

```text
backend/agents/career_manager/state.py
```

The shared state should support:

```text
user_id
target_role
target_job_id
profile
resume_analysis
job_analysis
skills
skill_gaps
job_match_score
resume_score
dsa_score
aptitude_score
communication_score
technical_score
interview_score
digital_twin_score
pipeline_stage
performance_history
recommendations
next_action
errors
metadata
```

### Rules

- Use typed/Pydantic state.
- Do not pass arbitrary unrelated dictionaries.
- Each agent must update only its designated fields.
- Keep field names documented.
- Make optional values safe for partial workflows.

### Definition of Done

- State is typed.
- Required fields are documented.
- Default values are sensible.
- Other members can integrate without guessing the format.

---

# 8. Day 1 — Read Project Documentation

Read:

```text
README.md
docs/architecture.md
docs/agent-workflow.md
docs/database-schema.md
docs/api-documentation.md
docs/integration-plan.md
docs/testing-strategy.md
docs/team-responsibilities.md
```

Understand:

- Project architecture
- Agent workflow
- Team responsibilities
- API conventions
- Firestore structure
- Frontend/backend boundary
- Integration dependencies

### Output

Update:

```text
docs/agent-workflow.md
```

with a short explanation of the agreed agent architecture.

---

# 9. Day 1 — Define Agent Contracts

Document the input/output contract for:

```text
Resume Agent
Job Agent
Skill Analysis Agent
Communication Agent
Aptitude Agent
DSA Agent
Technical Skills Agent
Interview Agent
Digital Twin
What-If Planner
Career Manager
```

For every agent document:

```text
Input
↓
Processing
↓
Output
↓
State fields updated
```

### Example

```text
Skill Agent

Input:
profile + target job + existing skills

Output:
current_skills
required_skills
skill_gaps
skill_gap_score
```

### Definition of Done

Every agent has a documented interface.

---

# 10. Day 2 — FastAPI Application Foundation

File:

```text
backend/main.py
```

Implement:

- FastAPI application
- CORS
- Router registration
- Health endpoint
- Global error handling
- Application configuration

Required endpoint:

```http
GET /health
```

Response:

```json
{
  "status": "ok",
  "service": "CareerTwin API"
}
```

### Definition of Done

Backend starts successfully and `/health` returns HTTP 200.

---

# 11. Day 2 — Backend Dependencies

File:

```text
backend/api/dependencies.py
```

Create shared dependencies for:

- Current user
- Firebase service
- LLM service
- Career Manager
- Shared validation where required

Do not duplicate authentication or Firebase implementation.

---

# 12. Day 2 — Central LLM Service

File:

```text
backend/services/llm_service.py
```

Implement one centralized service for LLM calls.

It must:

- Load API credentials from `.env`.
- Initialize Gemini/OpenAI client.
- Provide a common generation function.
- Handle API failures.
- Handle timeouts.
- Support structured JSON output where required.
- Avoid exposing API keys.
- Provide logging information without sensitive data.

Example environment variables:

```env
LLM_PROVIDER=gemini
GEMINI_API_KEY=your_key
LLM_MODEL=your_model
```

### Rule

Agents must call the centralized LLM service instead of creating separate LLM clients.

---

# 13. Day 3 — Career Manager / Orchestrator

Files:

```text
backend/agents/career_manager/graph.py
backend/agents/career_manager/nodes.py
backend/agents/career_manager/routing.py
backend/agents/career_manager/state.py
```

The Career Manager is the central orchestrator.

Responsibilities:

1. Receive student request.
2. Load profile.
3. Identify target role/job.
4. Decide which agents are required.
5. Execute required agents.
6. Collect results.
7. Update Digital Twin.
8. Analyze performance.
9. Run What-If Planner where required.
10. Generate the next best action.
11. Return structured result.

---

# 14. Career Manager Graph

Initial workflow:

```text
START
  ↓
Load Student Profile
  ↓
Identify Career Goal
  ↓
Determine Required Analysis
  ↓
Route to Required Agents
  ↓
Collect Agent Results
  ↓
Update Digital Twin
  ↓
Performance Analysis
  ↓
What-If Planner
  ↓
Generate Next Action
  ↓
END
```

### Important

Do not run every agent for every request.

Example:

```text
User:
"What skills am I missing for this job?"

Job Agent
    ↓
Skill Agent
    ↓
Digital Twin
    ↓
Planner
```

No unnecessary interview or aptitude execution.

---

# 15. Task — Agent Routing

File:

```text
backend/agents/career_manager/routing.py
```

Implement routing for:

```text
Resume request → Resume Agent
Job matching → Job Agent
Skill gap → Skill Agent
Preparation → DSA/Aptitude/Communication/Technical
Interview preparation → Interview Agent
Readiness request → Digital Twin
"What should I improve?" → What-If Planner
Full career analysis → Required combination of agents
```

### Definition of Done

- Routing is predictable.
- Routing is documented.
- Incorrect requests return a useful error.
- Unnecessary agents are not executed.

---

# 16. Task — Graph Nodes

File:

```text
backend/agents/career_manager/nodes.py
```

Create nodes such as:

```text
load_profile
analyze_goal
run_resume_agent
run_job_agent
run_skill_agent
run_preparation_agents
run_interview_agent
update_digital_twin
analyze_performance
run_what_if_planner
generate_next_action
```

Each node must:

- Receive shared state.
- Call the correct agent/service.
- Validate the result.
- Update only relevant fields.
- Return updated state.
- Handle failures.

---

# 17. Day 4 — Placement Digital Twin

Files:

```text
backend/agents/digital_twin/calculator.py
backend/agents/digital_twin/service.py
```

Digital Twin dimensions:

```text
Resume
DSA
Aptitude
Communication
Technical Skills
Interview
Job Match
```

The system should calculate an overall readiness score.

Conceptually:

```text
Readiness Score =
Resume contribution
+ DSA contribution
+ Aptitude contribution
+ Communication contribution
+ Technical contribution
+ Interview contribution
+ Job Match contribution
```

Weights should be configurable rather than scattered throughout the code.

---

# 18. Digital Twin Output

Example:

```json
{
  "overall_score": 72,
  "resume": 80,
  "dsa": 60,
  "aptitude": 75,
  "communication": 70,
  "technical": 78,
  "interview": 65,
  "job_match": 82,
  "weakest_area": "DSA",
  "recommended_action": "Practice arrays and strings"
}
```

The Digital Twin must use actual student performance data.

---

# 19. Digital Twin History

Store score snapshots through the shared Firebase/database service.

Track:

```text
date
target_role
target_job_id
overall_score
individual_scores
weakest_area
recommended_action
```

Do not create a separate database connection.

---

# 20. Digital Twin API

File:

```text
backend/api/routes/digital_twin.py
```

Implement the agreed endpoints, for example:

```http
GET /api/v1/digital-twin
GET /api/v1/digital-twin/history
POST /api/v1/digital-twin/recalculate
```

Each endpoint must:

1. Authenticate the user.
2. Load required career data.
3. Calculate/read readiness.
4. Return validated response data.
5. Handle errors.


---

# 21. Day 5 — What-If Career Planner

File:

```text
backend/agents/planner/service.py
```

The planner answers:

> "What should I improve first?"

It should compare possible improvements.

Example:

```text
Improve DSA by +10
Improve Aptitude by +10
Improve Resume by +10
Improve Technical Skills by +10
Improve Communication by +10
```

Then calculate which change has the highest impact on readiness.

Example response:

```json
{
  "current_score": 72,
  "recommended_area": "DSA",
  "estimated_score_after_improvement": 77,
  "reason": "DSA is currently the highest-impact weakness.",
  "priority": "HIGH"
}
```

### Important

The recommendation must be based on Digital Twin data, not generic LLM text alone.

---

# 22. Personalized Next Action

Generate one clear next action.

Example:

```text
Current readiness: 72%

Highest-impact area:
DSA

Next action:
Complete 10 medium-level array and string problems.

Reason:
DSA is currently limiting your readiness score.
```

The recommendation should consider:

- Current scores
- Target job requirements
- Skill gaps
- Previous performance
- Interview performance
- Preparation history

---

# 23. Day 5 — Career APIs

File:

```text
backend/api/routes/career.py
```

Implement agreed endpoints such as:

```http
POST /api/v1/career/analyze
POST /api/v1/career/next-action
GET  /api/v1/career/readiness
POST /api/v1/career/reassess
POST /api/v1/career/what-if
```

Example request:

```json
{
  "target_role": "Software Engineer",
  "target_job_id": "job_123"
}
```

Example response:

```json
{
  "target_role": "Software Engineer",
  "readiness_score": 72,
  "skill_gaps": [
    "Advanced DSA",
    "System Design"
  ],
  "weakest_area": "DSA",
  "next_action": "Complete 10 medium-level array problems"
}
```

---

# 24. Error Handling

File:

```text
backend/utils/errors.py
```

Handle:

- Invalid request
- User not found
- Job not found
- Agent failure
- LLM failure
- Firebase failure
- Timeout
- Invalid agent response
- Missing profile data

Use a standard structure:

```json
{
  "success": false,
  "error": {
    "code": "AGENT_EXECUTION_FAILED",
    "message": "Career analysis could not be completed."
  }
}
```

Never expose:

- API keys
- Passwords
- Database credentials
- Internal stack traces

---

# 25. Logging

File:

```text
backend/utils/logging.py
```

Log:

```text
request_id
agent_name
execution_id
start_time
end_time
duration
status
error_code
```

Never log:

```text
passwords
API keys
JWT tokens
unnecessary sensitive resume information
```

---

# 26. Agent Integration

Yamini integrates:

```text
Resume Agent
Job Agent
Skill Analysis Agent
Preparation Agents
Interview Agent
```

Do not rewrite other members' modules.

Consume their agreed interfaces.

Preferred conceptual interface:

```python
result = await agent.run(state)
```

Each result should identify:

```text
agent
status
data
error
```

Example:

```json
{
  "agent": "skill_analysis",
  "status": "success",
  "data": {
    "current_skills": [],
    "required_skills": [],
    "skill_gaps": []
  }
}
```

---

# 27. Required Data From Other Agents

## Resume Agent must provide

```text
resume_score
ats_score
resume_analysis
resume_skills
```

## Job Agent must provide

```text
job_id
job_title
required_skills
eligibility
job_match_score
```

## Skill Agent must provide

```text
current_skills
required_skills
skill_gaps
skill_gap_score
```

## Preparation Agents must provide

```text
dsa_score
aptitude_score
communication_score
technical_score
```

## Interview Agent must provide

```text
interview_score
weak_areas
interview_feedback
```

Yamini maps these results into the common CareerTwin state.

---

# 28. Firestore Coordination

Yamini does not own the entire database implementation.

The database owner provides:

```text
Firebase service
repositories
collection names
schema
```

Possible career collections:

```text
career_states
digital_twin_snapshots
performance_records
recommendations
```

Yamini consumes the shared repository/service interfaces.

---

# 29. Testing Responsibilities

Yamini owns tests for:

```text
Career Manager
LangGraph routing
Digital Twin
What-If Planner
LLM service
Career APIs
Agent integration
```

Create:

```text
backend/tests/unit/test_career_manager.py
backend/tests/unit/test_digital_twin.py
backend/tests/unit/test_planner.py

backend/tests/integration/test_career_flow.py
backend/tests/integration/test_agent_workflow.py
```

---

# 30. Required Unit Tests

Test:

- Correct route selection.
- Correct state updates.
- Score calculations.
- Weakest-area detection.
- What-If calculations.
- Invalid state handling.
- Missing profile data.
- Agent failure handling.
- LLM failure handling.
- Digital Twin recalculation.

---

# 31. Integration Tests

Test the complete workflow:

```text
Profile
  ↓
Career Manager
  ↓
Resume/Job/Skill Agents
  ↓
Preparation/Interview Results
  ↓
Digital Twin
  ↓
Performance Analysis
  ↓
What-If Planner
  ↓
Next Action
```

Use mocked agent/LLM responses where possible.

Do not make automated tests depend on paid live LLM calls.

---

# 32. Postman Responsibilities

Update:

```text
postman/CareerTwin.postman_collection.json
```

Test:

```http
GET /health

POST /api/v1/career/analyze
GET  /api/v1/career/readiness
POST /api/v1/career/what-if
POST /api/v1/career/reassess

GET  /api/v1/digital-twin
GET  /api/v1/digital-twin/history
POST /api/v1/digital-twin/recalculate
```

Include:

- Valid request
- Invalid request
- Missing authentication
- Invalid job ID
- Missing profile
- Agent failure

---

# 33. Documentation Responsibilities

## docs/architecture.md

Document:

- React frontend
- FastAPI backend
- LangGraph orchestration
- Specialized agents
- Firebase
- LLM
- RAG
- Digital Twin
- What-If Planner
- Deployment

## docs/agent-workflow.md

Document:

- Agent graph
- Shared state
- Routing
- Agent contracts
- Data flow
- Re-assessment cycle

## docs/integration-plan.md

Document:

- Module interfaces
- API contracts
- Integration order
- Dependencies
- Mock interfaces

---

# 34. Git Branch

Use:

```text
feature/yamini-core-ai
```

Workflow:

```text
develop
   ↓
feature/yamini-core-ai
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

Do not develop major features directly on `main`.

---

# 35. Commit Convention

Use clear commits:

```text
feat: add career manager graph
feat: add digital twin scoring
feat: add career analysis API
feat: add what-if planner
fix: handle agent execution failure
test: add digital twin tests
test: add career workflow integration tests
docs: document agent workflow
refactor: improve career state handling
```

---

# 36. Integration Strategy

Do not wait until every agent is complete.

Start with mocked outputs:

```text
Mock Resume Agent
Mock Job Agent
Mock Skill Agent
        ↓
Career Manager
        ↓
Digital Twin
        ↓
What-If Planner
        ↓
Next Action
```

Then replace each mock with the real member implementation.

This allows all four members to work in parallel.

---

# 37. Dependencies on Other Members

Yamini needs:

### Resume owner

```text
resume_analysis
ats_score
resume_skills
```

### Job owner

```text
job details
required skills
eligibility
job_match_score
```

### Skills owner

```text
current_skills
required_skills
skill_gaps
```

### Preparation owner

```text
dsa_score
aptitude_score
communication_score
technical_score
```

### Interview owner

```text
interview_score
weak_areas
feedback
```

### Database owner

```text
Firebase service
repository interface
collection names
schemas
```

### Frontend owner

Frontend consumes:

```text
career APIs
digital twin APIs
planner APIs
```

---

# 38. Sprint-Wise Responsibility

| Sprint | Yamini's Work |
|---|---|
| Day 1 | Read docs, define shared agent state, define all agent contracts, create backend/AI skeletons |
| Day 2 | FastAPI foundation, dependencies, centralized LLM service, error handling foundation |
| Day 3 | Career Manager graph, nodes, routing, mocked agent integration |
| Day 4 | Digital Twin calculation, history, readiness API |
| Day 5 | What-If Planner, next-action engine, career APIs |
| Day 6 | Integrate real agents, tests, Postman, documentation, final backend/AI integration |

---

# 39. Definition of Done — Career Manager

- [ ] Shared LangGraph state defined.
- [ ] Career Manager graph created.
- [ ] Routing implemented.
- [ ] Nodes implemented.
- [ ] Agent contracts documented.
- [ ] Mock agents integrated.
- [ ] Real agents integrated.
- [ ] Errors handled.
- [ ] Execution logging implemented.
- [ ] Unit tests pass.
- [ ] Integration tests pass.

---

# 40. Definition of Done — Digital Twin

- [ ] Readiness dimensions defined.
- [ ] Score calculation implemented.
- [ ] Target-job-specific readiness supported.
- [ ] Weakest area calculated.
- [ ] Historical snapshots supported.
- [ ] Digital Twin API implemented.
- [ ] Tests completed.
- [ ] Frontend integration contract documented.

---

# 41. Definition of Done — What-If Planner

- [ ] Current readiness loaded.
- [ ] Possible improvement areas generated.
- [ ] Impact calculated.
- [ ] Highest-impact area selected.
- [ ] Recommendation generated.
- [ ] Recommendation based on actual student data.
- [ ] Tests completed.

---

# 42. Definition of Done — Backend Integration

- [ ] FastAPI starts successfully.
- [ ] All owned routes registered.
- [ ] Authentication dependency integrated.
- [ ] Firebase service consumed correctly.
- [ ] LLM service works.
- [ ] Career Manager executes.
- [ ] Digital Twin updates.
- [ ] Planner returns next action.
- [ ] Errors use standard format.
- [ ] Postman collection works.
- [ ] Integration tests pass.

---

# 43. End-to-End Demo Scenario

A student:

```text
1. Logs in
2. Has a profile and resume
3. Selects Software Engineer
4. Selects a target job
5. Runs Career Analysis
```

CareerTwin then:

```text
6. Analyzes profile
7. Analyzes resume
8. Analyzes target job
9. Identifies skill gaps
10. Collects preparation scores
11. Calculates Digital Twin readiness
12. Identifies weakest area
13. Runs What-If analysis
14. Finds the highest-impact improvement
15. Generates personalized next action
16. Saves career state
17. Student practices
18. New performance is recorded
19. Digital Twin is recalculated
20. Career Manager generates the next recommendation
```

---

# 44. Final Acceptance Criteria

Yamini's module is complete only when:

- [ ] Career Manager orchestrates multiple agents.
- [ ] Shared state is consistent.
- [ ] Individual agent contracts are stable.
- [ ] Digital Twin reflects actual performance.
- [ ] What-If Planner uses Digital Twin data.
- [ ] Re-assessment updates readiness.
- [ ] Career APIs work.
- [ ] Firebase integration works through shared services.
- [ ] LLM calls are centralized.
- [ ] Errors are handled safely.
- [ ] Logging is available.
- [ ] Unit tests pass.
- [ ] Integration tests pass.
- [ ] Postman collection is updated.
- [ ] Documentation is complete.
- [ ] No secrets are committed.
- [ ] Code is merged into `develop`.
- [ ] Final end-to-end demo is ready.
