from datetime import date, datetime

from pydantic import BaseModel, ConfigDict, EmailStr, Field

from .models import TaskPriority, TaskStatus


class UserCreate(BaseModel):
    email: EmailStr
    full_name: str = Field(min_length=1, max_length=120)
    password: str = Field(min_length=8, max_length=128)


class UserOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    email: EmailStr
    full_name: str


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"


class TaskBase(BaseModel):
    title: str = Field(min_length=1, max_length=200)
    description: str | None = None
    status: TaskStatus = TaskStatus.todo
    priority: TaskPriority = TaskPriority.medium
    due_date: date | None = None


class TaskCreate(TaskBase):
    pass


class TaskUpdate(BaseModel):
    title: str | None = Field(default=None, min_length=1, max_length=200)
    description: str | None = None
    status: TaskStatus | None = None
    priority: TaskPriority | None = None
    due_date: date | None = None


class TaskOut(TaskBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    created_at: datetime
    updated_at: datetime


class TaskStats(BaseModel):
    total: int
    todo: int
    in_progress: int
    done: int
    overdue: int
