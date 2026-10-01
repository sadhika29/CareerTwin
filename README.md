# CareerTwin — Agentic AI Career Intelligence & Placement Preparation System

**CareerTwin** is an advanced Agentic AI system that transforms student career guidance from static resume storage into proactive, personalized placement intelligence. By creating a **Placement Digital Twin** of the student, CareerTwin analyzes resumes against target job descriptions, identifies critical skill gaps, computes deterministic ATS scores, runs What-If career trajectory scenarios, and creates customized preparation roadmaps.

---

## 🚀 Key Modules & Architecture

```text
Student Resume + Student Profile + Target Job Posting
                            ↓
                  ┌────────────────────┐
                  │   Resume Agent     │
                  └─────────┬──────────┘
                            │ (Extracted text, ATS Score, Resume Skills, Strengths)
                            ↓
                  ┌────────────────────┐
                  │    Job Agent       │
                  └─────────┬──────────┘
                            │ (Required/Preferred Skills, Experience, Eligibility)
                            ↓
                  ┌────────────────────┐
                  │   Skill Agent      │
                  └─────────┬──────────┘
                            │ (Normalized Gaps, Priority Tiers, Recommendations)
                            ↓
                  ┌────────────────────┐
                  │   Career Manager   │
                  └─────────┬──────────┘
                            │ (LangGraph Multi-Agent Orchestrator)
                            ↓
                  ┌────────────────────┐
                  │    Digital Twin    │
                  └─────────┬──────────┘
                            │ (Placement Probability & Readiness Calculator)
                            ↓
                  ┌────────────────────┐
                  │  What-If Planner   │
                  └────────────────────┘
```

### 1. Resume Intelligence & ATS Evaluation
- **Dual Format Parsing**: Native high-fidelity text extraction from PDF (PyMuPDF) and DOCX (python-docx).
- **Deterministic ATS Scoring**: Multi-factor ATS readiness scoring combining keyword alignment (35%), skill matching (35%), experience relevance (15%), and section completeness (15%).
- **AI Resume Intelligence**: Structured analysis of strengths, weaknesses, omitted sections, and role-tailored recommendations.

### 2. Job Analysis & Deterministic Eligibility
- **Job Description Extraction**: Unstructured text parsing to extract required skills, preferred qualifications, experience requirements, and responsibilities.
- **Deterministic Eligibility Engine**: Non-hallucinatory rules evaluating degree prerequisites, minimum experience thresholds, and core technical skills.
- **Weighted Job Match Scoring**: Configurable scoring (40% required skills, 20% preferred skills, 15% education, 15% experience, 10% role alignment).

### 3. Skill Gap & Priority Engine
- **Taxonomy Normalization**: Automatic alias resolution (e.g., `js`/`javascript` -> `JavaScript`, `k8s` -> `Kubernetes`).
- **Priority Tiering**: Categorizes skill gaps into `HIGH` (CS fundamentals, system design, core languages), `MEDIUM` (frameworks, web tools, docker), and `LOW` (niche tools, redis, secondary cloud).
- **Preparation Integration**: Feeds structured skill gaps into preparation and practice roadmaps.

### 4. RAG Knowledge Pipeline
- **Role Roadmaps & Interview Concepts**: Ingests curated career knowledge for Software Engineers, Backend/Frontend Developers, DSA, and System Design.
- **Vector Retrieval**: Semantic similarity retrieval with metadata filtering (`role`, `skill`, `topic`) to ground agent recommendations.

---

## 🛠️ Technology Stack

| Domain | Technologies |
|---|---|
| **Backend & APIs** | Python 3.14, FastAPI, Pydantic v2, Uvicorn |
| **Agentic AI & LLMs** | Google GenAI SDK (Gemini 2.5 Flash), LangChain, LangGraph |
| **Document Processing** | PyMuPDF (fitz), python-docx |
| **Database & Storage** | Firebase Firestore, Firebase Storage / Local Storage |
| **RAG & Vector Search** | Scikit-learn, NumPy, Sentence Transformers |
| **Testing** | Pytest, Pytest-Asyncio, FastAPI TestClient |

---

## 📁 Project Structure

```text
CareerTwin/
├── backend/
│   ├── agents/
│   │   ├── resume/            # Resume analysis agent & prompts
│   │   ├── jobs/              # Job description analysis agent & prompts
│   │   ├── skills/            # Skill gap analysis agent & prompts
│   │   └── career_manager/    # LangGraph orchestration state & graph
│   ├── api/
│   │   └── routes/
│   │       ├── resume.py      # /resumes upload, details, ATS endpoints
│   │       ├── jobs.py        # /jobs create, parse, match, eligibility
│   │       └── skills.py      # /skills catalog, gap analysis endpoints
│   ├── database/
│   │   ├── firebase.py        # Firebase app initialization
│   │   ├── firestore.py       # Firestore document operations & listing
│   │   ├── storage.py         # Abstract storage interface
│   │   └── local_storage.py   # Local filesystem resume storage
│   ├── models/                # Dataclass domain models (resume, job, skill)
│   ├── schemas/               # Pydantic request/response schemas
│   ├── services/              # Business logic (job_service, ats_service, etc.)
│   ├── rag/                   # RAG ingestion, embeddings, retriever, vector store
│   └── main.py                # FastAPI app entry point with CORS
├── docs/                      # Technical documentation
│   ├── api-documentation.md   # Complete REST API specifications
│   ├── agent-workflow.md      # Multi-agent contracts and scoring formulas
│   └── database-schema.md     # Firestore collections and schema guide
├── postman/                   # CareerTwin Postman API collection
├── tests/                     # Automated test suite
│   ├── backend/               # Unit tests (agents, job matching, skills, RAG)
│   └── integration/           # Integration tests for all API endpoints
└── README.md                  # Project root README
```

---

## ⚙️ Installation & Setup

### 1. Clone & Enter Directory
```bash
git clone https://github.com/yamini823/CareerTwin.git
cd CareerTwin
```

### 2. Environment Configuration
Create a `.env` file in the project root:
```env
GEMINI_API_KEY=your_gemini_api_key_here
FIREBASE_CREDENTIALS_PATH=firebase-service-account.json
FIREBASE_STORAGE_BUCKET=careertwin-c0f2a.firebasestorage.app
```

### 3. Install Dependencies
```bash
pip install fastapi uvicorn pydantic google-genai pymupdf python-docx pytest pytest-asyncio scikit-learn numpy
```

---

## 🚦 Running the Application

### Start the API Server
```bash
uvicorn backend.main:app --host 0.0.0.0 --port 8000 --reload
```

Once running:
- **Interactive API Docs (Swagger UI)**: [http://localhost:8000/docs](http://localhost:8000/docs)
- **Alternative Docs (ReDoc)**: [http://localhost:8000/redoc](http://localhost:8000/redoc)
- **Health Check**: [http://localhost:8000/health](http://localhost:8000/health)

---

## 🧪 Running Automated Tests

Run the complete test suite:
```bash
python -m pytest tests/ -v
```

Run specific test modules:
```bash
# Test Resume Parser
python -m pytest tests/backend/test_resume_parser.py

# Test Job Matching & Deterministic Eligibility
python -m pytest tests/backend/test_job_matching.py

# Test Skill Gap Analysis & Normalization
python -m pytest tests/backend/test_skill_gap.py

# Test AI Agents & Career Manager Contracts
python -m pytest tests/backend/test_agents.py

# Test RAG Knowledge Pipeline
python -m pytest tests/backend/test_rag.py

# Test API Endpoints Integration
python -m pytest tests/integration/test_api_endpoints.py
```

---

## 📖 API Documentation & Postman

- **Full API Specification**: See [`docs/api-documentation.md`](docs/api-documentation.md)
- **Multi-Agent Contracts**: See [`docs/agent-workflow.md`](docs/agent-workflow.md)
- **Database Schema**: See [`docs/database-schema.md`](docs/database-schema.md)
- **Postman Collection**: Import [`postman/CareerTwin.postman_collection.json`](postman/CareerTwin.postman_collection.json) into Postman to test all endpoints with pre-built requests.

---

## 👥 Team & Responsibilities

- **Veerendra**: Career Input Analysis Layer (Resume, Job Intelligence, ATS, Skill Gap Agent, RAG Pipeline).
- **Yamini**: Lead Backend, Career Manager / Orchestrator Agent, LangGraph workflow, Digital Twin.
- **Sadhika**: Placement Preparation Module, DSA practice engine, Interview Simulation.
- **Navya**: Frontend Application, UI/UX components, candidate dashboard.
