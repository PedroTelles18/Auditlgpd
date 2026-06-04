from sqlalchemy import Column, String, Integer, Float, DateTime, Text, ForeignKey
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.sql import func
import uuid

from app.database import Base


class AuditHistory(Base):
    __tablename__ = "audit_history"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False, index=True)
    audit_type = Column(String(20), nullable=False)  # "code" ou "db"
    title = Column(String(255), nullable=False)
    total_findings = Column(Integer, default=0)
    critical = Column(Integer, default=0)
    high = Column(Integer, default=0)
    medium = Column(Integer, default=0)
    low = Column(Integer, default=0)
    score = Column(Float, default=0.0)
    result_data = Column(JSONB, nullable=True)  # dados completos para gerar PDF
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    def __repr__(self):
        return f"<AuditHistory {self.audit_type} {self.title}>"
