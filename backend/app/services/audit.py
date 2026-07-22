from typing import Optional
from sqlalchemy.orm import Session
from fastapi import Request

from app.models.audit_log import AuditLog


def log_event(
    db: Session,
    event_type: str,
    actor_id,
    actor_role: Optional[str] = None,
    entity_type: Optional[str] = None,
    entity_id=None,
    payload_before: Optional[dict] = None,
    payload_after: Optional[dict] = None,
    metadata: Optional[dict] = None,
    request: Optional[Request] = None,
):
    """
    Registra um evento no audit_log.

    Uso típico dentro de uma rota:

        log_event(
            db=db,
            event_type="user.login",
            actor_id=user.id,
            actor_role=user.role,
            entity_type="user",
            entity_id=user.id,
            request=request,
        )

    IMPORTANTE: essa função dá commit sozinha, então pode ser chamada
    a qualquer momento dentro da rota, mesmo depois de outros commits.
    """
    ip = None
    user_agent = None
    if request is not None:
        # request.client pode ser None em alguns contextos de teste
        ip = request.client.host if request.client else None
        user_agent = request.headers.get("user-agent")

    entry = AuditLog(
        event_type=event_type,
        entity_type=entity_type,
        entity_id=entity_id,
        actor_id=actor_id,
        actor_role=actor_role,
        payload_before=payload_before,
        payload_after=payload_after,
        ip_origin=ip,
        user_agent=user_agent,
        audit_metadata=metadata,
    )
    db.add(entry)
    db.commit()
    # Não damos refresh nem retornamos o objeto -- quem chama não precisa
    # do log de volta, só precisa saber que foi registrado.
