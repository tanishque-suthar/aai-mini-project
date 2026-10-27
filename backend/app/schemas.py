from pydantic import BaseModel, Field
from typing import Dict, Any, List, Optional

class ChatRequest(BaseModel):
    query: str
    report_id: Optional[str] = None

class ChatResponse(BaseModel):
    query: str
    response: str

class UserPreferencesRequest(BaseModel):
    budgets: Dict[str, float]
    min_balance_threshold: float = Field(default=15000.0)
    monthly_savings_goal: float = Field(default=20000.0)
