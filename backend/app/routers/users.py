# import hashlib
from ..security import hash_password
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session

from .. import models, schemas
from ..database import get_db
from ..dependency import get_current_user

router = APIRouter(prefix="/users", tags=["Users"])


@router.post("", response_model=schemas.UserOut, status_code=201)
def create_user(data: schemas.UserCreate, db: Session = Depends(get_db)):
    exists = db.scalar(select(models.User).where(models.User.email == data.email))
    print("DEBUG exists:", exists)
    print("DEBUG email:", data.email)
    if exists:
        raise HTTPException(status_code=409, detail="Email already registered")

    user = models.User(
        name=data.name,
        email=data.email,
        # hashed_password=hashlib.sha256(data.password.encode()).hexdigest(),
        hashed_password=hash_password(data.password),
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


@router.get("", response_model=list[schemas.UserOut])
def list_users(db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    return db.scalars(select(models.User)).all()

