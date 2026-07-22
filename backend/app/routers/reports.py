"""
Router para geração de relatórios PDF.
POST /reports/code-analysis  — gera PDF de análise de código
POST /reports/db-audit       — gera PDF de auditoria de banco
"""

from fastapi import APIRouter, Depends, HTTPException, Request
from fastapi.responses import Response
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Any, Dict, Optional

from app.database import get_db  # ← ADD
from app.reports.pdf_generator import generate_code_analysis_pdf, generate_db_audit_pdf
from app.core.security import get_current_user
from app.services.audit import log_event  # ← ADD

router = APIRouter(prefix="/reports", tags=["Reports"])


class CodeReportRequest(BaseModel):
    analysis_data: Dict[str, Any]
    auditor_name: Optional[str] = "Privyon"


class DBReportRequest(BaseModel):
    audit_data: Dict[str, Any]
    auditor_name: Optional[str] = "Privyon"


@router.post("/code-analysis")
async def generate_code_report(
    request_body: CodeReportRequest,
    request: Request,  # ← ADD
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db),  # ← ADD
):
    """Gera relatório PDF de análise de código-fonte."""
    try:
        pdf_bytes = generate_code_analysis_pdf(
            analysis_data=request_body.analysis_data,
            auditor_name=request_body.auditor_name or current_user.name,
        )

        # ← ADD: registra exportação de relatório avulso (não ligado a um audit_history salvo)
        log_event(
            db=db,
            event_type="audit.exported",
            actor_id=current_user.id,
            actor_role=current_user.role,
            entity_type="report",
            metadata={"format": "pdf", "report_type": "code-analysis"},
            request=request,
        )

        return Response(
            content=pdf_bytes,
            media_type="application/pdf",
            headers={"Content-Disposition": "attachment; filename=privyon-code-audit.pdf"},
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erro ao gerar PDF: {str(e)}")


@router.post("/db-audit")
async def generate_db_report(
    request_body: DBReportRequest,
    request: Request,  # ← ADD
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db),  # ← ADD
):
    """Gera relatório PDF de auditoria de banco de dados."""
    try:
        pdf_bytes = generate_db_audit_pdf(
            audit_data=request_body.audit_data,
            auditor_name=request_body.auditor_name or current_user.name,
        )

        # ← ADD: registra exportação de relatório avulso
        log_event(
            db=db,
            event_type="audit.exported",
            actor_id=current_user.id,
            actor_role=current_user.role,
            entity_type="report",
            metadata={"format": "pdf", "report_type": "db-audit"},
            request=request,
        )

        return Response(
            content=pdf_bytes,
            media_type="application/pdf",
            headers={"Content-Disposition": "attachment; filename=privyon-db-audit.pdf"},
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erro ao gerar PDF: {str(e)}")
