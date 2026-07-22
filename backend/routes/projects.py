from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional
import os
from models.database import get_db
from models.project import Project
from models.task import Task
from models.report import Report
from models.file import File
from models.optimization import Optimization
from models.chat_message import ChatMessage
from models.wbs import WBS, WBSChecklist
from models.progress_history import ProgressHistory
from pydantic import BaseModel

router = APIRouter()

class ProjectCreate(BaseModel):
    name: str
    location: Optional[str] = None
    client: Optional[str] = None
    description: Optional[str] = None
    notes: Optional[str] = None
    budget: Optional[float] = 0
    deadline: Optional[str] = None
    current_phase: Optional[str] = None

class ProjectUpdate(ProjectCreate):
    name: Optional[str] = None
    progress: Optional[float] = None

@router.get("/")
def get_projects(db: Session = Depends(get_db)):
    return db.query(Project).all()

@router.get("/{project_id}")
def get_project(project_id: int, db: Session = Depends(get_db)):
    p = db.query(Project).filter(Project.id == project_id).first()
    if not p:
        raise HTTPException(status_code=404, detail="Project not found")
    return p

@router.post("/")
def create_project(data: ProjectCreate, db: Session = Depends(get_db)):
    project = Project(**data.dict())
    db.add(project)
    db.commit()
    db.refresh(project)
    return project

@router.put("/{project_id}")
def update_project(project_id: int, data: ProjectUpdate, db: Session = Depends(get_db)):
    p = db.query(Project).filter(Project.id == project_id).first()
    if not p:
        raise HTTPException(status_code=404, detail="Not found")
    for k, v in data.dict(exclude_none=True).items():
        setattr(p, k, v)
    db.commit()
    db.refresh(p)
    return p

@router.delete("/{project_id}")
def delete_project(project_id: int, db: Session = Depends(get_db)):
    p = db.query(Project).filter(Project.id == project_id).first()
    if p:
        wbs_ids = [w.id for w in db.query(WBS).filter(WBS.project_id == project_id).all()]
        if wbs_ids:
            db.query(WBSChecklist).filter(WBSChecklist.wbs_id.in_(wbs_ids)).delete(synchronize_session=False)
        db.query(WBS).filter(WBS.project_id == project_id).delete()
        db.query(Task).filter(Task.project_id == project_id).delete()
        db.query(Report).filter(Report.project_id == project_id).delete()
        db.query(ProgressHistory).filter(ProgressHistory.project_id == project_id).delete()
        db.query(Optimization).filter(Optimization.project_id == project_id).delete()
        db.query(ChatMessage).filter(ChatMessage.project_id == project_id).delete()
        for f in db.query(File).filter(File.project_id == project_id).all():
            if os.path.exists(f.path):
                os.remove(f.path)
        db.query(File).filter(File.project_id == project_id).delete()
        db.delete(p)
        db.commit()
    return {"ok": True}
