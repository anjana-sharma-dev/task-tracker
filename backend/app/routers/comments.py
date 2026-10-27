from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session
from ..dependency import get_current_user


from .. import models, schemas
from .. database import get_db

router = APIRouter(tags=["Comments"])


@router.post("/tasks/{task_id}/comments", response_model=schemas.CommentOut, status_code=201)
def add_comment(task_id: int, data: schemas.CommentCreate, db: Session = Depends(get_db), 
                current_user: models.User = Depends(get_current_user),):
  if not db.get(models.Task, task_id):
    raise HTTPException(status_code=404, detail="Task not found")
  comment = models.Comment(task_id=task_id, user_id= current_user.id, **data.model_dump(),)
  db.add(comment)
  db.commit()
  db.refresh(comment)
  return comment


@router.get("/tasks/{task_id}/comments", response_model=list[schemas.CommentOut])
def list_comments(task_id: int, db: Session = Depends(get_db)):
  stmt = (select(models.Comment).where(models.Comment.task_id == task_id).order_by(models.Comment.created_at))
  return db.scalars(stmt).all()
