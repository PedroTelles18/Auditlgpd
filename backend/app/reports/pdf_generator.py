"""
Gerador de relatórios PDF para auditoria LGPD - Privyon
Usa ReportLab para criar relatórios profissionais.
"""

from io import BytesIO
from datetime import datetime
from typing import List, Optional, Dict, Any

from reportlab.lib.pagesizes import A4
from reportlab.lib.units import mm
from reportlab.lib import colors
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.enums import TA_LEFT, TA_CENTER, TA_RIGHT
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle,
    HRFlowable, PageBreak, KeepTogether
)
from reportlab.graphics.shapes import Drawing, Rect, String
from reportlab.graphics import renderPDF

# ── Paleta de cores Privyon ──────────────────────────────────
C_BG        = colors.HexColor("#080c10")
C_CARD      = colors.HexColor("#0d1117")
C_ACCENT    = colors.HexColor("#00e5ff")
C_WHITE     = colors.HexColor("#cdd9e5")
C_DIM       = colors.HexColor("#8b9ab0")
C_BORDER    = colors.HexColor("#1e2d3d")
C_CRITICAL  = colors.HexColor("#ff4d6d")
C_HIGH      = colors.HexColor("#ff8c00")
C_MEDIUM    = colors.HexColor("#ffd60a")
C_LOW       = colors.HexColor("#00e5ff")
C_SUCCESS   = colors.HexColor("#3ddc84")


def _styles():
    base = getSampleStyleSheet()
    custom = {}

    custom["title"] = ParagraphStyle(
        "title", fontName="Helvetica-Bold", fontSize=22,
        textColor=C_WHITE, spaceAfter=4, leading=28
    )
    custom["subtitle"] = ParagraphStyle(
        "subtitle", fontName="Helvetica", fontSize=10,
        textColor=C_ACCENT, spaceAfter=2, leading=14
    )
    custom["section"] = ParagraphStyle(
        "section", fontName="Helvetica-Bold", fontSize=11,
        textColor=C_WHITE, spaceBefore=14, spaceAfter=6,
        leading=16, borderPad=0
    )
    custom["body"] = ParagraphStyle(
        "body", fontName="Helvetica", fontSize=9,
        textColor=C_WHITE, spaceAfter=4, leading=13
    )
    custom["dim"] = ParagraphStyle(
        "dim", fontName="Helvetica", fontSize=8,
        textColor=C_DIM, spaceAfter=2, leading=12
    )
    custom["mono"] = ParagraphStyle(
        "mono", fontName="Courier", fontSize=8,
        textColor=C_ACCENT, spaceAfter=2, leading=12
    )
    custom["finding_title"] = ParagraphStyle(
        "finding_title", fontName="Helvetica-Bold", fontSize=9,
        textColor=C_WHITE, spaceAfter=2, leading=13
    )
    custom["finding_body"] = ParagraphStyle(
        "finding_body", fontName="Helvetica", fontSize=8,
        textColor=C_DIM, spaceAfter=2, leading=12
    )
    custom["rec"] = ParagraphStyle(
        "rec", fontName="Helvetica-Oblique", fontSize=8,
        textColor=C_ACCENT, spaceAfter=2, leading=12
    )
    custom["center"] = ParagraphStyle(
        "center", fontName="Helvetica", fontSize=9,
        textColor=C_DIM, alignment=TA_CENTER, leading=12
    )
    return custom


def _severity_color(severity: str) -> colors.Color:
    return {
        "critical": C_CRITICAL,
        "high": C_HIGH,
        "medium": C_MEDIUM,
        "low": C_LOW,
    }.get(severity, C_DIM)


def _severity_label(severity: str) -> str:
    return {
        "critical": "CRITICO",
        "high": "ALTO",
        "medium": "MEDIO",
        "low": "BAIXO",
    }.get(severity, severity.upper())


def _score_color(score: int) -> colors.Color:
    if score >= 80: return C_SUCCESS
    if score >= 60: return C_MEDIUM
    if score >= 40: return C_HIGH
    return C_CRITICAL


def _header_footer(canvas, doc):
    """Cabeçalho e rodapé em todas as páginas."""
    canvas.saveState()
    w, h = A4

    # Header bar
    canvas.setFillColor(C_BG)
    canvas.rect(0, h - 28*mm, w, 28*mm, fill=1, stroke=0)

    # Accent line
    canvas.setFillColor(C_ACCENT)
    canvas.rect(0, h - 28*mm, w, 1, fill=1, stroke=0)

    # Logo text
    canvas.setFont("Helvetica-Bold", 14)
    canvas.setFillColor(C_WHITE)
    canvas.drawString(20*mm, h - 18*mm, "Priv")
    canvas.setFillColor(C_ACCENT)
    canvas.drawString(20*mm + 26, h - 18*mm, "yon")

    # Header right
    canvas.setFont("Helvetica", 8)
    canvas.setFillColor(C_DIM)
    canvas.drawRightString(w - 20*mm, h - 14*mm, "Relatório de Auditoria LGPD")
    canvas.drawRightString(w - 20*mm, h - 20*mm, datetime.now().strftime("%d/%m/%Y %H:%M"))

    # Footer
    canvas.setFillColor(C_BG)
    canvas.rect(0, 0, w, 16*mm, fill=1, stroke=0)
    canvas.setFillColor(C_BORDER)
    canvas.rect(0, 16*mm, w, 1, fill=1, stroke=0)

    canvas.setFont("Helvetica", 7)
    canvas.setFillColor(C_DIM)
    canvas.drawString(20*mm, 8*mm, "Privyon — Sistema de Auditoria LGPD | privyon.com.br")
    canvas.drawRightString(w - 20*mm, 8*mm, f"Página {doc.page}")
    canvas.restoreState()


def generate_code_analysis_pdf(
    analysis_data: Dict[str, Any],
    auditor_name: str = "Sistema",
) -> bytes:
    """
    Gera PDF de relatório de análise de código-fonte.
    analysis_data: resultado do endpoint /analyze/code
    """
    buf = BytesIO()
    doc = SimpleDocTemplate(
        buf, pagesize=A4,
        leftMargin=20*mm, rightMargin=20*mm,
        topMargin=35*mm, bottomMargin=22*mm,
    )
    s = _styles()
    story = []

    total_files = analysis_data.get("total_files", 0)
    critical = analysis_data.get("critical", 0)
    high = analysis_data.get("high", 0)
    medium = analysis_data.get("medium", 0)
    low = analysis_data.get("low", 0)
    total = critical + high + medium + low
    results = analysis_data.get("results", [])

    # ── Capa ────────────────────────────────────────────────
    story.append(Spacer(1, 8*mm))
    story.append(Paragraph("Relatório de Auditoria", s["subtitle"]))
    story.append(Paragraph("Análise de Código-Fonte", s["title"]))
    story.append(HRFlowable(width="100%", thickness=1, color=C_BORDER, spaceAfter=8))

    # Meta info
    meta = [
        ["Módulo", "Análise de Código-Fonte (AST + Regex + IA)"],
        ["Auditado por", auditor_name],
        ["Data", datetime.now().strftime("%d de %B de %Y às %H:%M")],
        ["Arquivos analisados", str(total_files)],
        ["Total de violações", str(total)],
    ]
    meta_table = Table(meta, colWidths=[45*mm, 120*mm])
    meta_table.setStyle(TableStyle([
        ("FONTNAME", (0, 0), (-1, -1), "Helvetica"),
        ("FONTSIZE", (0, 0), (-1, -1), 8),
        ("TEXTCOLOR", (0, 0), (0, -1), C_DIM),
        ("TEXTCOLOR", (1, 0), (1, -1), C_WHITE),
        ("ROWBACKGROUNDS", (0, 0), (-1, -1), [C_CARD, C_BG]),
        ("TOPPADDING", (0, 0), (-1, -1), 5),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 5),
        ("LEFTPADDING", (0, 0), (-1, -1), 8),
    ]))
    story.append(meta_table)
    story.append(Spacer(1, 8*mm))

    # ── Resumo executivo ─────────────────────────────────────
    story.append(Paragraph("Resumo Executivo", s["section"]))

    summary_data = [
        ["CRÍTICO", str(critical), "ALTO", str(high), "MÉDIO", str(medium), "BAIXO", str(low)],
    ]
    summary_table = Table(summary_data, colWidths=[22*mm, 18*mm, 22*mm, 18*mm, 22*mm, 18*mm, 22*mm, 18*mm])
    summary_table.setStyle(TableStyle([
        ("FONTNAME", (0, 0), (-1, -1), "Helvetica-Bold"),
        ("FONTSIZE", (0, 0), (-1, -1), 8),
        ("ALIGN", (0, 0), (-1, -1), "CENTER"),
        ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
        ("TEXTCOLOR", (0, 0), (0, 0), C_CRITICAL),
        ("TEXTCOLOR", (1, 0), (1, 0), C_WHITE),
        ("TEXTCOLOR", (2, 0), (2, 0), C_HIGH),
        ("TEXTCOLOR", (3, 0), (3, 0), C_WHITE),
        ("TEXTCOLOR", (4, 0), (4, 0), C_MEDIUM),
        ("TEXTCOLOR", (5, 0), (5, 0), C_WHITE),
        ("TEXTCOLOR", (6, 0), (6, 0), C_LOW),
        ("TEXTCOLOR", (7, 0), (7, 0), C_WHITE),
        ("BACKGROUND", (0, 0), (-1, -1), C_CARD),
        ("TOPPADDING", (0, 0), (-1, -1), 10),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 10),
        ("GRID", (0, 0), (-1, -1), 0.5, C_BORDER),
    ]))
    story.append(summary_table)
    story.append(Spacer(1, 6*mm))

    # ── Violações por arquivo ─────────────────────────────────
    if results:
        story.append(Paragraph("Violações por Arquivo", s["section"]))

        for file_result in results:
            filename = file_result.get("filename", "")
            findings = file_result.get("findings", [])
            if not findings:
                continue

            story.append(KeepTogether([
                Paragraph(f"📄 {filename}", s["mono"]),
                Spacer(1, 2*mm),
            ]))

            for f in findings:
                sev = f.get("severity", "low")
                sev_color = _severity_color(sev)
                sev_label = _severity_label(sev)

                rule_id = f.get("rule_id", "")
                line = f.get("line", "")
                description = f.get("description", "")
                detail = f.get("detail", "")
                recommendation = f.get("recommendation", "")

                row_data = [
                    [
                        Paragraph(f"<b>{sev_label}</b>", ParagraphStyle("sv", fontName="Helvetica-Bold", fontSize=7, textColor=sev_color)),
                        Paragraph(f"<b>{rule_id}</b> — {description}", s["finding_title"]),
                    ],
                    [
                        "",
                        Paragraph(f"Linha {line}: {detail}" if line else detail, s["finding_body"]),
                    ],
                ]
                if recommendation:
                    row_data.append([
                        "",
                        Paragraph(f"→ {recommendation}", s["rec"]),
                    ])

                finding_table = Table(row_data, colWidths=[18*mm, 142*mm])
                finding_table.setStyle(TableStyle([
                    ("BACKGROUND", (0, 0), (-1, -1), C_CARD),
                    ("TOPPADDING", (0, 0), (-1, -1), 4),
                    ("BOTTOMPADDING", (0, 0), (-1, -1), 4),
                    ("LEFTPADDING", (0, 0), (-1, -1), 6),
                    ("VALIGN", (0, 0), (-1, -1), "TOP"),
                    ("LINEBELOW", (0, -1), (-1, -1), 0.5, C_BORDER),
                ]))
                story.append(finding_table)

            story.append(Spacer(1, 4*mm))

    # ── Rodapé da última página ──────────────────────────────
    story.append(PageBreak())
    story.append(Spacer(1, 20*mm))
    story.append(Paragraph("Conclusão", s["section"]))
    story.append(Paragraph(
        f"A análise identificou <b>{total} violações</b> nos {total_files} arquivo(s) analisado(s), "
        f"sendo <b>{critical} críticas</b> e <b>{high} de alta severidade</b>. "
        "Recomenda-se priorizar a correção das violações críticas e altas antes do deploy em produção.",
        s["body"]
    ))
    story.append(Spacer(1, 4*mm))
    story.append(Paragraph(
        "Este relatório foi gerado automaticamente pelo Privyon — Sistema de Auditoria LGPD. "
        "As recomendações têm caráter orientativo e devem ser avaliadas por um profissional de segurança.",
        s["dim"]
    ))

    doc.build(story, onFirstPage=_header_footer, onLaterPages=_header_footer)
    return buf.getvalue()


def generate_db_audit_pdf(
    audit_data: Dict[str, Any],
    auditor_name: str = "Sistema",
) -> bytes:
    """
    Gera PDF de relatório de auditoria de banco de dados.
    audit_data: resultado do endpoint /db-audit/analyze
    """
    buf = BytesIO()
    doc = SimpleDocTemplate(
        buf, pagesize=A4,
        leftMargin=20*mm, rightMargin=20*mm,
        topMargin=35*mm, bottomMargin=22*mm,
    )
    s = _styles()
    story = []

    db_type = audit_data.get("db_type", "").upper()
    db_name = audit_data.get("db_name", "")
    total_tables = audit_data.get("total_tables", 0)
    tables_personal = audit_data.get("tables_with_personal_data", 0)
    critical = audit_data.get("critical", 0)
    high = audit_data.get("high", 0)
    medium = audit_data.get("medium", 0)
    low = audit_data.get("low", 0)
    score = audit_data.get("score", 0)
    table_audits = audit_data.get("table_audits", [])

    # ── Capa ────────────────────────────────────────────────
    story.append(Spacer(1, 8*mm))
    story.append(Paragraph("Relatório de Auditoria", s["subtitle"]))
    story.append(Paragraph("Banco de Dados", s["title"]))
    story.append(HRFlowable(width="100%", thickness=1, color=C_BORDER, spaceAfter=8))

    meta = [
        ["Módulo", "DB Auditor (Análise de Schema LGPD)"],
        ["Banco", f"{db_type} — {db_name}"],
        ["Auditado por", auditor_name],
        ["Data", datetime.now().strftime("%d de %B de %Y às %H:%M")],
        ["Tabelas analisadas", str(total_tables)],
        ["Tabelas com dados pessoais", str(tables_personal)],
    ]
    meta_table = Table(meta, colWidths=[55*mm, 110*mm])
    meta_table.setStyle(TableStyle([
        ("FONTNAME", (0, 0), (-1, -1), "Helvetica"),
        ("FONTSIZE", (0, 0), (-1, -1), 8),
        ("TEXTCOLOR", (0, 0), (0, -1), C_DIM),
        ("TEXTCOLOR", (1, 0), (1, -1), C_WHITE),
        ("ROWBACKGROUNDS", (0, 0), (-1, -1), [C_CARD, C_BG]),
        ("TOPPADDING", (0, 0), (-1, -1), 5),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 5),
        ("LEFTPADDING", (0, 0), (-1, -1), 8),
    ]))
    story.append(meta_table)
    story.append(Spacer(1, 6*mm))

    # ── Score ────────────────────────────────────────────────
    story.append(Paragraph("Score de Conformidade LGPD", s["section"]))
    score_color = _score_color(score)

    score_data = [[
        Paragraph(f"<b>{score}</b>/100", ParagraphStyle("sc", fontName="Helvetica-Bold", fontSize=28, textColor=score_color, alignment=TA_CENTER)),
        Paragraph(
            f"<b>{'APROVADO' if score >= 70 else 'ATENÇÃO' if score >= 40 else 'REPROVADO'}</b><br/>"
            f"{'Conformidade satisfatória com a LGPD.' if score >= 70 else 'Violações importantes identificadas.' if score >= 40 else 'Múltiplas violações críticas detectadas.'}",
            ParagraphStyle("sv2", fontName="Helvetica-Bold", fontSize=10, textColor=score_color, leading=16)
        ),
    ]]
    score_table = Table(score_data, colWidths=[40*mm, 125*mm])
    score_table.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, -1), C_CARD),
        ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
        ("TOPPADDING", (0, 0), (-1, -1), 10),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 10),
        ("LEFTPADDING", (0, 0), (-1, -1), 10),
        ("GRID", (0, 0), (-1, -1), 0.5, C_BORDER),
    ]))
    story.append(score_table)
    story.append(Spacer(1, 4*mm))

    # ── Resumo ────────────────────────────────────────────────
    summary_data = [["CRÍTICO", str(critical), "ALTO", str(high), "MÉDIO", str(medium), "BAIXO", str(low)]]
    summary_table = Table(summary_data, colWidths=[22*mm, 18*mm, 22*mm, 18*mm, 22*mm, 18*mm, 22*mm, 18*mm])
    summary_table.setStyle(TableStyle([
        ("FONTNAME", (0, 0), (-1, -1), "Helvetica-Bold"),
        ("FONTSIZE", (0, 0), (-1, -1), 8),
        ("ALIGN", (0, 0), (-1, -1), "CENTER"),
        ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
        ("TEXTCOLOR", (0, 0), (0, 0), C_CRITICAL),
        ("TEXTCOLOR", (1, 0), (1, 0), C_WHITE),
        ("TEXTCOLOR", (2, 0), (2, 0), C_HIGH),
        ("TEXTCOLOR", (3, 0), (3, 0), C_WHITE),
        ("TEXTCOLOR", (4, 0), (4, 0), C_MEDIUM),
        ("TEXTCOLOR", (5, 0), (5, 0), C_WHITE),
        ("TEXTCOLOR", (6, 0), (6, 0), C_LOW),
        ("TEXTCOLOR", (7, 0), (7, 0), C_WHITE),
        ("BACKGROUND", (0, 0), (-1, -1), C_CARD),
        ("TOPPADDING", (0, 0), (-1, -1), 10),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 10),
        ("GRID", (0, 0), (-1, -1), 0.5, C_BORDER),
    ]))
    story.append(summary_table)
    story.append(Spacer(1, 6*mm))

    # ── Violações por tabela ──────────────────────────────────
    if table_audits:
        story.append(Paragraph("Violações por Tabela", s["section"]))

        for ta in table_audits:
            tname = ta.get("table_name", "")
            findings = ta.get("findings", [])
            personal_cols = ta.get("personal_data_columns", [])
            if not findings:
                continue

            cols_str = ", ".join(personal_cols[:6])
            if len(personal_cols) > 6:
                cols_str += f" (+{len(personal_cols)-6})"

            story.append(KeepTogether([
                Paragraph(f"Tabela: {tname}", s["mono"]),
                Paragraph(f"Colunas com dados pessoais: {cols_str or 'nenhuma identificada'}", s["dim"]),
                Spacer(1, 2*mm),
            ]))

            for f in findings:
                sev = f.get("severity", "low")
                sev_color = _severity_color(sev)
                rule_id = f.get("rule_id", "")
                col = f.get("column", "")
                detail = f.get("detail", "")
                article = f.get("article", "")
                recommendation = f.get("recommendation", "")

                col_str = f" (coluna: {col})" if col else ""
                row_data = [
                    [
                        Paragraph(f"<b>{_severity_label(sev)}</b>", ParagraphStyle("sv3", fontName="Helvetica-Bold", fontSize=7, textColor=sev_color)),
                        Paragraph(f"<b>{rule_id}</b>{col_str}", s["finding_title"]),
                    ],
                    ["", Paragraph(detail, s["finding_body"])],
                    ["", Paragraph(article, s["dim"])],
                ]
                if recommendation:
                    row_data.append(["", Paragraph(f"→ {recommendation}", s["rec"])])

                ft = Table(row_data, colWidths=[18*mm, 142*mm])
                ft.setStyle(TableStyle([
                    ("BACKGROUND", (0, 0), (-1, -1), C_CARD),
                    ("TOPPADDING", (0, 0), (-1, -1), 3),
                    ("BOTTOMPADDING", (0, 0), (-1, -1), 3),
                    ("LEFTPADDING", (0, 0), (-1, -1), 6),
                    ("VALIGN", (0, 0), (-1, -1), "TOP"),
                    ("LINEBELOW", (0, -1), (-1, -1), 0.5, C_BORDER),
                ]))
                story.append(ft)

            story.append(Spacer(1, 4*mm))

    # ── Conclusão ─────────────────────────────────────────────
    story.append(PageBreak())
    story.append(Spacer(1, 20*mm))
    story.append(Paragraph("Conclusão e Recomendações", s["section"]))
    story.append(Paragraph(
        f"A auditoria do banco <b>{db_name}</b> ({db_type}) identificou violações em "
        f"<b>{tables_personal}</b> das {total_tables} tabelas analisadas. "
        f"O score de conformidade LGPD obtido foi de <b>{score}/100</b>.",
        s["body"]
    ))
    story.append(Spacer(1, 3*mm))

    recs = []
    if critical > 0:
        recs.append("Corrigir imediatamente as violações críticas, especialmente colunas com dados pessoais sem criptografia.")
    if high > 0:
        recs.append("Implementar campos de consentimento e logs de auditoria nas tabelas identificadas.")
    if medium > 0:
        recs.append("Adicionar mecanismos de soft delete e controle de retenção de dados.")
    recs.append("Realizar nova auditoria após as correções para verificar a conformidade.")

    for rec in recs:
        story.append(Paragraph(f"• {rec}", s["body"]))

    story.append(Spacer(1, 4*mm))
    story.append(Paragraph(
        "Este relatório foi gerado automaticamente pelo Privyon — Sistema de Auditoria LGPD. "
        "As recomendações têm caráter orientativo e devem ser avaliadas por um profissional de segurança.",
        s["dim"]
    ))

    doc.build(story, onFirstPage=_header_footer, onLaterPages=_header_footer)
    return buf.getvalue()
