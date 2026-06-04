# backend/app/schemas/user.py
# Substitui o arquivo original completo

from pydantic import BaseModel, EmailStr
from typing import Optional, List
from uuid import UUID
from datetime import datetime
from app.models.user import UserRole, AVAILABLE_MODULES, PLANS


# ── Request ──────────────────────────────────────────────

class UserCreate(BaseModel):
    name:            str
    email:           EmailStr
    password:        str
    role:            UserRole        = UserRole.auditor
    plan:            str             = "starter"
    allowed_modules: Optional[List[str]] = None  # só obrigatório se plan == "custom"


class UserUpdate(BaseModel):
    name:            Optional[str]        = None
    email:           Optional[EmailStr]   = None
    role:            Optional[UserRole]   = None
    is_active:       Optional[bool]       = None
    plan:            Optional[str]        = None
    allowed_modules: Optional[List[str]]  = None


class UserResetPassword(BaseModel):
    new_password: str


# ── Response ─────────────────────────────────────────────

class UserOut(BaseModel):
    id:              UUID
    name:            str
    email:           EmailStr
    role:            UserRole
    is_active:       bool
    plan:            str
    allowed_modules: List[str]
    created_at:      datetime

    model_config = {"from_attributes": True}


# ── Auth ─────────────────────────────────────────────────

class Token(BaseModel):
    access_token: str
    token_type:   str = "bearer"
    user:         UserOut


class TokenData(BaseModel):
    user_id: Optional[str] = None


# ── Meta (retorna constantes pro front) ──────────────────

class ModulesMeta(BaseModel):
    available_modules: List[str]
    plans:             dict
