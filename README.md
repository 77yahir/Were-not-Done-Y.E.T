# Were-not-Done-Y.E.T

# Board Buddies

Board Buddies is a web application where users can manage their
board game collections, add friends, join communities, and
borrow games from each other

## Tech Stack

- **Frontend:** React + Vite
- **Styling:** Tailwind CSS (Library, Wishlist, Messages) and
  `App.css` (everything else, including Friends and Communities)
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
│       ├── hooks/
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

Board game search on the Add Game and Wishlist forms also needs
a BoardGameGeek application token. Set it as `BGG_API_TOKEN` in
`packages/backend/.env` and restart the backend. Without it,
games can still be typed in by hand

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

To run the automated tests, see [Testing](#testing)

## Testing

From the project root, `npm test` runs the frontend UI tests and
then the backend tests

```bash
npm test               # everything
npm run test:frontend  # UI tests only
npm run test:backend   # backend tests only
```

### Setup

- **Frontend:** run `npm install` in `packages/frontend`. That
  installs Vitest, React Testing Library and jsdom. They support
  Node 22.13+ and Node 24. On other versions, npm warns that the
  engine is unsupported
- **Backend:** set up and activate the virtual environment from
  [Getting Started](#getting-started)
  (`source .venv/bin/activate`). The backend tests run with
  `python`
- **Test database:** most backend tests need a local Supabase,
  never the team's shared one. It runs in Docker or in a
  Docker-compatible runtime such as Podman or Colima. From the
  project root:

  ```bash
  npx supabase start -x realtime,storage-api,imgproxy,mailpit,postgres-meta,studio,edge-runtime,logflare,vector,supavisor
  ```

  `npx` runs the Supabase CLI without installing it. `-x` leaves
  out the services the tests don't use, so it starts faster and
  uses less memory. With Podman, first point the CLI at Podman:

  ```bash
  export DOCKER_HOST="unix://$(podman machine inspect --format '{{.ConnectionInfo.PodmanSocket.Path}}')"
  ```

  This creates a fresh local database at
  `http://127.0.0.1:54321` and applies every migration in
  `supabase/migrations`. Copy `ANON_KEY` and `SERVICE_ROLE_KEY`
  from `npx supabase status -o env` into
  `packages/backend/.env`:

  ```
  SUPABASE_TEST_URL=http://127.0.0.1:54321
  SUPABASE_TEST_ANON_KEY=<ANON_KEY>
  SUPABASE_TEST_SERVICE_ROLE_KEY=<SERVICE_ROLE_KEY>
  ```

  Run `npx supabase stop` when you're done. The tests refuse to
  run against any other URL. Without these settings, the tests
  that need the database stop with "Tests must use local
  Supabase", and the rest still run

The tests need no seed data. Each test creates its own users and
data, and the backend tests delete theirs when they finish. The
UI tests need no servers or database

### System tests

System tests call the backend API the same way the frontend
does. A request goes through the FastAPI router, the login check
and the service to the local database, where the SQL functions
and security rules run. Nothing is mocked

| File (`packages/backend/tests/`) | Feature                                                 | What it checks                                                                                                                                                           |
| -------------------------------- | ------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `test_system_friend_library.py`  | Viewing a friend's library (US-21)                      | A friend sees a game the owner just added, with its picture and details. A stranger, someone whose friend request hasn't been accepted, and a removed friend all get 403 |
| `test_system_wishlist.py`        | Adding to and removing from the wishlist (US-11, US-12) | A game can be added, listed and removed. Adding the same title twice gives 409. Another user can't remove it (404)                                                       |

To run only these:
`cd packages/backend && python -m pytest tests -k system`

The `test_*_security.py` files also run against the local
database, but they call Supabase directly instead of going
through the API

### UI tests

UI tests use Vitest, React Testing Library and jsdom, a
simulated browser. Each test renders the whole app, clicks and
types like a user, and checks what appears on screen. Only the
backend API and the Supabase login session are fakes
(`src/tests/fakeBackend.js` and `src/tests/fakeSupabase.js`), so
every page, component and service file runs as it does in the
browser

| File (`packages/frontend/src/tests/`) | User story                                                         | What it checks                                                                                                                                                                                                                                  |
| ------------------------------------- | ------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `viewFriendLibrary.test.jsx`          | View a friend's library (US-21), then ask to borrow a game (US-15) | Opening a friend from the Friends page shows their games, with pictures and availability. Requesting an available game shows a confirmation. A game someone else borrowed first shows an error. A stranger's profile asks you to become friends |
| `logIn.test.jsx`                      | Log in and see your own games (FR-01)                              | Logging in takes you to your Library. A wrong password shows an error. A logged-out visitor is sent to the login form                                                                                                                           |

### Limitations

- The UI tests use a fake backend, so they can't catch the
  frontend and backend disagreeing about a request. The system
  tests check the backend side of the same features
- Borrowing has no system tests yet. Its tables and functions
  exist only in the shared database, not in
  `supabase/migrations`, so a local database doesn't have them

## Git Workflow

Create a separate branch for your work, push your changes, and
open a Pull Request before merging into `main`

Make sure your changes work before submitting a PR
