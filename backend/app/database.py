import os 
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, DeclarativeBase


# DATABASE_URL = "postgresql+psycopg2://tracker:tracker@localhost:5433/tracker"
DATABASE_URL = os.getenv("DATABASE_URL",
    "postgresql+psycopg2://tracker:tracker@localhost:5433/tracker",)

engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(bind=engine)

class Base(DeclarativeBase):
  pass


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()