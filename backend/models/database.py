from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
import os

DB_PATH = os.path.join(os.path.dirname(os.path.dirname(__file__)), "data", "virtualengineer.db")
os.makedirs(os.path.dirname(DB_PATH), exist_ok=True)

engine = create_engine(f"sqlite:///{DB_PATH}", connect_args={"check_same_thread": False})
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def init_db():
    from models.project import Project
    from models.task import Task
    from models.report import Report
    from models.file import File
    from models.optimization import Optimization
    from models.chat_message import ChatMessage
    from models.wbs import WBS, WBSChecklist
    from models.progress_history import ProgressHistory
    Base.metadata.create_all(bind=engine)
