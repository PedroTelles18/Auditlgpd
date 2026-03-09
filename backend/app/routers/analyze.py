from fastapi import APIRouter, UploadFile, File, HTTPException, Depends
from typing import List

from app.analyzer.engine import CodeAnalyzer
from app.analyzer.zip_handler import analyze_zip
from app.analyzer.groq_ai import analyze_with_groq
from app.schemas.analysis import AnalysisSummary, FileAnalysisOut, FindingOut
from app.core.security import get_current_user
from app.models.user import User

router = APIRouter(prefix="/analyze", tags=["Análise de Código"])

SUPPORTED = {".py", ".js", ".ts", ".jsx", ".tsx", ".zip"}
MAX_SIZE = 10 * 1024 * 1024
AI_SEVERITIES = {"critical", "high"}
MAX_AI_FINDINGS = 3


@router.post("/code", response_model=AnalysisSummary)
async def analyze_code(
    files: List[UploadFile] = File(...),
    current_user: User = Depends(get_current_user),
):
    if not files:
        raise HTTPException(status_code=400, detail="Nenhum arquivo enviado.")

    analyzer = CodeAnalyzer()
    all_results = []

    for upload in files:
        filename = upload.filename or "arquivo"
        ext = "." + filename.rsplit(".", 1)[-1].lower() if "." in filename else ""

        if ext not in SUPPORTED:
            raise HTTPException(status_code=422, detail=f"Arquivo '{filename}' não suportado.")

        content = await upload.read()
        if len(content) > MAX_SIZE:
            raise HTTPException(status_code=413, detail=f"Arquivo '{filename}' excede 10MB.")

        if ext == ".zip":
            all_results.extend(analyze_zip(content, filename))
        else:
            text = content.decode("utf-8", errors="replace")
            all_results.append(analyzer.analyze_content(filename, text))

    # Enriquece findings críticos/altos com Groq
    for result in all_results:
        ai_count = 0
        for finding in result.findings:
            if finding.severity in AI_SEVERITIES and ai_count < MAX_AI_FINDINGS:
                ai_analysis = await analyze_with_groq(
                    code_snippet=finding.code_snippet,
                    finding_type=finding.type,
                    filename=result.filename,
                    line=finding.line,
                )
                if ai_analysis:
                    finding.recommendation = ai_analysis
                    ai_count += 1

    all_findings = [f for r in all_results for f in r.findings]

    return AnalysisSummary(
        total_files=len(all_results),
        total_findings=len(all_findings),
        critical=sum(1 for f in all_findings if f.severity == "critical"),
        high=sum(1 for f in all_findings if f.severity == "high"),
        medium=sum(1 for f in all_findings if f.severity == "medium"),
        low=sum(1 for f in all_findings if f.severity == "low"),
        results=[
            FileAnalysisOut(
                filename=r.filename,
                language=r.language,
                total_lines=r.total_lines,
                analyzed_at=r.analyzed_at,
                total_findings=r.total_findings,
                findings=[
                    FindingOut(
                        rule_id=f.rule_id,
                        type=f.type,
                        severity=f.severity,
                        description=f.description,
                        line=f.line,
                        column=f.column,
                        code_snippet=f.code_snippet,
                        recommendation=f.recommendation,
                        analyzer=f.analyzer,
                    )
                    for f in r.findings
                ],
                error=r.error,
            )
            for r in all_results
        ],
    )


@router.get("/status")
async def groq_status(current_user: User = Depends(get_current_user)):
    from app.config import settings
    return {"groq_enabled": bool(settings.GROQ_API_KEY), "model": "llama-3.3-70b-versatile"}
