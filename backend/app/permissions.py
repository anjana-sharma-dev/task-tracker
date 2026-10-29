from fastapi import HTTPException
from sqlalchemy import select, or_
from sqlalchemy.orm import Session
from . import models

def is_member(db: Session, project_id: int, user_id: int) -> bool:
    stmt = select(models.Task.id).where(models.Task.project_id == project_id, or_(
        models.Task.assignee_id == user_id,
        models.Task.created_by_id == user_id,
      ),
    ).limit(1)
    return db.scalar(stmt) is not None

def get_task_for_user(db: Session, task_id: int, user: models.User):
    task = db.get(models.Task, task_id)
    if task:
        project = db.get(models.Project, task.project_id)
        if user.id in (project.owner_id, task.assignee_id, task.created_by_id):
            return task
    raise HTTPException(status_code=404, detail="Task not found")

