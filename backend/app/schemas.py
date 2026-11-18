from datetime import datetime, date
from pydantic import BaseModel, ConfigDict, Field
from typing import Literal

class UserCreate(BaseModel):
    name: str = Field(min_length=1)
    email: str
    password: str

class UserOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    email: str
    created_at: datetime

class ProjectCreate(BaseModel):
    name: str
    description: str | None = None


class ProjectOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    description: str | None
    owner_id: int
    created_at: datetime


class LabelOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    color: str


class TaskCreate(BaseModel):
    title: str
    description: str | None = None
    status: Literal["todo", "in_progress", "done"] = "todo"
    priority: Literal["low", "medium", "high"] = "medium"
    due_date: date | None = None
    assignee_id: int | None = None

class TaskUpdate(BaseModel):
    title: str | None = None
    description: str | None = None
    status: Literal["todo", "in_progress", "done"] | None = None
    priority: Literal["low", "medium", "high"] | None = None
    due_date: date | None = None
    assignee_id: int | None = None


class TaskOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    title: str
    description: str | None
    status: str
    priority: str
    due_date: date | None
    project_id: int
    assignee_id: int | None
    created_by_id: int | None
    created_at: datetime
    labels: list[LabelOut] = []

class CommentCreate(BaseModel):
    content: str

class userBrief(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str

class CommentOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    content: str
    task_id: int
    user_id: int
    created_at: datetime 
    user: userBrief

class LoginRequest(BaseModel):
    email: str
    password: str

class TokenOut(BaseModel):
    access_token: str
    token_type: str = "bearer"

