
from fastapi import HTTPException, APIRouter, Depends
from sqlalchemy import select
from ..import models, schemas
from ..database import get_db
from sqlalchemy.orm import Session
from ..security import verify_password, create_access_token
from ..dependency import get_current_user

router = APIRouter(prefix="/auth", tags=["Auth"])


@router.post("/login", response_model=schemas.TokenOut)
def login(data: schemas.LoginRequest, db: Session= Depends(get_db)):
  user = db.scalar(select(models.User).where(models.User.email == data.email))
  if not user or not verify_password(data.password, user.hashed_password):
    raise HTTPException(status_code=401, detail="Wrong email or password")
  return {"access_token": create_access_token(user.id)}



@router.get("/me", response_model=schemas.UserOut)
def me(current_user: models.User = Depends(get_current_user)):
  return current_user