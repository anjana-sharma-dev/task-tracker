# Team Task Tracker

A full-stack task management app built to practice production-style backend development with FastAPI.

## Features
- User signup/login with JWT authentication (bcrypt password hashing)
- Projects, tasks and comments with owner/creator/assignee permission checks
- Task assignment, due dates and overdue badges
- Redis caching for project list, login rate limiting, token blacklist on logout
- Background jobs for assignment notifications (RQ and Celery)
- Fully containerized with Docker Compose

## Tech Stack
- **Backend:** Python, FastAPI, SQLAlchemy, Alembic, Pydantic
- **Database/Cache:** PostgreSQL, Redis
- **Background jobs:** RQ, Celery
- **Frontend:** React (Vite)
- **DevOps:** Docker, Docker Compose

## Getting Started

### Prerequisites
- Docker and Docker Compose

### Run locally
1. Clone the repo
   ```bash
   git clone https://github.com/anjana-sharma-dev/task-tracker.git
   cd task-tracker
   ```
2. Create your env file
   ```bash
   cp .env.example .env
   ```
   Then fill in the values in `.env`:
   - `POSTGRES_USER`, `POSTGRES_PASSWORD`, `POSTGRES_DB`: any database credentials you like
   - `SECRET_KEY`: a random string, generate one with `openssl rand -hex 32`
3. Start all services
   ```bash
   docker compose up --build
   ```
4. Open the app
   - Frontend: http://localhost:5173
   - API docs (Swagger): http://localhost:8000/docs