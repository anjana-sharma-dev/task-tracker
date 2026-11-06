import jwt
from fastapi import Depends, HTTPException
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy.orm import Session

from . import models
from .database import get_db
from .security import ALGORITHM, SECRET_KEY
from .redis_client import r

bearer = HTTPBearer()

def get_current_user(creds: HTTPAuthorizationCredentials = Depends(bearer),
    db: Session = Depends(get_db),
) -> models.User:
  try:
    payload = jwt.decode(creds.credentials, SECRET_KEY, algorithms=[ALGORITHM])
    user_id = int(payload["sub"])
    jti = payload.get("jti")
    if jti and r.exists(f"blacklist:{jti}"):
        raise HTTPException(status_code=401, detail="Token revoked")
  except (jwt.PyJWKError, KeyError, ValueError):
    raise HTTPException(status_code=401, detail="Invalid or expired token")

  user = db.get(models.User, user_id)
  if not user or not user.is_active:
        raise HTTPException(status_code=401, detail="User not found")
  return user
     