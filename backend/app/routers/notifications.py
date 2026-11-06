import json

from fastapi import APIRouter, Depends

from .. import models
from ..dependency import get_current_user
from ..redis_client import r

router = APIRouter(tags=["Notifications"])

@router.get("/notifications")
def list_notification(current_user: models.User = Depends(get_current_user)):
  items = r.lrange(f"notifications:user:{current_user.id}", 0, 19)
  return [json.loads(i) for i in items]

@router.delete("/notifications", status_code=204)
def clear_notifications(current_user: models.User = Depends(get_current_user)):
    r.delete(f"notifications:user:{current_user.id}")