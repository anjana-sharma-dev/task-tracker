from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select, or_
from sqlalchemy.orm import Session

from .. import models, schemas
from ..database import get_db
from ..dependency import get_current_user
from ..permissions import is_member, get_task_for_user
from ..redis_client import r, queue
from ..jobs import send_assignment_notification

router = APIRouter(tags=["Tasks"])

@router.post("/projects/{project_id}/tasks", response_model=schemas.TaskOut, status_code=201)
def create_task(project_id: int, data: schemas.TaskCreate, db: Session= Depends(get_db),
                current_user: models.User = Depends(get_current_user)):
    project = db.get(models.Project, project_id)
    is_owner = project is not None and project.owner_id == current_user.id

    if not project or not (is_owner or is_member(db, project_id, current_user.id)):
      raise HTTPException(status_code=404, detail="Project not found")
    
    values = data.model_dump()
    if not is_owner:
        values["assignee_id"] = None 
    elif values["assignee_id"] and not db.get(models.User, values["assignee_id"]):
        raise HTTPException(status_code=404, detail="User not found")
    
    task = models.Task(project_id=project_id, created_by_id=current_user.id, **values)
    db.add(task)
    db.commit()
    
    for uid in {current_user.id, task.assignee_id}:
        if uid:
            r.delete(f"projects:user:{uid}")
    if task.assignee_id:
            queue.enqueue(send_assignment_notification, task.id, task.assignee_id, task.title)

    db.refresh(task)
    return task

@router.get("/tasks", response_model= list[schemas.TaskOut])
def list_tasks(
    project_id: int | None = None, 
    status: str | None = None,
    priority: str | None= None,
    assignee_id: int | None = None,
    db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)
):
    # stmt = select(models.Task).where(models.Task.project_id.in_(visible))
    stmt = select(models.Task).join(models.Project, models.Task.project_id == models.Project.id).where(or_(
        models.Project.owner_id == current_user.id,
        models.Task.assignee_id == current_user.id,
        models.Task.created_by_id == current_user.id
    ))
    if project_id:
        stmt = stmt.where(models.Task.project_id == project_id)
    if status:
        stmt = stmt.where(models.Task.status == status)
    if priority:
        stmt = stmt.where(models.Task.priority == priority)
    if assignee_id: 
        stmt = stmt.where(models.Task.assignee_id == assignee_id)
    return db.scalars(stmt).all()


@router.put("/tasks/{task_id}", response_model=schemas.TaskOut)
def update_task(task_id: int, data: schemas.TaskUpdate, db: Session = Depends(get_db),
                current_user: models.User = Depends(get_current_user) ):
    task = get_task_for_user(db, task_id, current_user)
    old_assignee = task.assignee_id

    changes = data.model_dump(exclude_unset=True)
    if "assignee_id" in changes:
        project = db.get(models.Project, task.project_id)
        if current_user.id not in (project.owner_id, task.created_by_id):
            raise HTTPException(status_code=403, detail="Only the project owner or task creator can assign tasks")
        
        new_id = changes["assignee_id"]
        if new_id is not None and not db.get(models.User, new_id):
            raise HTTPException(status_code=404, detail="User not found")

    for key, value in changes.items():
        setattr(task, key, value)
    db.commit()

    for uid in {old_assignee, task.assignee_id}:
        if uid:
            r.delete(f"projects:user:{uid}")

    if "assignee_id" in changes and task.assignee_id != old_assignee:
        queue.enqueue(send_assignment_notification, task.id, task.assignee_id, task.title)
        
    db.refresh(task)
    return task


@router.delete("/tasks/{task_id}", status_code=204)
def delete_task(task_id: int, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    task = get_task_for_user(db, task_id, current_user)

    project = db.get(models.Project, task.project_id)
    if project.owner_id != current_user.id:
        raise HTTPException(status_code=403, detail="Only the project owner can delete tasks")
    uids_to_clear = {task.created_by_id, task.assignee_id}
    db.delete(task)
    db.commit()

    for uid in uids_to_clear:
        if uid:
            r.delete(f"projects:user:{uid}")

@router.get("/labels", response_model=list[schemas.LabelOut])
def list_labels(db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    """Return all available labels (global list)."""
    return db.scalars(select(models.Label)).all()


@router.post("/tasks/{task_id}/labels/{label_id}", response_model=schemas.TaskOut)
def add_label_to_task(
    task_id: int,
    label_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    task = get_task_for_user(db, task_id, current_user)
    label = db.get(models.Label, label_id)
    if not label:
        raise HTTPException(status_code=404, detail="Label not found")
    if label not in task.labels:          # avoid duplicate
        task.labels.append(label)
        db.commit()
        db.refresh(task)
    return task


@router.delete("/tasks/{task_id}/labels/{label_id}", response_model=schemas.TaskOut)
def remove_label_from_task(
    task_id: int,
    label_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    task = get_task_for_user(db, task_id, current_user)
    label = db.get(models.Label, label_id)
    if not label:
        raise HTTPException(status_code=404, detail="Label not found")
    if label in task.labels:
        task.labels.remove(label)
        db.commit()
        db.refresh(task)
    return task

