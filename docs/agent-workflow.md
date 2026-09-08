# CareerTwin Agent Workflow

The FastAPI layer accepts a user request and creates a typed `CareerState`. The Career Manager selects only the required agents, maps each stable `{agent, status, data, error}` result into its designated fields, calculates Digital Twin readiness, and optionally runs the What-If Planner.

```text
request -> profile/goal -> selected agents -> CareerState
                                      -> Digital Twin -> What-If Planner -> next action
```

The state is Pydantic-validated and supports partial workflows. Resume, job, skills, preparation, and interview agents are injected through `CareerManager.agent_runner`, so their implementations can be integrated without changing orchestration contracts. Digital Twin snapshots use the shared `FirebaseService` boundary.