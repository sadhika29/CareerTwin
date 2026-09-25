# Frontend workflow

CareerTwin's frontend lives in `frontend/src`. `AppRoutes.jsx` owns the page map and `Navbar.jsx` provides the shared responsive shell. Pages use reusable states and presentation components from `components/` and keep API calls in feature services.

## Configuration

Copy `frontend/.env.example` to `frontend/.env` and set `VITE_API_BASE_URL` to the FastAPI base URL, for example `http://localhost:8000/api/v1`. The Axios client sends the authenticated user's `X-User-ID` and bearer token from the session.

Sign Up and Sign In use `/api/v1/auth/register` and `/api/v1/auth/login`. The current development auth store is in memory until Firebase or a database-backed identity provider is configured. Google authentication is intentionally surfaced as unavailable until provider credentials are supplied.

## API integration

Career and Digital Twin data are connected through `features/career/careerService.js`. Resume, jobs, skills, preparation, and interview service adapters are ready for the corresponding backend routes. Those specialized backend route modules are currently empty, so the affected screens show explicitly labelled demo data rather than silently failing. The UI does not calculate or invent those backend results.

Run `npm install`, then `npm run dev` for local work. Run `npm run lint` and `npm run build` before submitting frontend changes.
