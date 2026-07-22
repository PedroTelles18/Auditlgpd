import uuid
from sqlalchemy import Column, String, DateTime, BigInteger
from sqlalchemy.dialects.postgresql import UUID, JSONB, INET
from sqlalchemy.sql import func

from app.database import Base


class AuditLog(Base):
    __tablename__ = "audit_log"

    # OBS: essa tabela já existe no Supabase (criamos via SQL Editor).
    # Esse model só serve para o SQLAlchemy conseguir inserir registros nela.
    # NÃO rode create_all para essa tabela específica — ela já existe e tem
    # a trigger de append-only que o create_all não recria.

    id = Column(BigInteger, primary_key=True)  # BIGSERIAL -> gerado automaticamente pelo Postgres
    event_type = Column(String(100), nullable=False)
    entity_type = Column(String(100), nullable=True)
    entity_id = Column(UUID(as_uuid=True), nullable=True)
    actor_id = Column(UUID(as_uuid=True), nullable=False)
    actor_role = Column(String(50), nullable=True)
    payload_before = Column(JSONB, nullable=True)
    payload_after = Column(JSONB, nullable=True)
    ip_origin = Column(INET, nullable=True)
    user_agent = Column(String, nullable=True)
    audit_metadata = Column("metadata", JSONB, nullable=True)  # "metadata" é reservado no SQLAlchemy, por isso o nome Python é diferente
    created_at = Column(DateTime(timezone=True), server_default=func.now())
