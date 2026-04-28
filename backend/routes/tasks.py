from fastapi import APIRouter, Depends, Query, HTTPException
from sqlalchemy.orm import Session
from models.database import get_db
from models.task import Task
from pydantic import BaseModel
from typing import Optional

router = APIRouter()

class TaskCreate(BaseModel):
    project_id: int
    title: str
    description: Optional[str] = None
    category: Optional[str] = None
    priority: Optional[str] = "media"
    date: str

class TaskUpdate(BaseModel):
    completed: Optional[bool] = None
    title: Optional[str] = None
    description: Optional[str] = None

@router.get("/calendar/{project_id}")
def get_calendar_stats(project_id: int, db: Session = Depends(get_db)):
    tasks = db.query(Task).filter(Task.project_id == project_id).all()
    from collections import defaultdict
    stats = defaultdict(lambda: {"total": 0, "completed": 0})
    for task in tasks:
        stats[task.date]["total"] += 1
        if task.completed:
            stats[task.date]["completed"] += 1
    return [{"date": d, "total": v["total"], "completed": v["completed"]} for d, v in sorted(stats.items())]

@router.get("/daily/{project_id}")
def get_daily_tasks(project_id: int, date: str = Query(...), db: Session = Depends(get_db)):
    return db.query(Task).filter(Task.project_id == project_id, Task.date == date).all()

@router.post("/")
def add_task(data: TaskCreate, db: Session = Depends(get_db)):
    task = Task(**data.dict())
    db.add(task)
    db.commit()
    db.refresh(task)
    return task

@router.delete("/{task_id}")
def delete_task(task_id: int, db: Session = Depends(get_db)):
    task = db.query(Task).filter(Task.id == task_id).first()
    if not task:
        raise HTTPException(status_code=404, detail="Task non trovato")
    db.delete(task)
    db.commit()
    return {"ok": True}

@router.put("/{task_id}")
def update_task(task_id: int, data: TaskUpdate, db: Session = Depends(get_db)):
    task = db.query(Task).filter(Task.id == task_id).first()
    if not task:
        raise HTTPException(status_code=404, detail="Task non trovato")
    for k, v in data.dict(exclude_none=True).items():
        setattr(task, k, v)
    db.commit()
    db.refresh(task)
    return task
