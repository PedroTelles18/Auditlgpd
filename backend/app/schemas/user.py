# backend/app/schemas/user.py
# Substitui o arquivo original completo

from pydantic import BaseModel, EmailStr, field_validator
from typing import Optional, List
from uuid import UUID
from datetime import datetime
from app.models.user import UserRole, AVAILABLE_MODULES, PLANS, ACCENT_COLORS, THEME_MODES


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


# ← ADD: schema para o usuário atualizar sua própria preferência visual
class ThemeUpdate(BaseModel):
    accent: Optional[str] = None
    mode:   Optional[str] = None

    @field_validator("accent")
    @classmethod
    def validate_accent(cls, v):
        if v is not None and v not in ACCENT_COLORS:
            raise ValueError(f"Cor inválida. Opções: {ACCENT_COLORS}")
        return v

    @field_validator("mode")
    @classmethod
    def validate_mode(cls, v):
        if v is not None and v not in THEME_MODES:
            raise ValueError(f"Modo inválido. Opções: {THEME_MODES}")
        return v


# ── Response ─────────────────────────────────────────────

class UserOut(BaseModel):
    id:                 UUID
    name:               str
    email:              EmailStr
    role:               UserRole
    is_active:          bool
    plan:               str
    allowed_modules:    List[str]
    theme_preferences:  dict = {}  # ← ADD
    created_at:         datetime

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


# ← ADD: meta de customização visual, pro front montar o seletor de cores
class ThemeMeta(BaseModel):
    accent_colors: List[str]
    modes:         List[str]
