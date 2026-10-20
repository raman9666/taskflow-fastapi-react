# TaskFlow — FastAPI + React Task Manager

![CI](https://github.com/raman9666/taskflow-fastapi-react/actions/workflows/ci.yml/badge.svg)

A full-stack task management app: a **FastAPI** REST API with **JWT authentication** and **SQLAlchemy 2**, and a **React (Vite)** Kanban-style dashboard.

## Features
- User registration and login with hashed passwords (bcrypt) and JWT bearer tokens
- Task CRUD with status (To do / In progress / Done), priority and due dates
- Per-user data isolation — users only ever see their own tasks
- Filtering by status and priority, full-text search, pagination
- Stats endpoint (totals per status and overdue count) powering dashboard cards
- Auto-generated OpenAPI docs at `/docs`
- Pytest test suite, Dockerfile and docker-compose

## Tech stack
Python 3.12 · FastAPI · SQLAlchemy 2 · Pydantic v2 · python-jose (JWT) · passlib/bcrypt · SQLite (swap for PostgreSQL via `TASKFLOW_DATABASE_URL`) · React 18 · Vite

## API
| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/auth/register` | Create an account |
| POST | `/api/auth/login` | Get a JWT (OAuth2 password form) |
| GET | `/api/auth/me` | Current user |
| GET | `/api/tasks` | List tasks (`status`, `priority`, `search`, `skip`, `limit`) |
| GET | `/api/tasks/stats` | Dashboard counts |
| POST | `/api/tasks` | Create task |
| GET/PATCH/DELETE | `/api/tasks/{id}` | Read / update / delete task |

## Run locally
```bash
# Backend
cd backend
python -m venv .venv && source .venv/bin/activate   # Windows: .venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env
uvicorn app.main:app --reload        # http://localhost:8000/docs

# Tests
pytest

# Frontend (new terminal)
cd frontend
npm install
npm run dev                           # http://localhost:5173
```

Or run the API with Docker: `docker compose up --build`.
