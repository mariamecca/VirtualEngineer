from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import Optional, List
from models.database import get_db
from models.wbs import WBS, WBSChecklist
from pydantic import BaseModel

router = APIRouter()


class WBSCreate(BaseModel):
    project_id: int
    parent_id: Optional[int] = None
    code: str
    title: str
    description: Optional[str] = ""
    budget: Optional[float] = 0.0
    start_date: Optional[str] = None
    end_date: Optional[str] = None
    order_index: Optional[int] = 0


class WBSUpdate(BaseModel):
    code: Optional[str] = None
    title: Optional[str] = None
    description: Optional[str] = None
    budget: Optional[float] = None
    start_date: Optional[str] = None
    end_date: Optional[str] = None
    progress: Optional[int] = None
    order_index: Optional[int] = None


class ChecklistCreate(BaseModel):
    title: str
    due_date: Optional[str] = None


class ChecklistUpdate(BaseModel):
    title: Optional[str] = None
    completed: Optional[int] = None
    due_date: Optional[str] = None


def wbs_to_dict(w: WBS):
    return {
        "id": w.id,
        "project_id": w.project_id,
        "parent_id": w.parent_id,
        "code": w.code,
        "title": w.title,
        "description": w.description,
        "budget": w.budget,
        "start_date": w.start_date,
        "end_date": w.end_date,
        "progress": w.progress,
        "order_index": w.order_index,
    }


def checklist_to_dict(c: WBSChecklist):
    return {
        "id": c.id,
        "wbs_id": c.wbs_id,
        "title": c.title,
        "completed": c.completed,
        "due_date": c.due_date,
    }


@router.get("/{project_id}")
def get_wbs(project_id: int, db: Session = Depends(get_db)):
    items = db.query(WBS).filter(WBS.project_id == project_id).order_by(WBS.order_index, WBS.code).all()
    result = []
    for w in items:
        d = wbs_to_dict(w)
        checklist = db.query(WBSChecklist).filter(WBSChecklist.wbs_id == w.id).order_by(WBSChecklist.created_at).all()
        d["checklist"] = [checklist_to_dict(c) for c in checklist]
        result.append(d)
    return result


@router.post("")
def create_wbs(data: WBSCreate, db: Session = Depends(get_db)):
    w = WBS(
        project_id=data.project_id,
        parent_id=data.parent_id,
        code=data.code,
        title=data.title,
        description=data.description or "",
        budget=data.budget or 0.0,
        start_date=data.start_date,
        end_date=data.end_date,
        order_index=data.order_index or 0,
    )
    db.add(w)
    db.commit()
    db.refresh(w)
    d = wbs_to_dict(w)
    d["checklist"] = []
    return d


@router.put("/{wbs_id}")
def update_wbs(wbs_id: int, data: WBSUpdate, db: Session = Depends(get_db)):
    w = db.query(WBS).filter(WBS.id == wbs_id).first()
    if not w:
        raise HTTPException(status_code=404, detail="WBS non trovata")
    for field, value in data.dict(exclude_none=True).items():
        setattr(w, field, value)
    db.commit()
    db.refresh(w)
    d = wbs_to_dict(w)
    checklist = db.query(WBSChecklist).filter(WBSChecklist.wbs_id == w.id).order_by(WBSChecklist.created_at).all()
    d["checklist"] = [checklist_to_dict(c) for c in checklist]
    return d


@router.delete("/{wbs_id}")
def delete_wbs(wbs_id: int, db: Session = Depends(get_db)):
    w = db.query(WBS).filter(WBS.id == wbs_id).first()
    if not w:
        raise HTTPException(status_code=404, detail="WBS non trovata")
    db.query(WBSChecklist).filter(WBSChecklist.wbs_id == wbs_id).delete()
    # delete children
    children = db.query(WBS).filter(WBS.parent_id == wbs_id).all()
    for child in children:
        db.query(WBSChecklist).filter(WBSChecklist.wbs_id == child.id).delete()
        db.delete(child)
    db.delete(w)
    db.commit()
    return {"ok": True}


@router.post("/{wbs_id}/checklist")
def add_checklist(wbs_id: int, data: ChecklistCreate, db: Session = Depends(get_db)):
    w = db.query(WBS).filter(WBS.id == wbs_id).first()
    if not w:
        raise HTTPException(status_code=404, detail="WBS non trovata")
    c = WBSChecklist(wbs_id=wbs_id, title=data.title, due_date=data.due_date)
    db.add(c)
    db.commit()
    db.refresh(c)
    # auto-update progress
    _update_wbs_progress(wbs_id, db)
    return checklist_to_dict(c)


@router.put("/checklist/{checklist_id}")
def update_checklist(checklist_id: int, data: ChecklistUpdate, db: Session = Depends(get_db)):
    c = db.query(WBSChecklist).filter(WBSChecklist.id == checklist_id).first()
    if not c:
        raise HTTPException(status_code=404, detail="Voce non trovata")
    for field, value in data.dict(exclude_none=True).items():
        setattr(c, field, value)
    db.commit()
    db.refresh(c)
    _update_wbs_progress(c.wbs_id, db)
    return checklist_to_dict(c)


@router.delete("/checklist/{checklist_id}")
def delete_checklist(checklist_id: int, db: Session = Depends(get_db)):
    c = db.query(WBSChecklist).filter(WBSChecklist.id == checklist_id).first()
    if not c:
        raise HTTPException(status_code=404, detail="Voce non trovata")
    wbs_id = c.wbs_id
    db.delete(c)
    db.commit()
    _update_wbs_progress(wbs_id, db)
    return {"ok": True}


def _update_wbs_progress(wbs_id: int, db: Session):
    items = db.query(WBSChecklist).filter(WBSChecklist.wbs_id == wbs_id).all()
    if not items:
        return
    done = sum(1 for i in items if i.completed)
    progress = round((done / len(items)) * 100)
    w = db.query(WBS).filter(WBS.id == wbs_id).first()
    if w:
        w.progress = progress
        db.commit()
