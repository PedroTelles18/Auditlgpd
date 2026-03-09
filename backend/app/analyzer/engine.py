"""
Motor principal de análise de código LGPD.
Combina análise via Regex (linha a linha) e AST (estrutura do código Python).
"""

import ast
import re
from dataclasses import dataclass, field
from pathlib import Path
from typing import Optional

from app.analyzer.rules import RULES, Rule


# ── Modelos de resultado ──────────────────────────────────────────────────────

@dataclass
class Finding:
    rule_id: str
    type: str
    severity: str
    description: str
    line: int
    column: int
    code_snippet: str
    recommendation: str
    analyzer: str  # "regex" | "ast"


@dataclass
class FileAnalysisResult:
    filename: str
    language: str
    total_lines: int
    analyzed_at: str
    total_findings: int = 0
    findings: list[Finding] = field(default_factory=list)
    error: Optional[str] = None


# ── Analisador principal ──────────────────────────────────────────────────────

class CodeAnalyzer:

    SUPPORTED = {".py": "python", ".js": "javascript", ".ts": "typescript",
                 ".jsx": "javascript", ".tsx": "typescript"}

    def analyze_content(self, filename: str, content: str) -> FileAnalysisResult:
        from datetime import datetime, timezone

        ext = Path(filename).suffix.lower()
        language = self.SUPPORTED.get(ext, "unknown")
        lines = content.splitlines()

        result = FileAnalysisResult(
            filename=filename,
            language=language,
            total_lines=len(lines),
            analyzed_at=datetime.now(timezone.utc).isoformat(),
        )

        if language == "unknown":
            result.error = f"Extensão '{ext}' não suportada."
            return result

        # ── 1. Análise por regex (todas as linguagens) ────────────────────
        regex_findings = self._analyze_regex(lines)
        result.findings.extend(regex_findings)

        # ── 2. Análise AST (apenas Python) ───────────────────────────────
        if language == "python":
            ast_findings = self._analyze_ast(content, lines)
            # Evita duplicatas — só adiciona se linha não foi flagrada pelo regex
            flagged_lines = {f.line for f in regex_findings}
            for f in ast_findings:
                if f.line not in flagged_lines:
                    result.findings.append(f)

        # Ordena por severidade → linha
        severity_order = {"critical": 0, "high": 1, "medium": 2, "low": 3}
        result.findings.sort(key=lambda f: (severity_order.get(f.severity, 9), f.line))
        result.total_findings = len(result.findings)
        return result

    # ── Regex ─────────────────────────────────────────────────────────────────

    def _analyze_regex(self, lines: list[str]) -> list[Finding]:
        findings = []
        for line_num, line in enumerate(lines, start=1):
            for rule in RULES:
                if rule.pattern.search(line):
                    findings.append(Finding(
                        rule_id=rule.id,
                        type=rule.type,
                        severity=rule.severity,
                        description=rule.description,
                        line=line_num,
                        column=0,
                        code_snippet=line.strip()[:200],
                        recommendation=rule.recommendation,
                        analyzer="regex",
                    ))
                    break  # Uma regra por linha é suficiente para regex
        return findings

    # ── AST (Python apenas) ───────────────────────────────────────────────────

    def _analyze_ast(self, source: str, lines: list[str]) -> list[Finding]:
        findings = []
        try:
            tree = ast.parse(source)
        except SyntaxError:
            return findings  # Código inválido, ignora AST

        visitor = LGPDASTVisitor(lines)
        visitor.visit(tree)
        findings.extend(visitor.findings)
        return findings


# ── Visitor AST ───────────────────────────────────────────────────────────────

class LGPDASTVisitor(ast.NodeVisitor):
    """Percorre a AST Python procurando padrões LGPD."""

    PERSONAL_DATA_VARS = re.compile(
        r'(cpf|rg|email|telefone|celular|nome|senha|password|cartao|card|token_usuario)',
        re.IGNORECASE,
    )

    LOG_FUNCS = re.compile(r'(log|logger|logging)', re.IGNORECASE)

    def __init__(self, lines: list[str]):
        self.lines = lines
        self.findings: list[Finding] = []

    def _snippet(self, line: int) -> str:
        if 1 <= line <= len(self.lines):
            return self.lines[line - 1].strip()[:200]
        return ""

    # ── Detecta chamadas de log com variáveis de dados pessoais ──────────────
    def visit_Call(self, node: ast.Call):
        func_name = ""
        if isinstance(node.func, ast.Attribute):
            func_name = node.func.attr
        elif isinstance(node.func, ast.Name):
            func_name = node.func.id

        if self.LOG_FUNCS.search(func_name):
            for arg in node.args:
                arg_src = ast.unparse(arg) if hasattr(ast, "unparse") else ""
                if self.PERSONAL_DATA_VARS.search(arg_src):
                    self.findings.append(Finding(
                        rule_id="LGPD-001-AST",
                        type="LOG_DADOS_PESSOAIS",
                        severity="critical",
                        description="AST: chamada de log passando variável com possível dado pessoal.",
                        line=node.lineno,
                        column=node.col_offset,
                        code_snippet=self._snippet(node.lineno),
                        recommendation="Anonimize dados pessoais antes de logar. Nunca logue CPF, e-mail ou senha.",
                        analyzer="ast",
                    ))

        self.generic_visit(node)

    # ── Detecta atribuições de dados sensíveis em texto plano ────────────────
    def visit_Assign(self, node: ast.Assign):
        for target in node.targets:
            if isinstance(target, ast.Name):
                if self.PERSONAL_DATA_VARS.search(target.id):
                    # Só alerta se o valor for uma string literal
                    if isinstance(node.value, ast.Constant) and isinstance(node.value.value, str):
                        self.findings.append(Finding(
                            rule_id="LGPD-005-AST",
                            type="DADO_PESSOAL_LITERAL",
                            severity="high",
                            description=f"AST: variável '{target.id}' recebe valor literal — possível dado pessoal em texto plano.",
                            line=node.lineno,
                            column=node.col_offset,
                            code_snippet=self._snippet(node.lineno),
                            recommendation="Nunca armazene dados pessoais reais como literais no código. Use variáveis de ambiente ou banco de dados.",
                            analyzer="ast",
                        ))
        self.generic_visit(node)

    # ── Detecta f-strings com dados pessoais em chamadas de função ───────────
    def visit_JoinedStr(self, node: ast.JoinedStr):
        for value in ast.walk(node):
            if isinstance(value, ast.FormattedValue):
                if isinstance(value.value, ast.Name):
                    if self.PERSONAL_DATA_VARS.search(value.value.id):
                        self.findings.append(Finding(
                            rule_id="LGPD-001-FSTR",
                            type="FSTRING_DADO_PESSOAL",
                            severity="high",
                            description=f"AST: f-string interpolando variável de dado pessoal '{value.value.id}'.",
                            line=node.lineno,
                            column=node.col_offset,
                            code_snippet=self._snippet(node.lineno),
                            recommendation="Evite interpolar dados pessoais em strings. Use máscaras ou hashes.",
                            analyzer="ast",
                        ))
        self.generic_visit(node)
