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
        log_summary.delay([t.id for t in tasks])
        return {"checked": len(tasks), "sent": sent}
  finally:
        db.close()


@celery.task
def fetch_overdue_task_ids():
    db = SessionLocal()
    try:
        today = date.today()
        stmt = select(models.Task.id).where(
            models.Task.due_date < today,
            models.Task.status != "done",
            models.Task.assignee_id.is_not(None),
        )
        return db.scalars(stmt).all()
    finally:
        db.close()


@celery.task
def notify_task(task_id: int):
    db = SessionLocal()
    try:
        task = db.get(models.Task, task_id)
        if not task or not task.assignee_id:
            return None
        key = f"reminded:task:{task.id}:{date.today()}"
        if r.set(key, 1, nx=True, ex=86400):
            note = json.dumps({"task_id": task.id, "message": f"Overdue: {task.title}"})
            r.lpush(f"notifications:user:{task.assignee_id}", note)
            r.ltrim(f"notifications:user:{task.assignee_id}", 0, 19)
            return task.id
        return None
    finally:
        db.close()

@celery.task
def log_summary(task_ids: list):
    print(f"[chain] total notified: {len(task_ids)}", flush=True)
    return len(task_ids)

