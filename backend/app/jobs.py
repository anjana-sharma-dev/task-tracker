import time
import json
from .redis_client import r 

def send_assignment_notification(task_id: int, assignee_id: int, title: str):
  time.sleep(5)
  note = json.dumps({"task_id": task_id, "message": f"New task assigned: {title}"})
  r.lpush(f"notifications:user:{assignee_id}", note)
  r.ltrim(f"notifications:user:{assignee_id}", 0, 19)
  print(f"[job] done: task {task_id}", flush=True)

