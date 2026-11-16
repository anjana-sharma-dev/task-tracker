from datetime import date
import json

from sqlalchemy import select
from .celery_app import celery
from .database import SessionLocal
from . import models
from .redis_client import r


@celery.task(bind=True, autoretry_for=(Exception,), retry_backoff=True, max_retries=3)
def send_overdue_reminders(self):
  db = SessionLocal()
  try:
    # raise Exception("test retry")
    today = date.today()
    stmt = select(models.Task).where(models.Task.due_date < today, 
            models.Task.status != "done", models.Task.assignee_id.is_not(None),)
    tasks = db.scalars(stmt).all()
    sent = 0
    for t in tasks:
      key = f"reminded:task:{t.id}:{today}"
      if r.set(key, 1, nx=True, ex=86400):
        note = json.dumps({
                    "task_id": t.id,
                    "message": f"Overdue: {t.title} (due {t.due_date})",
        })
        r.lpush(f"notifications:user:{t.assignee_id}", note)
        r.ltrim(f"notifications:user:{t.assignee_id}", 0, 19)
        sent += 1
        return {"checked": len(tasks), "sent": sent}
  finally:
        db.close()
        