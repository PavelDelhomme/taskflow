from pydantic import BaseModel, EmailStr
from typing import Optional

class UserRegister(BaseModel):
    username: str
    email: str
    password: str
    full_name: str

class UserLogin(BaseModel):
    email: str
    password: str

class Task(BaseModel):
    title: str
    description: Optional[str] = None
    priority: str = 'medium'
    trello_id: Optional[str] = None  # ✅ NOUVEAU : ID ticket Trello

class TaskUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    status: Optional[str] = None
    priority: Optional[str] = None
    blocked_reason: Optional[str] = None
    trello_id: Optional[str] = None  # ✅ NOUVEAU : ID ticket Trello
