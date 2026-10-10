# Were-not-Done-Y.E.T

# Board Buddies

Board Buddies is a web application where users can manage their
board game collections, add friends, join communities, and
borrow games from each other

## Tech Stack

- **Frontend:** React + Vite
- **Backend:** Python + FastAPI
- **Database:** Supabase (PostgreSQL)
- **Authentication:** Supabase Auth
- **Testing:** pytest

## Project Structure

```text
packages/
├── frontend/
│   └── src/
│       ├── components/
│       ├── pages/
│       ├── services/
│       └── lib/
└── backend/
    ├── app/
    │   ├── core/
    │   ├── db/
    │   ├── routers/
    │   ├── schemas/
    │   └── services/
    └── tests/
```

## Getting Started

Make sure you have Node.js, npm, and Python installed

### 1. Install Dependencies

From the project root:

**Frontend:**

```bash
cd packages/frontend
npm install
```

**Backend:**

```bash
cd ../..
python3 -m venv .venv
source .venv/bin/activate
pip install -r packages/backend/requirements.txt
```

### 2. Environment Variables

Create a `.env` file in both `packages/frontend` and
`packages/backend`

Use the `.env.example` files as a reference. Ask the team for
the Supabase project credentials

Do not push `.env` files to GitHub

### 3. Run the Project

Open two terminals

**Terminal 1 — Backend:**

```bash
cd packages/backend
python -m uvicorn app.main:app --reload
```

**Terminal 2 — Frontend:**

```bash
cd packages/frontend
npm run dev
```

## Testing Connections

Once both servers are running:

- Frontend: http://localhost:5173
- Backend API: http://127.0.0.1:8000/docs
- Health check: http://127.0.0.1:8000/api/health
- Frontend → Backend: http://localhost:5173/api/health

The health checks should return:

```json
{ "status": "ok" }
```

To run backend tests:

```bash
cd packages/backend
python -m pytest
```

## Git Workflow

Create a separate branch for your work, push your changes, and
open a Pull Request before merging into `main`

Make sure your changes work before submitting a PR
