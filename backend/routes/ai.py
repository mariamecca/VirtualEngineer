from fastapi import APIRouter, Depends, UploadFile, File as UploadFileType, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional
from models.database import get_db
from models.project import Project
from models.task import Task
from models.report import Report
from models.optimization import Optimization
from models.chat_message import ChatMessage
from services.ai_service import AIService
from pydantic import BaseModel
import os
import json

router = APIRouter()

class DailyPlanRequest(BaseModel):
    project_id: int
    date: str

class ReportRequest(BaseModel):
    project_id: int
    date: str

class OptimizationRequest(BaseModel):
    project_id: int

class ChatRequest(BaseModel):
    project_id: int
    message: str

def get_ai():
    key = os.getenv("GROQ_API_KEY", "")
    if not key:
        raise HTTPException(status_code=400, detail="API key non configurata. Vai in Impostazioni.")
    return AIService(key)

@router.post("/daily-plan")
async def generate_daily_plan(req: DailyPlanRequest, db: Session = Depends(get_db)):
    project = db.query(Project).filter(Project.id == req.project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Progetto non trovato")

    existing_tasks = db.query(Task).filter(Task.project_id == req.project_id, Task.date == req.date).all()
    if existing_tasks:
        for t in existing_tasks:
            db.delete(t)
        db.commit()

    ai = get_ai()
    plan = await ai.generate_daily_plan(project, req.date)

    saved_tasks = []
    for task_data in plan.get("tasks", []):
        task = Task(
            project_id=req.project_id,
            date=req.date,
            title=task_data["title"],
            description=task_data.get("description", ""),
            category=task_data.get("category", ""),
            priority=task_data.get("priority", "media")
        )
        db.add(task)
        saved_tasks.append(task)

    db.commit()
    for t in saved_tasks:
        db.refresh(t)

    return {"tasks": saved_tasks, "reasoning": plan.get("reasoning", "")}

@router.post("/daily-report")
async def generate_daily_report(req: ReportRequest, db: Session = Depends(get_db)):
    project = db.query(Project).filter(Project.id == req.project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Progetto non trovato")
    tasks = db.query(Task).filter(Task.project_id == req.project_id, Task.date == req.date).all()

    ai = get_ai()
    report_data = await ai.generate_daily_report(project, tasks, req.date)

    existing = db.query(Report).filter(Report.project_id == req.project_id, Report.date == req.date).first()
    if existing:
        existing.summary = report_data["summary"]
        existing.next_day_preview = report_data.get("next_day_preview", "")
    else:
        report = Report(
            project_id=req.project_id,
            date=req.date,
            summary=report_data["summary"],
            next_day_preview=report_data.get("next_day_preview", "")
        )
        db.add(report)
    db.commit()

    return report_data

@router.post("/analyze-documents")
async def analyze_documents(files: List[UploadFileType] = UploadFileType(...)):
    ai = get_ai()
    contents = []
    for f in files:
        content = await f.read()
        contents.append({"name": f.filename, "content": content, "type": f.content_type})

    result = await ai.analyze_documents(contents)
    return result

@router.post("/optimizations")
async def get_optimizations(req: OptimizationRequest, db: Session = Depends(get_db)):
    project = db.query(Project).filter(Project.id == req.project_id).first()
    tasks = db.query(Task).filter(Task.project_id == req.project_id).all()

    ai = get_ai()
    result = await ai.get_optimizations(project, tasks)

    existing = db.query(Optimization).filter(Optimization.project_id == req.project_id).first()
    if existing:
        existing.suggestions = json.dumps(result.get("suggestions", []))
    else:
        opt = Optimization(project_id=req.project_id, suggestions=json.dumps(result.get("suggestions", [])))
        db.add(opt)
    db.commit()

    return result

@router.get("/optimizations/{project_id}")
def load_optimizations(project_id: int, db: Session = Depends(get_db)):
    opt = db.query(Optimization).filter(Optimization.project_id == project_id).first()
    if not opt:
        return None
    return {"suggestions": json.loads(opt.suggestions)}

@router.get("/chat/{project_id}")
def get_chat_history(project_id: int, db: Session = Depends(get_db)):
    messages = db.query(ChatMessage).filter(
        ChatMessage.project_id == project_id
    ).order_by(ChatMessage.created_at).all()
    return messages

@router.post("/chat")
async def chat(req: ChatRequest, db: Session = Depends(get_db)):
    project = db.query(Project).filter(Project.id == req.project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Progetto non trovato")

    # Save user message
    user_msg = ChatMessage(project_id=req.project_id, role="user", content=req.message)
    db.add(user_msg)
    db.commit()

    # Get recent history for context
    history = db.query(ChatMessage).filter(
        ChatMessage.project_id == req.project_id
    ).order_by(ChatMessage.created_at.desc()).limit(10).all()
    history = list(reversed(history))

    ai = get_ai()
    result = await ai.chat(project, req.message, history[:-1])

    # Save assistant message
    assistant_msg = ChatMessage(project_id=req.project_id, role="assistant", content=result["response"])
    db.add(assistant_msg)
    db.commit()
    db.refresh(user_msg)
    db.refresh(assistant_msg)

    return {"response": result["response"], "message_id": assistant_msg.id}
