from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from models.database import get_db
from models.report import Report
from models.task import Task

router = APIRouter()

@router.get("/progress/{project_id}")
def get_progress(project_id: int, db: Session = Depends(get_db)):
    tasks = db.query(Task).filter(Task.project_id == project_id).all()
    total = len(tasks)
    completed = sum(1 for t in tasks if t.completed)
    return {
        "total_tasks": total,
        "completed_tasks": completed,
        "progress_percent": round((completed / total * 100) if total else 0, 1)
    }

@router.get("/daily/{project_id}")
def get_daily_report(project_id: int, date: str = Query(...), db: Session = Depends(get_db)):
    return db.query(Report).filter(Report.project_id == project_id, Report.date == date).first()
