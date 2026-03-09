"""
Router para geração de relatórios PDF.
POST /reports/code-analysis  — gera PDF de análise de código
POST /reports/db-audit       — gera PDF de auditoria de banco
"""

from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import Response
from pydantic import BaseModel
from typing import Any, Dict, Optional

from app.reports.pdf_generator import generate_code_analysis_pdf, generate_db_audit_pdf
from app.core.security import get_current_user

router = APIRouter(prefix="/reports", tags=["Reports"])


class CodeReportRequest(BaseModel):
    analysis_data: Dict[str, Any]
    auditor_name: Optional[str] = "Privyon"


class DBReportRequest(BaseModel):
    audit_data: Dict[str, Any]
    auditor_name: Optional[str] = "Privyon"


@router.post("/code-analysis")
async def generate_code_report(
    request: CodeReportRequest,
    current_user=Depends(get_current_user),
):
    """Gera relatório PDF de análise de código-fonte."""
    try:
        pdf_bytes = generate_code_analysis_pdf(
            analysis_data=request.analysis_data,
            auditor_name=request.auditor_name or current_user.name,
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
    request: DBReportRequest,
    current_user=Depends(get_current_user),
):
    """Gera relatório PDF de auditoria de banco de dados."""
    try:
        pdf_bytes = generate_db_audit_pdf(
            audit_data=request.audit_data,
            auditor_name=request.auditor_name or current_user.name,
        )
        return Response(
            content=pdf_bytes,
            media_type="application/pdf",
            headers={"Content-Disposition": "attachment; filename=privyon-db-audit.pdf"},
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erro ao gerar PDF: {str(e)}")
