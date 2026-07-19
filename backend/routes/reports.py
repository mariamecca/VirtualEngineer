from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from pydantic import BaseModel, Field, field_validator
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

@router.get("/all/{project_id}")
def get_all_reports(project_id: int, db: Session = Depends(get_db)):
    reports = db.query(Report).filter(Report.project_id == project_id).order_by(Report.date.desc()).all()
    # Load all tasks in a single query and group by date (avoids N+1)
    all_tasks = db.query(Task).filter(Task.project_id == project_id).all()
    tasks_by_date: dict = {}
    for t in all_tasks:
        tasks_by_date.setdefault(t.date, []).append(t)
    result = []
    for r in reports:
        day_tasks = tasks_by_date.get(r.date, [])
        result.append({
            "id": r.id, "project_id": r.project_id, "date": r.date,
            "summary": r.summary, "next_day_preview": r.next_day_preview,
            "created_at": str(r.created_at),
            "tasks_total": len(day_tasks),
            "tasks_completed": sum(1 for t in day_tasks if t.completed),
        })
    return result

@router.delete("/{report_id}")
def delete_report(report_id: int, db: Session = Depends(get_db)):
    r = db.query(Report).filter(Report.id == report_id).first()
    if r:
        db.delete(r)
        db.commit()
    return {"ok": True}


class SnapshotRequest(BaseModel):
    project_id: int
    date: str
    progress: int = Field(..., ge=0, le=100)

    @field_validator("date")
    @classmethod
    def check_date(cls, v: str) -> str:
        from datetime import datetime
        try:
            datetime.strptime(v, "%Y-%m-%d")
        except ValueError:
            raise ValueError("La data deve essere nel formato YYYY-MM-DD")
        return v


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
