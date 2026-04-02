from sqlalchemy import Column, Integer, String, DateTime, JSON # <--- Add JSON here
from sqlalchemy.sql import func
from database import Base
from datetime import datetime

class AuditRecord(Base):
    __tablename__ = "audit_records"

    id = Column(Integer, primary_key=True, index=True)
    filename = Column(String)
    insurer_name = Column(String)
    verdict = Column(String)
    analysis = Column(JSON) # <--- Now this will work!
    timestamp = Column(DateTime, default=func.now())