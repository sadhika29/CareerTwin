# CareerTwin Architecture

The React frontend communicates with the FastAPI backend under `/api/v1`. The backend owns request validation, authentication dependency wiring, Career Manager orchestration, Digital Twin scoring, and What-If prioritization. Specialized agents remain replaceable integrations behind the Career Manager runner contract.

Readiness is a weighted calculation over resume, DSA, aptitude, communication, technical, interview, and job-match scores. Missing dimensions are excluded and the remaining weights are renormalized. Score snapshots are written through the shared Firebase service; the in-memory implementation is used until Firebase credentials and repositories are configured.

LLM calls belong behind `LLMService`. It accepts an injected provider for tests and does not expose credentials or log prompts by default.

Frontend contract: send `X-User-ID` with authenticated requests. Career analysis returns `readiness_score`, `skill_gaps`, `weakest_area`, `next_action`, and `what_if`. Digital Twin endpoints return the current dimensions or historical snapshots. Missing or invalid requests use `{success: false, error: {code, message}}`.