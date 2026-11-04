from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select, or_
from sqlalchemy.orm import Session
from ..dependency import get_current_user
import json
from ..redis_client import r


from .. import models, schemas
from ..database import get_db
router = APIRouter(prefix="/projects", tags=["Projects"])


@router.post("", response_model=schemas.ProjectOut, status_code=201)
def create_project(data: schemas.ProjectCreate, db: Session = Depends(get_db), 
                   current_user: models.User = Depends(get_current_user),):
    project = models.Project(**data.model_dump(), owner_id=current_user.id)
    db.add(project)
    db.commit()
    r.delete(f"projects:user:{current_user.id}")
    db.refresh(project)
    return project


@router.get("", response_model=list[schemas.ProjectOut])
def list_projects(db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    key = f"projects:user:{current_user.id}"
    cached = r.get(key)
    if cached:
        print(f"CACHE HIT {key}", flush=True)
        return json.loads(cached)
    print(f"CACHE MISS {key}", flush=True)

    assigned = select(models.Task.project_id).where(
        or_(
            models.Task.assignee_id == current_user.id,
            models.Task.created_by_id == current_user.id,        
        )
      )
    stmt = select(models.Project).where(or_(
        models.Project.owner_id == current_user.id, models.Project.id.in_(assigned)
    ))
    # return db.scalars(select(models.Project)).all()
    projects =  db.scalars(stmt).all()
    data = [schemas.ProjectOut.model_validate(p).model_dump(mode="json") for p in projects]
    r.setex(key, 60, json.dumps(data))
    return data


@router.get("/{project_id}", response_model=schemas.ProjectOut)
def get_project(project_id: int, db: Session = Depends(get_db)):
    project = db.get(models.Project, project_id)
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    return project


@router.post("", response_model=schemas.ProjectOut, status_code=201)
def create_project(
    data: schemas.ProjectCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    project = models.Project(**data.model_dump(), owner_id=current_user.id)
    db.add(project)
    db.commit()
    db.refresh(project)
    return project

