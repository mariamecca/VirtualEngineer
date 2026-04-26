from sqlalchemy import Column, Integer, String, Float, Text, ForeignKey, DateTime
from sqlalchemy.sql import func
from models.database import Base

class WBS(Base):
    __tablename__ = "wbs"

    id = Column(Integer, primary_key=True, index=True)
    project_id = Column(Integer, ForeignKey("projects.id"), nullable=False)
    parent_id = Column(Integer, ForeignKey("wbs.id"), nullable=True)
    code = Column(String, nullable=False)          # es. "1.2.3"
    title = Column(String, nullable=False)
    description = Column(Text, default="")
    budget = Column(Float, default=0.0)
    start_date = Column(String, nullable=True)     # YYYY-MM-DD
    end_date = Column(String, nullable=True)       # YYYY-MM-DD
    progress = Column(Integer, default=0)          # 0-100
    order_index = Column(Integer, default=0)
    created_at = Column(DateTime, server_default=func.now())


class WBSChecklist(Base):
    __tablename__ = "wbs_checklist"

    id = Column(Integer, primary_key=True, index=True)
    wbs_id = Column(Integer, ForeignKey("wbs.id"), nullable=False)
    title = Column(String, nullable=False)
    completed = Column(Integer, default=0)         # 0/1
    due_date = Column(String, nullable=True)       # YYYY-MM-DD
    created_at = Column(DateTime, server_default=func.now())
