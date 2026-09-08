# Integration Plan

1. Connect each member agent to `CareerManager(agent_runner=...)` and return `{agent, status, data, error}`.
2. Map only the agent's documented fields in `apply_agent_result`.
3. Replace the in-memory `FirebaseService` implementation with the shared Firestore adapter without changing route or Digital Twin contracts.
4. Inject the configured provider into `LLMService`; unit tests must continue using a fake provider.

Required agent outputs are `resume_score` and `resume_analysis`, `job_match_score` and `job_analysis`, `skills` and `skill_gaps`, preparation dimension scores, and `interview_score`. The public endpoints are `/api/v1/career/analyze`, `/api/v1/career/readiness`, `/api/v1/career/what-if`, `/api/v1/career/reassess`, `/api/v1/digital-twin`, `/api/v1/digital-twin/history`, and `/api/v1/digital-twin/recalculate`.