"""
Router para histórico de auditorias.
GET  /history/          — lista auditorias do usuário logado
POST /history/          — salva uma auditoria (chamado internamente)
GET  /history/{id}/pdf  — gera PDF de uma auditoria salva
DELETE /history/{id}    — remove uma auditoria
"""

from fastapi import APIRouter, Depends, HTTPException, Request
from fastapi.responses import Response
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Any, Dict, Optional
import uuid

from app.database import get_db
from app.core.security import get_current_user
from app.models.audit_history import AuditHistory
from app.models.user import User
from app.reports.pdf_generator import generate_code_analysis_pdf, generate_db_audit_pdf
from app.services.audit import log_event  # ← ADD

router = APIRouter(prefix="/history", tags=["History"])


class SaveAuditRequest(BaseModel):
    audit_type: str  # "code" ou "db"
    title: str
    total_findings: int = 0
    critical: int = 0
    high: int = 0
    medium: int = 0
    low: int = 0
    score: float = 0.0
    result_data: Optional[Dict[str, Any]] = None


@router.get("/")
async def list_history(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Lista todas as auditorias do usuário logado, mais recentes primeiro."""
    records = (
        db.query(AuditHistory)
        .filter(AuditHistory.user_id == current_user.id)
        .order_by(AuditHistory.created_at.desc())
        .all()
    )
    return [
        {
            "id": str(r.id),
            "audit_type": r.audit_type,
            "title": r.title,
            "total_findings": r.total_findings,
            "critical": r.critical,
            "high": r.high,
            "medium": r.medium,
            "low": r.low,
            "score": r.score,
            "created_at": r.created_at.isoformat() if r.created_at else None,
        }
        for r in records
    ]


@router.post("/")
async def save_audit(
    request: Request,  # ← ADD
    request_body: SaveAuditRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Salva o resultado de uma auditoria no histórico."""
    record = AuditHistory(
        user_id=current_user.id,
        audit_type=request_body.audit_type,
        title=request_body.title,
        total_findings=request_body.total_findings,
        critical=request_body.critical,
        high=request_body.high,
        medium=request_body.medium,
        low=request_body.low,
        score=request_body.score,
        result_data=request_body.result_data,
    )
    db.add(record)
    db.commit()
    db.refresh(record)

    # ← ADD: registra criação (essa rota é usada para salvar auditorias tipo "db", por ex.)
    log_event(
        db=db,
        event_type="audit.created",
        actor_id=current_user.id,
        actor_role=current_user.role,
        entity_type="audit_history",
        entity_id=record.id,
        payload_after={
            "audit_type": record.audit_type,
            "title": record.title,
            "total_findings": record.total_findings,
            "score": record.score,
        },
        request=request,
    )

    return {"id": str(record.id), "message": "Auditoria salva com sucesso"}


@router.get("/{audit_id}/pdf")
async def download_pdf(
    audit_id: str,
    request: Request,  # ← ADD
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Gera e retorna o PDF de uma auditoria salva."""
    try:
        record_id = uuid.UUID(audit_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="ID inválido")

    record = db.query(AuditHistory).filter(
        AuditHistory.id == record_id,
        AuditHistory.user_id == current_user.id,
    ).first()

    if not record:
        raise HTTPException(status_code=404, detail="Auditoria não encontrada")

    if not record.result_data:
        raise HTTPException(status_code=400, detail="Dados da auditoria não disponíveis para gerar PDF")

    try:
        if record.audit_type == "code":
            pdf_bytes = generate_code_analysis_pdf(
                analysis_data=record.result_data,
                auditor_name=current_user.name,
            )
            filename = "privyon-code-audit.pdf"
        else:
            pdf_bytes = generate_db_audit_pdf(
                audit_data=record.result_data,
                auditor_name=current_user.name,
            )
            filename = "privyon-db-audit.pdf"

        # ← ADD: registra exportação de relatório (acesso/saída de dado é sempre relevante para LGPD)
        log_event(
            db=db,
            event_type="audit.exported",
            actor_id=current_user.id,
            actor_role=current_user.role,
            entity_type="audit_history",
            entity_id=record.id,
            metadata={"format": "pdf", "filename": filename},
            request=request,
        )

        return Response(
            content=pdf_bytes,
            media_type="application/pdf",
            headers={"Content-Disposition": f"attachment; filename={filename}"},
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erro ao gerar PDF: {str(e)}")


@router.delete("/{audit_id}")
async def delete_audit(
    audit_id: str,
    request: Request,  # ← ADD
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Remove uma auditoria do histórico."""
    try:
        record_id = uuid.UUID(audit_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="ID inválido")

    record = db.query(AuditHistory).filter(
        AuditHistory.id == record_id,
        AuditHistory.user_id == current_user.id,
    ).first()

    if not record:
        raise HTTPException(status_code=404, detail="Auditoria não encontrada")

    # ← ADD: captura os dados antes de apagar, para o log guardar o que foi perdido
    deleted_snapshot = {
        "audit_type": record.audit_type,
        "title": record.title,
        "total_findings": record.total_findings,
        "score": record.score,
    }

    db.delete(record)
    db.commit()

    # ← ADD: registra a exclusão (é IMPORTANTE que o log sobreviva mesmo depois do dado original sumir)
    log_event(
        db=db,
        event_type="audit.deleted",
        actor_id=current_user.id,
        actor_role=current_user.role,
        entity_type="audit_history",
        entity_id=record_id,
        payload_before=deleted_snapshot,
        request=request,
    )

    return {"message": "Auditoria removida"}
