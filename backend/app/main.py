from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware
from .dependency import get_current_user

app = FastAPI(title="Team Task Tracker")
from .routers import users, projects, tasks, comments, auth

app.add_middleware(CORSMiddleware, allow_origins=["http://localhost:5173"],
      allow_methods=["*"],
      allow_headers=["*"],
    )


app.include_router(users.router)
app.include_router(auth.router)

protected = [Depends(get_current_user)]
app.include_router(projects.router, dependencies=protected)
app.include_router(tasks.router, dependencies=protected)
app.include_router(comments.router, dependencies=protected)


@app.get("/")
def root():
  return {"message": "Task Tracker API is running"}

