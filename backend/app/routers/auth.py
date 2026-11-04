
from fastapi import HTTPException, APIRouter, Depends
from sqlalchemy import select
from ..import models, schemas
from ..database import get_db
from sqlalchemy.orm import Session
from ..security import verify_password, create_access_token
from ..dependency import get_current_user
from ..redis_client import r 

MAX_ATTEMPTS = 5
WINDOW_SECONDS = 60

router = APIRouter(prefix="/auth", tags=["Auth"])

def fail_key(email: str) -> str:
  return f"login_fail: {email.lower()}"

def check_blocked(email: str):
  attempts = r.get(fail_key(email))
  if attempts and int(attempts) >= MAX_ATTEMPTS:
    wait = r.ttl(fail_key(email))
    raise HTTPException(
      status_code=429,
      detail=f"Too many attempts. Try again in {wait} seconds."
    )

def record_failure(email: str):
  key = fail_key(email)
  r.incr(key)
  if r.ttl(key) == -1:
      r.expire(key, WINDOW_SECONDS)


@router.post("/login", response_model=schemas.TokenOut)
def login(data: schemas.LoginRequest, db: Session= Depends(get_db)):
  check_blocked(data.email)

  user = db.scalar(select(models.User).where(models.User.email == data.email))
  if not user or not verify_password(data.password, user.hashed_password):
    record_failure(data.email)
    raise HTTPException(status_code=401, detail="Wrong email or password")
  
  r.delete(fail_key(data.email))
  return {"access_token": create_access_token(user.id)}

@router.get("/me", response_model=schemas.UserOut)
def me(current_user: models.User = Depends(get_current_user)):
  return current_user