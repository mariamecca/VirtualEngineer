from fastapi import APIRouter, Depends, UploadFile, File as UploadFileType, HTTPException
from sqlalchemy.orm import Session
from typing import List
import os, shutil
from models.database import get_db
from models.file import File

router = APIRouter()

UPLOAD_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), "data", "uploads")
os.makedirs(UPLOAD_DIR, exist_ok=True)

ALLOWED_EXTENSIONS = {".pdf", ".doc", ".docx", ".txt", ".jpg", ".jpeg", ".png", ".gif", ".webp", ".xls", ".xlsx", ".csv"}

def safe_filename(filename: str) -> str:
    """Strip directory components and reject empty or dangerous names."""
    name = os.path.basename(filename or "").strip()
    if not name or name.startswith("."):
        raise HTTPException(status_code=400, detail="Nome file non valido")
    ext = os.path.splitext(name)[1].lower()
    if ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(status_code=400, detail=f"Tipo di file non consentito: {ext}")
    return name

def _unique_path(project_dir: str, filename: str) -> str:
    base, ext = os.path.splitext(filename)
    dest = os.path.join(project_dir, filename)
    counter = 1
    while os.path.exists(dest):
        dest = os.path.join(project_dir, f"{base}_{counter}{ext}")
        counter += 1
    return dest


@router.post("/upload/{project_id}")
async def upload_files(project_id: int, files: List[UploadFileType] = UploadFileType(...), db: Session = Depends(get_db)):
    saved = []
    for f in files:
        filename = safe_filename(f.filename)
        project_dir = os.path.join(UPLOAD_DIR, str(project_id))
        os.makedirs(project_dir, exist_ok=True)
        dest = _unique_path(project_dir, filename)
        with open(dest, "wb") as out:
            shutil.copyfileobj(f.file, out)
        size = os.path.getsize(dest)
        db_file = File(project_id=project_id, name=os.path.basename(dest), path=dest, type=f.content_type, size=size)
        db.add(db_file)
        saved.append(db_file)
    db.commit()
    for f in saved:
        db.refresh(f)
    return saved

@router.get("/{project_id}")
def get_files(project_id: int, db: Session = Depends(get_db)):
    return db.query(File).filter(File.project_id == project_id).all()

@router.delete("/{file_id}")
def delete_file(file_id: int, db: Session = Depends(get_db)):
    f = db.query(File).filter(File.id == file_id).first()
    if not f:
        from fastapi import HTTPException
        raise HTTPException(status_code=404, detail="File non trovato")
    if os.path.exists(f.path):
        os.remove(f.path)
    db.delete(f)
    db.commit()
    return {"ok": True}
