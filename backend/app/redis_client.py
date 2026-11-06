import os
import redis
from rq import Queue

REDIS_URL = os.getenv("REDIS_URL", "redis://localhost:6379/0")
r = redis.Redis.from_url(REDIS_URL, decode_responses=True)

rq_redis = redis.Redis.from_url(REDIS_URL)
queue = Queue("default", connection=rq_redis)
