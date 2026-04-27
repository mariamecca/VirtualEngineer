from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from pydantic import BaseModel
from models.database import get_db
from models.report import Report
from models.task import Task
from models.progress_history import ProgressHistory

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


class SnapshotRequest(BaseModel):
    project_id: int
    date: str
    progress: int


@router.post("/progress-snapshot")
def save_progress_snapshot(req: SnapshotRequest, db: Session = Depends(get_db)):
    # Upsert: one snapshot per project per day
    existing = db.query(ProgressHistory).filter(
        ProgressHistory.project_id == req.project_id,
        ProgressHistory.date == req.date
    ).first()
    if existing:
        existing.progress = req.progress
    else:
        db.add(ProgressHistory(project_id=req.project_id, date=req.date, progress=req.progress))
    db.commit()
    return {"ok": True}


@router.get("/progress-history/{project_id}")
def get_progress_history(project_id: int, db: Session = Depends(get_db)):
    rows = db.query(ProgressHistory).filter(
        ProgressHistory.project_id == project_id
    ).order_by(ProgressHistory.date).all()
    return [{"date": r.date, "progress": r.progress} for r in rows]
