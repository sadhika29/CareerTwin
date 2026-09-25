# Frontend workflow

CareerTwin's frontend lives in `frontend/src`. `AppRoutes.jsx` owns the page map and `Navbar.jsx` provides the shared responsive shell. Pages use reusable states and presentation components from `components/` and keep API calls in feature services.

## Configuration

Set `VITE_API_BASE_URL` to the FastAPI base URL, for example `http://localhost:8000/api/v1`. The Axios client sends `X-User-ID` from `localStorage` as required by the backend. The current UI uses `demo-student` when no authenticated session exists; replace that value with the final authentication provider's user id when auth is integrated.

## API integration

Career and Digital Twin data are connected through `features/career/careerService.js`. Resume, jobs, skills, preparation, and interview service adapters are ready for the corresponding backend routes. Those backend route modules are currently empty, so the affected screens show explicitly labelled demo data rather than silently failing.

Run `npm install`, then `npm run dev` for local work. Run `npm run lint` and `npm run build` before submitting frontend changes.
