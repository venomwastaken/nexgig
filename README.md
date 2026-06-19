# NexGiG
 
Student freelancing marketplace. Backend: FastAPI + SQLModel + PostgreSQL.
Frontend: React + Vite + TypeScript.
 
## First-time setup (after cloning)
 
Prerequisites: Docker Desktop and Node.js installed on your machine.
 
1. `git clone <repo-url>` then `cd nexgig`
2. `cp backend/.env.example backend/.env`
3. `docker compose up` — starts Postgres + FastAPI together
   - Confirm it worked: visit http://localhost:8000/health, should show `{"status": "ok"}`
   - Leave this running in its own terminal tab
4. In a **new terminal tab**: `cd frontend`
5. `cp .env.example .env`
6. `npm install`
7. `npm run dev` — starts the frontend, usually at http://localhost:5173
   - Confirm it worked: open that URL, should show "Backend status: ok"
   - If it says "backend unreachable," make sure step 3 is still running
You do **not** need Python or PostgreSQL installed directly — Docker handles both.
 
## Day-to-day (after first-time setup)
 
Going forward you only need:
```
docker compose up        # backend + db
```
```
cd frontend && npm run dev   # frontend, separate terminal tab
```
 
## Project structure
- `backend/` — FastAPI service. See `backend/app/main.py` for the entrypoint.
- `frontend/` — React app. See `frontend/src/main.tsx` for the entrypoint.
- `docker-compose.yml` — runs backend + Postgres together for local dev.
- `.github/workflows/ci.yml` — runs automatically on every PR.
## Workflow
- Branch off `main` for every change: `feature/short-description`
- Open a PR into `main` once done — CI must pass before merging
- No direct pushes to `main`