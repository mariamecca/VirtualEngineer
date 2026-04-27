from sqlalchemy import Column, Integer, String, ForeignKey, DateTime
from sqlalchemy.sql import func
from models.database import Base

class ProgressHistory(Base):
    __tablename__ = "progress_history"

    id = Column(Integer, primary_key=True, index=True)
    project_id = Column(Integer, ForeignKey("projects.id"), nullable=False)
    date = Column(String, nullable=False)     # YYYY-MM-DD
    progress = Column(Integer, nullable=False) # 0-100
    created_at = Column(DateTime, server_default=func.now())
