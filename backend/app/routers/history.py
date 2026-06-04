"""
Router para histórico de auditorias.
GET  /history/          — lista auditorias do usuário logado
POST /history/          — salva uma auditoria (chamado internamente)
GET  /history/{id}/pdf  — gera PDF de uma auditoria salva
DELETE /history/{id}    — remove uma auditoria
"""

from fastapi import APIRouter, Depends, HTTPException
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
    request: SaveAuditRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Salva o resultado de uma auditoria no histórico."""
    record = AuditHistory(
        user_id=current_user.id,
        audit_type=request.audit_type,
        title=request.title,
        total_findings=request.total_findings,
        critical=request.critical,
        high=request.high,
        medium=request.medium,
        low=request.low,
        score=request.score,
        result_data=request.result_data,
    )
    db.add(record)
    db.commit()
    db.refresh(record)
    return {"id": str(record.id), "message": "Auditoria salva com sucesso"}


@router.get("/{audit_id}/pdf")
async def download_pdf(
    audit_id: str,
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

    db.delete(record)
    db.commit()
    return {"message": "Auditoria removida"}
