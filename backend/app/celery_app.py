import os 
from celery import Celery

BROKER_URL = os.getenv("CELERY_BROKER_URL", "redis://localhost:6379/1")
RESULT_URL = os.getenv("CELERY_RESULT_URL", "redis://localhost:6379/2")

celery = Celery(
  "tracker", 
  broker=BROKER_URL, 
  backend=RESULT_URL, 
  include=["app.celery_tasks"],
)

celery.conf.update(
  task_tracker_stated=True,
  result_expires=3600,
)

celery.conf.beat_schedule = {
  "overdue-reminders":{
    "task": "app.celery_tasks.send_overdue_reminders",
    "schedule": 60.0,
  }
}