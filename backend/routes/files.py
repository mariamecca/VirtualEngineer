from fastapi import APIRouter, Depends, UploadFile, File as UploadFileType
from sqlalchemy.orm import Session
from typing import List
import os, shutil
from models.database import get_db
from models.file import File

router = APIRouter()

UPLOAD_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), "data", "uploads")
os.makedirs(UPLOAD_DIR, exist_ok=True)

@router.post("/upload/{project_id}")
async def upload_files(project_id: int, files: List[UploadFileType] = UploadFileType(...), db: Session = Depends(get_db)):
    saved = []
    for f in files:
        project_dir = os.path.join(UPLOAD_DIR, str(project_id))
        os.makedirs(project_dir, exist_ok=True)
        dest = os.path.join(project_dir, f.filename)
        with open(dest, "wb") as out:
            shutil.copyfileobj(f.file, out)
        size = os.path.getsize(dest)
        db_file = File(project_id=project_id, name=f.filename, path=dest, type=f.content_type, size=size)
        db.add(db_file)
        saved.append(db_file)
    db.commit()
    for f in saved:
        db.refresh(f)
    return saved

@router.get("/{project_id}")
def get_files(project_id: int, db: Session = Depends(get_db)):
    return db.query(File).filter(File.project_id == project_id).all()
