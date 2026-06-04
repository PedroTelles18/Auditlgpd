# backend/app/models/user.py
# Substitui o arquivo original completo

from sqlalchemy import Column, String, Boolean, DateTime, Enum as SAEnum, JSON
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.sql import func
import uuid
import enum

from app.database import Base


class UserRole(str, enum.Enum):
    admin   = "admin"
    auditor = "auditor"
    viewer  = "viewer"


# Módulos disponíveis no sistema
AVAILABLE_MODULES = [
    "dashboard",
    "analyze",
    "db_audit",
    "db_monitor",
    "reports",
    "alerts",
]

# Planos predefinidos: nome → lista de módulos liberados
PLANS = {
    "starter":    ["dashboard", "analyze"],
    "pro":        ["dashboard", "analyze", "db_audit", "reports"],
    "enterprise": ["dashboard", "analyze", "db_audit", "db_monitor", "reports", "alerts"],
    "custom":     [],   # módulos definidos manualmente via allowed_modules
}


class User(Base):
    __tablename__ = "users"

    id              = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name            = Column(String(100), nullable=False)
    email           = Column(String(255), unique=True, nullable=False, index=True)
    hashed_password = Column(String(255), nullable=False)
    role            = Column(SAEnum(UserRole), default=UserRole.auditor, nullable=False)
    is_active       = Column(Boolean, default=True, nullable=False)

    # Plano do cliente (starter | pro | enterprise | custom)
    plan            = Column(String(50), default="starter", nullable=False)

    # Lista de módulos liberados para este usuário.
    # Se plan != "custom", este campo é populado automaticamente pelo plano.
    # Se plan == "custom", contém seleção manual feita pelo admin.
    allowed_modules = Column(JSON, default=list, nullable=False)

    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    def __repr__(self):
        return f"<User {self.email} ({self.role}) plan={self.plan}>"

    def has_module(self, module: str) -> bool:
        """Verifica se este usuário tem acesso a um módulo específico."""
        if self.role == UserRole.admin:
            return True  # admin sempre tem acesso a tudo
        return module in (self.allowed_modules or [])
