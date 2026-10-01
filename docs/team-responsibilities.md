# CareerTwin — Team Responsibilities & Module Ownership

## 1. Team Overview

| Member | Role | Primary Responsibility |
|---|---|---|
| **Yamini** | Lead Architect & Multi-Agent Orchestration | LangGraph Career Manager, Digital Twin Engine, What-If Planner, Auth & Shared Contracts |
| **Veerendra** | Resume, Job & Skill Intelligence | Resume Agent & ATS Scoring, Job Parser & Matcher, Skill Extraction & Gap Detection |
| **Sadhika** | Preparation, Assessment & Performance | Preparation Planner, Assessment Generator, Test Evaluation & Remediation, Performance Analytics |
| **Navya** | Frontend & UI Integration | React/Vite UI, Dashboards, Test Taking & Reports UI, What-If Interactive Visualizations |

---

## 2. Detailed Ownership Breakdown

### Yamini (Architecture & Core)
- **LangGraph Multi-Agent Orchestrator**: Manages state across all sub-agents.
- **Placement Digital Twin Engine**: Aggregates scores into overall placement readiness.
- **What-If Planner**: Evaluates simulated skill additions and predicts readiness impact.
- **Core APIs & Auth**: Authentication dependencies, Firebase service integration, and LLM central service.

### Veerendra (Intelligence Agents)
- **Resume Agent**: Parser for PDF/DOCX, section extraction, and ATS compatibility scoring.
- **Job Agent**: Job description parsing, required/preferred skill extraction, and job match scoring.
- **Skill Agent**: Skill taxonomy catalog, gap analysis, and priority ranking.

### Sadhika (Preparation & Assessment)
- **Preparation Recommendation**: Personalized study path by target role and skill gaps.
- **Assessment Engine**: Question bank, timed tests, and automatic evaluation.
- **Test Reporting & Remediation**: Detailed test reports tracking passed, failed, and skipped items with one-click incomplete work completion.
- **Performance Analytics**: Trend tracking, weak area identification, and historical snapshot summaries.

### Navya (Frontend Experience)
- **Student Dashboard**: Overview metrics, readiness radial ring, quick actions.
- **Assessment & Test Reports UI**: Interactive test runner, live timer, question review, and remediation flows.
- **Digital Twin & What-If UI**: Interactive scenario simulators and target role sliders.
