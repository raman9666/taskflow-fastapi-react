from datetime import date

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import func, or_, select
from sqlalchemy.orm import Session

from ..database import get_db
from ..models import Task, TaskPriority, TaskStatus, User
from ..schemas import TaskCreate, TaskOut, TaskStats, TaskUpdate
from ..security import get_current_user

router = APIRouter(prefix="/api/tasks", tags=["tasks"])


def _get_owned_task(task_id: int, user: User, db: Session) -> Task:
    task = db.get(Task, task_id)
    if task is None or task.owner_id != user.id:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Task not found")
    return task


@router.get("", response_model=list[TaskOut])
def list_tasks(
    status_filter: TaskStatus | None = Query(default=None, alias="status"),
    priority: TaskPriority | None = None,
    search: str | None = Query(default=None, max_length=100),
    skip: int = Query(default=0, ge=0),
    limit: int = Query(default=50, ge=1, le=200),
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> list[Task]:
    query = select(Task).where(Task.owner_id == user.id)
    if status_filter:
        query = query.where(Task.status == status_filter)
    if priority:
        query = query.where(Task.priority == priority)
    if search:
        pattern = f"%{search}%"
        query = query.where(or_(Task.title.ilike(pattern), Task.description.ilike(pattern)))
    query = query.order_by(Task.due_date.is_(None), Task.due_date, Task.id.desc()).offset(skip).limit(limit)
    return list(db.scalars(query))


@router.get("/stats", response_model=TaskStats)
def task_stats(user: User = Depends(get_current_user), db: Session = Depends(get_db)) -> TaskStats:
    counts = dict(
        db.execute(select(Task.status, func.count()).where(Task.owner_id == user.id).group_by(Task.status)).all()
    )
    overdue = db.scalar(
        select(func.count()).where(
            Task.owner_id == user.id, Task.status != TaskStatus.done, Task.due_date < date.today()
        )
    )
    return TaskStats(
        total=sum(counts.values()),
        todo=counts.get(TaskStatus.todo, 0),
        in_progress=counts.get(TaskStatus.in_progress, 0),
        done=counts.get(TaskStatus.done, 0),
        overdue=overdue or 0,
    )


@router.post("", response_model=TaskOut, status_code=status.HTTP_201_CREATED)
def create_task(payload: TaskCreate, user: User = Depends(get_current_user), db: Session = Depends(get_db)) -> Task:
    task = Task(**payload.model_dump(), owner_id=user.id)
    db.add(task)
    db.commit()
    db.refresh(task)
    return task


@router.get("/{task_id}", response_model=TaskOut)
def get_task(task_id: int, user: User = Depends(get_current_user), db: Session = Depends(get_db)) -> Task:
    return _get_owned_task(task_id, user, db)


@router.patch("/{task_id}", response_model=TaskOut)
def update_task(
    task_id: int, payload: TaskUpdate, user: User = Depends(get_current_user), db: Session = Depends(get_db)
) -> Task:
    task = _get_owned_task(task_id, user, db)
    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(task, field, value)
    db.commit()
    db.refresh(task)
    return task


@router.delete("/{task_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_task(task_id: int, user: User = Depends(get_current_user), db: Session = Depends(get_db)) -> None:
    db.delete(_get_owned_task(task_id, user, db))
    db.commit()
