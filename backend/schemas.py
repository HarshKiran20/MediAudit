from pydantic import BaseModel
from typing import List, Optional, Dict, Any

class AuditResponse(BaseModel):
    filename: str
    extracted_text: str

class CrossCheckRequest(BaseModel):
    bill_text: str
    policy_name: str
    filename: str
    insurer_name: str

class AuditHistoryItem(BaseModel):
    id: int
    timestamp: Any
    filename: str
    insurer: str
    verdict: str
    risk_score: float

    class Config:
        from_attributes = True