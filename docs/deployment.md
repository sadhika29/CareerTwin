# CareerTwin — Deployment Guide

## 1. Prerequisites

- Python 3.11+
- Node.js 18+ and npm
- Firebase project credentials (optional for mock/offline dev)
- Google Gemini API key or OpenAI API key

---

## 2. Backend Setup & Run

1. Navigate to the project root:
   ```bash
   cd CareerTwin
   ```

2. Configure environment variables:
   Copy `.env.example` or `backend/.env.example` to `.env`:
   ```bash
   cp backend/.env.example .env
   ```

3. Install backend dependencies:
   ```bash
   pip install -r backend/requirements.txt
   ```

4. Run the FastAPI development server:
   ```bash
   python -m uvicorn backend.main:app --host 0.0.0.0 --port 8000 --reload
   ```

5. Explore the interactive OpenAPI documentation:
   Open [http://localhost:8000/docs](http://localhost:8000/docs) in your browser.

---

## 3. Frontend Setup & Run

1. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the Vite development server:
   ```bash
   npm run dev
   ```

4. Access the web application at `http://localhost:5173`.

---

## 4. Production Deployment

### Backend (Docker / Cloud Run):
```dockerfile
FROM python:3.11-slim
WORKDIR /app
COPY backend/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY . .
EXPOSE 8000
CMD ["python", "-m", "uvicorn", "backend.main:app", "--host", "0.0.0.0", "--port", "8000"]
```

### Frontend (Vercel / Cloudflare Pages):
```bash
npm run build
```
Deploy the generated `dist/` directory to your static hosting provider.
