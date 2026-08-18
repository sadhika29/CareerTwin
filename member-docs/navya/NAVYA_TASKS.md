# CareerTwin — Navya TASKS.md

## 1. Member Information

**Name:** Navya  
**Role:** Frontend & UI Integration Developer  
**Primary Responsibility:** Build the CareerTwin user interface, connect the frontend to the backend APIs, display AI-generated career insights, preparation results and progress, and ensure the application is usable and consistent.

> **Important:** Navya has the comparatively easier workload. She should focus mainly on frontend/UI work and API integration rather than implementing the core AI agents, RAG pipeline, scoring algorithms, or backend architecture.

---

# 2. Module Overview

Navya owns the **presentation and user interaction layer** of CareerTwin.

The frontend should allow a student to:

```text
Register / Login
      ↓
Create Profile
      ↓
Upload Resume
      ↓
Set Target Role / Job
      ↓
View Resume + ATS Analysis
      ↓
View Job Match
      ↓
View Skill Gaps
      ↓
View Placement Digital Twin
      ↓
View Preparation Plan
      ↓
Take Assessments
      ↓
View Performance
      ↓
View Interview Results
      ↓
View What-If Recommendations
```

Navya does **not** own the internal implementation of these AI agents.

She only consumes their APIs and presents the results clearly.

---

# 3. Technology Responsibility

| Technology | Navya's Responsibility |
|---|---|
| React | Build the frontend application |
| Vite | Development/build environment |
| Tailwind CSS | Styling and responsive UI |
| React Router | Page navigation and protected routes |
| Axios | Calling FastAPI backend APIs |
| Recharts | Digital Twin/progress charts |
| Firebase Authentication | Login/register integration if required by final architecture |
| JavaScript/JSX | Component and page implementation |
| Git/GitHub | Branch-based frontend development |
| Browser DevTools | Frontend debugging |
| Postman | Basic API response verification |

---

# 4. Folder Ownership

Navya primarily owns:

```text
frontend/
├── src/
│   ├── components/
│   │   ├── Navbar.jsx
│   │   ├── Sidebar.jsx
│   │   ├── Loading.jsx
│   │   ├── ErrorMessage.jsx
│   │   ├── ScoreCard.jsx
│   │   ├── ProgressBar.jsx
│   │   └── EmptyState.jsx
│   │
│   ├── pages/
│   │   ├── Dashboard.jsx
│   │   ├── Profile.jsx
│   │   ├── Resume.jsx
│   │   ├── Jobs.jsx
│   │   ├── JobDetails.jsx
│   │   ├── SkillGaps.jsx
│   │   ├── DigitalTwin.jsx
│   │   ├── Preparation.jsx
│   │   ├── Assessment.jsx
│   │   ├── Performance.jsx
│   │   ├── Interview.jsx
│   │   └── WhatIfPlanner.jsx
│   │
│   ├── features/
│   │   ├── auth/
│   │   ├── resume/
│   │   ├── jobs/
│   │   ├── skills/
│   │   ├── preparation/
│   │   ├── interview/
│   │   └── career/
│   │
│   ├── api/
│   │   └── axiosClient.js
│   │
│   ├── routes/
│   │   └── AppRoutes.jsx
│   │
│   ├── hooks/
│   ├── utils/
│   ├── App.jsx
│   └── main.jsx
│
├── package.json
└── .env.example
```

The exact final structure may be adjusted to match the existing repository.

---

# 5. Files Navya Creates or Owns

Primary frontend files:

```text
frontend/src/pages/Dashboard.jsx
frontend/src/pages/Profile.jsx
frontend/src/pages/Resume.jsx
frontend/src/pages/Jobs.jsx
frontend/src/pages/JobDetails.jsx
frontend/src/pages/SkillGaps.jsx
frontend/src/pages/DigitalTwin.jsx
frontend/src/pages/Preparation.jsx
frontend/src/pages/Assessment.jsx
frontend/src/pages/Performance.jsx
frontend/src/pages/Interview.jsx
frontend/src/pages/WhatIfPlanner.jsx

frontend/src/components/Navbar.jsx
frontend/src/components/Sidebar.jsx
frontend/src/components/Loading.jsx
frontend/src/components/ErrorMessage.jsx
frontend/src/components/ScoreCard.jsx
frontend/src/components/ProgressBar.jsx
frontend/src/components/EmptyState.jsx

frontend/src/api/axiosClient.js
frontend/src/routes/AppRoutes.jsx
```

Feature-specific service files may be created:

```text
frontend/src/features/resume/resumeService.js
frontend/src/features/jobs/jobService.js
frontend/src/features/skills/skillService.js
frontend/src/features/preparation/preparationService.js
frontend/src/features/interview/interviewService.js
frontend/src/features/career/careerService.js
```

---

# 6. Files Navya Should Not Modify Without Coordination

Navya should not independently modify:

```text
backend/
backend/agents/
backend/rag/
backend/models/
backend/schemas/
backend/database/
```

She should not change AI logic, scoring formulas or database schemas.

Do not modify these shared frontend files without coordination:

```text
frontend/src/App.jsx
frontend/src/main.jsx
frontend/src/api/axiosClient.js
frontend/src/routes/AppRoutes.jsx
```

These files can be changed when required for integration, but changes should be communicated to the team.

---

# 7. Day 1 — Understand the Project

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

```text
Student
  ↓
Career Manager
  ↓
Resume / Job / Skill Agents
  ↓
Digital Twin
  ↓
Preparation
  ↓
Interview
  ↓
Performance
  ↓
What-If Planner
```

Navya should focus on understanding **what information each module returns**, not how each AI agent is implemented.

---

# 8. Day 1 — Create Frontend Skeleton

Create:

```text
frontend/
├── src/
│   ├── components/
│   ├── pages/
│   ├── features/
│   ├── api/
│   ├── routes/
│   ├── hooks/
│   └── utils/
├── package.json
├── vite.config.js
└── .env.example
```

Install only the required dependencies.

Recommended:

```text
react
react-dom
react-router-dom
axios
recharts
```

Tailwind CSS should be configured according to the project's chosen version/setup.

---

# 9. Day 1 — Create Common Layout

Build:

```text
Navbar
Sidebar
Main Content
Footer if required
```

The layout should work across:

```text
Dashboard
Resume
Jobs
Skill Gaps
Digital Twin
Preparation
Assessment
Performance
Interview
What-If Planner
```

Do not create a completely different layout for every page.

---

# 10. Day 1 — Navigation

Create navigation links:

```text
Dashboard
Profile
Resume
Jobs
Skill Gaps
Digital Twin
Preparation
Assessments
Performance
Interview
What-If Planner
```

Highlight the active page.

Handle mobile/responsive navigation.

---

# 11. Day 2 — Dashboard UI

File:

```text
frontend/src/pages/Dashboard.jsx
```

Dashboard should summarize the student's current state.

Display:

```text
Overall Readiness
Resume Score
ATS Score
Job Match
Skill Gap
DSA Score
Aptitude Score
Technical Score
Communication Score
Interview Score
```

Example:

```text
---------------------------------------
 Career Readiness
          72%
---------------------------------------

Resume       82%
Job Match    76%
DSA          61%
Aptitude     74%
Technical    70%
Interview    65%

Next Best Action:
Improve Dynamic Programming
```

The values must come from APIs when available.

---

# 12. Day 2 — Profile Page

File:

```text
frontend/src/pages/Profile.jsx
```

Display/edit:

```text
Name
Email
Education
Degree
College
Graduation Year
Skills
Target Role
Target Company
Career Goal
```

Provide:

```text
Edit
Save
Cancel
```

Handle:

```text
Loading
Success
Validation error
API error
```

---

# 13. Day 2 — Resume Page

File:

```text
frontend/src/pages/Resume.jsx
```

Provide:

```text
Upload Resume
View Resume
Analyze Resume
ATS Score
Resume Score
Missing Keywords
Strengths
Weaknesses
Recommendations
```

Upload support:

```text
PDF
DOCX
```

Display clear file validation messages.

---

# 14. Resume API Integration

Create:

```text
frontend/src/features/resume/resumeService.js
```

Functions:

```text
uploadResume()
getResume()
analyzeResume()
getATSScore()
```

The service must call the backend through:

```text
axiosClient
```

Do not put Axios calls directly into every component.

---

# 15. Resume UI Response

When API returns:

```json
{
  "ats_score": 78,
  "resume_score": 82,
  "missing_keywords": [
    "Docker",
    "REST APIs"
  ]
}
```

Display:

```text
ATS Score: 78

Resume Score: 82

Missing Keywords:
• Docker
• REST APIs
```

---

# 16. Day 3 — Jobs Page

File:

```text
frontend/src/pages/Jobs.jsx
```

Display:

```text
Job title
Company
Location
Job match score
Eligibility
Required skills
```

Provide:

```text
Search
Filter
View Details
```

---

# 17. Job Details Page

File:

```text
frontend/src/pages/JobDetails.jsx
```

Display:

```text
Company
Job title
Location
Description
Required skills
Preferred skills
Eligibility
Job Match Score
Missing Skills
```

Provide:

```text
Analyze Job
View Skill Gaps
Create Preparation Plan
```

---

# 18. Job API Integration

Create:

```text
frontend/src/features/jobs/jobService.js
```

Functions:

```text
getJobs()
getJobById()
analyzeJob()
getJobMatch()
```

Use the API contract provided by Veerendra.

Do not calculate the job match score in the frontend.

The backend is responsible for the actual calculation.

---

# 19. Day 3 — Skill Gap Page

File:

```text
frontend/src/pages/SkillGaps.jsx
```

Display:

```text
Current Skills
Required Skills
Matched Skills
Missing Skills
High Priority Skills
Medium Priority Skills
Low Priority Skills
```

Example:

```text
HIGH PRIORITY
System Design

MEDIUM PRIORITY
Docker

LOW PRIORITY
Kubernetes
```

---

# 20. Skill Gap API Integration

Create:

```text
frontend/src/features/skills/skillService.js
```

Functions:

```text
getSkills()
analyzeSkills()
getSkillGaps()
```

Use Veerendra's API response.

Do not duplicate skill-gap calculation in React.

---

# 21. Day 4 — Digital Twin Page

File:

```text
frontend/src/pages/DigitalTwin.jsx
```

This is one of the important UI pages.

Display:

```text
Overall Readiness
Resume
DSA
Aptitude
Communication
Technical
Interview
```

Example:

```text
Career Readiness

          74%

Resume          ████████ 82
DSA             ██████   61
Aptitude        ███████  74
Communication   ███████  70
Technical       ███████  76
Interview       ██████   65
```

---

# 22. Digital Twin Charts

Use:

```text
Recharts
```

Possible visualizations:

```text
Radar chart
Bar chart
Line chart
Progress indicators
```

Recommended:

```text
Radar Chart:
Resume
DSA
Aptitude
Communication
Technical
Interview
```

Line chart:

```text
Readiness over time
```

The chart should be readable and responsive.

---

# 23. Digital Twin API

Create:

```text
frontend/src/features/career/careerService.js
```

Functions:

```text
getDigitalTwin()
getReadinessHistory()
getCareerState()
```

The backend should provide the actual readiness values.

Navya only visualizes them.

---

# 24. Day 4 — Preparation Page

File:

```text
frontend/src/pages/Preparation.jsx
```

Display:

```text
Today's Tasks
Priority Topics
Estimated Study Time
DSA
Aptitude
Technical
Communication
Progress
```

Example:

```text
Today's Preparation

1. Dynamic Programming
   HIGH PRIORITY
   60 minutes

2. SQL
   MEDIUM PRIORITY
   30 minutes

3. Communication
   30 minutes
```

---

# 25. Preparation API Integration

Create:

```text
frontend/src/features/preparation/preparationService.js
```

Functions:

```text
getPreparationPlan()
getTodayTasks()
getPreparationProgress()
getWeakTopics()
```

Use Sadhika's API.

Do not generate preparation plans in the frontend.

---

# 26. Day 4 — Assessment Page

File:

```text
frontend/src/pages/Assessment.jsx
```

Display:

```text
Assessment title
Category
Difficulty
Questions
Timer
Progress
Submit
```

Support:

```text
DSA
Aptitude
Technical
Communication
```

---

# 27. Assessment Flow

Frontend flow:

```text
Select Assessment
      ↓
Load Questions
      ↓
Start Timer
      ↓
Answer Questions
      ↓
Submit
      ↓
Backend Evaluation
      ↓
Show Result
```

The frontend must not contain the correct answers.

---

# 28. Assessment API Integration

Use Sadhika's API.

Functions:

```text
createAssessment()
getAssessment()
submitAssessment()
getAssessmentResult()
```

Handle:

```text
Expired assessment
Network failure
Duplicate submission
Missing question
Invalid submission
```

---

# 29. Day 5 — Performance Page

File:

```text
frontend/src/pages/Performance.jsx
```

Display:

```text
Overall Score
DSA Score
Aptitude Score
Technical Score
Communication Score
Strong Topics
Weak Topics
Recent Assessments
Progress Trend
```

Use charts where useful.

---

# 30. Performance API

Use Sadhika's API.

Functions:

```text
getPerformance()
getWeakTopics()
getPerformanceHistory()
getReassessmentComparison()
```

Example:

```text
Dynamic Programming

Previous: 45%
Current: 78%

Improvement: +33%
```

---

# 31. Day 5 — Interview Page

File:

```text
frontend/src/pages/Interview.jsx
```

Display:

```text
Interview Type
Technical
Project
HR

Start Interview
Previous Interviews
Score
Feedback
Improvement Areas
```

Navya only handles the UI and API connection.

Interview question generation/evaluation belongs to the Interview Agent owner.

---

# 32. Interview API Integration

Create:

```text
frontend/src/features/interview/interviewService.js
```

Possible functions:

```text
startInterview()
submitAnswer()
getInterviewResult()
getInterviewHistory()
```

Use the final backend API contract.

---

# 33. Day 5 — What-If Planner UI

File:

```text
frontend/src/pages/WhatIfPlanner.jsx
```

The student should be able to ask:

```text
"What should I improve first?"

"What happens if I improve my DSA score?"

"What if I learn Docker?"

"Which skill will improve my job match most?"
```

Display:

```text
Current State
Possible Change
Predicted Impact
Recommended Action
```

Example:

```text
Current Job Match: 72%

If you improve:
Docker → Intermediate

Estimated Job Match:
72% → 78%

Recommendation:
Prioritize Docker.
```

The backend/planner agent performs the actual reasoning.

---

# 34. Day 6 — Authentication UI Integration

If authentication is already implemented:

Integrate:

```text
Login
Logout
Current user
Protected routes
Session handling
```

Do not implement a second authentication system.

Use the existing auth contract.

---

# 35. Protected Routes

File:

```text
frontend/src/routes/AppRoutes.jsx
```

Protect:

```text
/dashboard
/profile
/resume
/jobs
/skills
/digital-twin
/preparation
/assessment
/performance
/interview
/what-if
```

Unauthenticated user:

```text
Protected Page
      ↓
Redirect
      ↓
Login
```

---

# 36. API Client

File:

```text
frontend/src/api/axiosClient.js
```

Configure:

```text
baseURL
Authorization
timeout
common error handling
```

Example environment variable:

```text
VITE_API_BASE_URL=http://localhost:8000/api/v1
```

Do not hard-code production URLs.

---

# 37. Loading States

Every API-dependent page must support:

```text
Loading
Success
Empty
Error
```

Example:

```text
Loading...
```

Instead of showing an empty dashboard while the API is still loading.

---

# 38. Error Handling

Display user-friendly errors:

```text
Unable to load your resume.
Please try again.
```

Do not show:

```text
500 Internal Server Error
Traceback...
Database connection refused...
```

Internal details belong in backend logs.

---

# 39. Empty States

Handle cases such as:

```text
No resume uploaded
No jobs found
No skill gaps
No assessments completed
No performance history
No interview history
```

Example:

```text
No resume uploaded yet.

[Upload Resume]
```

---

# 40. Responsive Design

The UI should work on:

```text
Desktop
Laptop
Tablet
Mobile
```

Check:

```text
Navbar
Sidebar
Cards
Tables
Charts
Forms
Assessment screen
```

Do not allow horizontal overflow.

---

# 41. Reusable Components

Create reusable components for:

```text
ScoreCard
ProgressBar
Loading
ErrorMessage
EmptyState
Badge
Button
Modal
```

Avoid duplicating the same JSX across pages.

---

# 42. API Mock Data for Parallel Development

If backend APIs are not ready, use temporary mock data.

Example:

```json
{
  "overall_readiness": 72,
  "resume_score": 82,
  "dsa_score": 61,
  "aptitude_score": 74,
  "technical_score": 70,
  "interview_score": 65
}
```

Important:

Mock data should be easy to remove once APIs are ready.

Do not permanently hard-code project data into UI components.

---

# 43. Integration Dependencies

### From Yamini

Need:

```text
Career Manager response structure
Digital Twin API
What-If Planner API
Career state API
Authentication contract
```

### From Veerendra

Need:

```text
Resume API
ATS response
Job API
Job Match response
Skill Gap response
```

### From Sadhika

Need:

```text
Preparation API
Assessment API
Performance API
Re-assessment response
```

### From Interview Agent Owner / Team

Need:

```text
Interview API
Interview result format
Feedback format
```

---

# 44. API Response Contract

Navya should consume stable JSON.

Example:

```json
{
  "status": "success",
  "data": {
    "score": 82
  },
  "message": "Analysis completed successfully"
}
```

If the backend response changes, coordinate before modifying the frontend.

---

# 45. Frontend Testing

Navya is responsible for basic frontend testing.

Test:

```text
Navigation
Routing
Protected routes
Resume upload UI
Job list
Job details
Skill gaps
Digital Twin charts
Preparation plan
Assessment interaction
Performance charts
Interview UI
What-If UI
Error states
Loading states
Responsive layout
```

---

# 46. Browser Testing

Use browser DevTools to verify:

```text
Console errors
Network requests
API status
Request payload
Response payload
Responsive layout
```

No unnecessary console errors should remain in the final demo.

---

# 47. Postman Responsibility

Navya does not own the entire Postman collection.

She should use Postman to verify API responses before integrating them.

For example:

```text
GET /digital-twin
GET /jobs
GET /skills/gaps
GET /preparation/plan
GET /performance
```

This helps identify whether an issue is:

```text
Frontend problem
or
Backend/API problem
```

---

# 48. Documentation Responsibilities

Update:

```text
docs/frontend-workflow.md
```

Document:

```text
Frontend structure
Routing
API integration
Authentication handling
Environment variables
Reusable components
UI pages
```

---

# 49. Git Branch

Use:

```text
feature/navya-frontend
```

Workflow:

```text
develop
   ↓
feature/navya-frontend
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

# 50. Commit Convention

Use:

```text
feat: create dashboard layout
feat: add resume page
feat: integrate jobs API
feat: add skill gap dashboard
feat: add digital twin charts
feat: integrate preparation API
feat: add assessment interface
feat: add performance charts
feat: add protected routes
fix: handle empty dashboard state
fix: handle API loading state
style: improve responsive dashboard
```

---

# 51. Sprint-Wise Responsibilities

| Sprint | Responsibility |
|---|---|
| Day 1 | Read docs, set up frontend structure, configure routing and common layout |
| Day 2 | Dashboard, profile and resume UI |
| Day 3 | Jobs, job details and skill-gap UI/API integration |
| Day 4 | Digital Twin and preparation dashboard |
| Day 5 | Assessment, performance, interview and What-If UI |
| Day 6 | API integration, responsive testing, bug fixing and final demo preparation |

---

# 52. Definition of Done — Frontend

- [ ] Frontend starts successfully.
- [ ] Routing works.
- [ ] Common layout works.
- [ ] Dashboard works.
- [ ] Profile page works.
- [ ] Resume upload page works.
- [ ] Job pages work.
- [ ] Skill-gap page works.
- [ ] Digital Twin page works.
- [ ] Preparation page works.
- [ ] Assessment page works.
- [ ] Performance page works.
- [ ] Interview page works.
- [ ] What-If page works.
- [ ] APIs are integrated.
- [ ] Loading states are implemented.
- [ ] Error states are implemented.
- [ ] Empty states are implemented.
- [ ] Protected routes work.
- [ ] Responsive UI works.
- [ ] No critical console errors remain.

---

# 53. Final Acceptance Criteria

Navya's work is complete when:

- [ ] Student can navigate through the complete CareerTwin application.
- [ ] Student can view their profile.
- [ ] Student can upload/view their resume.
- [ ] Resume analysis results are displayed.
- [ ] ATS score is displayed.
- [ ] Jobs can be viewed.
- [ ] Job match score is displayed.
- [ ] Eligibility is displayed.
- [ ] Skill gaps are displayed.
- [ ] Digital Twin readiness is visualized.
- [ ] Personalized preparation plan is displayed.
- [ ] Assessments can be started.
- [ ] Assessment results are displayed.
- [ ] Performance trends are displayed.
- [ ] Interview functionality is connected.
- [ ] What-If recommendations are displayed.
- [ ] Protected pages require authentication.
- [ ] Backend errors are handled gracefully.
- [ ] Responsive design works.
- [ ] Frontend is integrated with the final backend APIs.
- [ ] Code is merged into `develop`.
- [ ] Final demo can be completed without manually editing database records.

---

# 54. End-to-End UI Demo Scenario

```text
LOGIN
  ↓
DASHBOARD
  ↓
Upload Resume
  ↓
Resume Analysis
  ↓
ATS Score = 78%
  ↓
Select Target Job
  ↓
Job Match = 82%
  ↓
Skill Gaps
  ↓
HIGH:
System Design
Docker
  ↓
Digital Twin
  ↓
Readiness = 72%
  ↓
Preparation
  ↓
Today's Tasks
  ↓
Assessment
  ↓
Score = 65%
  ↓
Performance
  ↓
Weak Area:
Dynamic Programming
  ↓
What-If Planner
  ↓
"Improve Dynamic Programming first"
```

---

# 55. Core Responsibility Summary

Navya owns the **UI + API Integration** layer.

```text
Backend Agents
      ↓
FastAPI
      ↓
Axios
      ↓
React
      ↓
Dashboard / Pages
      ↓
Student
```

She should **not implement the core AI reasoning**.

Her main goal is to make the work produced by Yamini, Veerendra and Sadhika visible, understandable and usable through a clean CareerTwin application.

