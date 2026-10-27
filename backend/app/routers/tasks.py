from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session

from .. import models, schemas
from ..database import get_db

router = APIRouter(tags=["Tasks"])


@router.post("/projects/{project_id}/tasks", response_model=schemas.TaskOut, status_code=201)
def create_task(project_id: int, data: schemas.TaskCreate, db: Session= Depends(get_db)):
    if not db.get(models.Project, project_id):
        raise HTTPException(status_code=404, detail="Project not found")
    task = models.Task(project_id=project_id, **data.model_dump())
    db.add(task)
    db.commit()
    db.refresh(task)
    return task


@router.get("/tasks", response_model= list[schemas.TaskOut])
def list_tasks(
    project_id: int | None = None, 
    status: str | None = None,
    priority: str | None= None,
    assignee_id: int | None = None,
    db: Session = Depends(get_db)
):
    statement = select(models.Task)
    if project_id:
        statement = statement.where(models.Task.project_id == project_id)
    if status:
        statement = statement.where(models.Task.status == status)
    if priority:
        statement = statement.where(models.Task.priority == priority)
    if assignee_id: 
        statement = statement.where(models.Task.assignee_id == assignee_id)
    return db.scalars(statement).all()


@router.put("/tasks/{task_id}", response_model=schemas.TaskOut)
def update_task(task_id: int, data: schemas.TaskUpdate, db: Session = Depends(get_db)):
    task = db.get(models.Task, task_id)
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    for key, value in data.model_dump(exclude_unset=True).items():
        setattr(task, key, value)
    db.commit()
    db.refresh(task)
    return task


@router.delete("/tasks/{task_id}", status_code=204)
def delete_task(task_id: int, db: Session = Depends(get_db)):
    task = db.get(models.Task, task_id)
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    db.delete(task)
    db.commit()

