"""
Motor de auditoria de bancos de dados para conformidade LGPD.
Suporta PostgreSQL, MySQL, SQLite e SQL Server.
"""

import re
from typing import List, Dict, Any, Optional
from dataclasses import dataclass, field

from .rules import (
    PERSONAL_DATA_COLUMNS, ENCRYPTION_KEYWORDS, SENSITIVE_TABLE_NAMES,
    DB_RULES, RULES_BY_ID
)


@dataclass
class DBFinding:
    rule_id: str
    rule_name: str
    severity: str
    description: str
    article: str
    table: str
    column: Optional[str]
    detail: str
    recommendation: Optional[str] = None


@dataclass 
class TableAudit:
    table_name: str
    total_columns: int
    personal_data_columns: List[str]
    findings: List[DBFinding] = field(default_factory=list)


@dataclass
class DBAuditSummary:
    db_type: str
    db_name: str
    total_tables: int
    tables_with_personal_data: int
    findings: List[DBFinding]
    table_audits: List[TableAudit]
    critical: int = 0
    high: int = 0
    medium: int = 0
    low: int = 0
    score: int = 100  # Score de conformidade 0-100


def _normalize(name: str) -> str:
    return name.lower().replace("-", "_").replace(" ", "_")


def _is_personal_column(col_name: str) -> bool:
    col = _normalize(col_name)
    return any(kw in col for kw in PERSONAL_DATA_COLUMNS)


def _is_encrypted_column(col_name: str) -> bool:
    col = _normalize(col_name)
    return any(kw in col for kw in ENCRYPTION_KEYWORDS)


def _is_sensitive_table(table_name: str) -> bool:
    tbl = _normalize(table_name)
    return any(kw in tbl for kw in SENSITIVE_TABLE_NAMES)


def _is_password_column(col_name: str) -> bool:
    col = _normalize(col_name)
    return any(kw in col for kw in ["senha", "password", "pass", "pwd", "secret"])


def _is_sensitive_data(col_name: str) -> bool:
    """Dados sensíveis conforme Art. 5, X da LGPD"""
    col = _normalize(col_name)
    sensitive = ["saude", "health", "medico", "medical", "diagnostico",
                 "biometria", "biometric", "etnia", "raca", "race",
                 "religiao", "religion", "sexo", "genero", "gender",
                 "orientacao", "orientation", "politico", "sindical"]
    return any(kw in col for kw in sensitive)


def analyze_schema(
    db_type: str,
    db_name: str,
    tables: List[Dict[str, Any]],
    indexes: Optional[List[Dict]] = None,
    foreign_keys: Optional[List[Dict]] = None,
) -> DBAuditSummary:
    """
    Analisa o schema do banco e retorna findings de conformidade LGPD.
    
    tables: lista de dicts com {table_name, columns: [{name, type, nullable}]}
    indexes: lista de dicts com {table_name, column_name, index_name}
    foreign_keys: lista de dicts com {table_name, column_name, on_delete}
    """
    all_findings: List[DBFinding] = []
    table_audits: List[TableAudit] = []
    table_names = [t["table_name"] for t in tables]

    for table in tables:
        tname = table["table_name"]
        columns = table.get("columns", [])
        col_names = [c["name"] for c in columns]
        col_names_norm = [_normalize(c) for c in col_names]

        personal_cols = [c for c in col_names if _is_personal_column(c)]
        
        if not personal_cols and not _is_sensitive_table(tname):
            continue

        findings: List[DBFinding] = []

        # DB-001: Colunas pessoais sem criptografia
        for col in personal_cols:
            if _is_password_column(col):
                continue  # tratado pelo DB-002
            if not _is_encrypted_column(col):
                rule = RULES_BY_ID["DB-001"]
                findings.append(DBFinding(
                    rule_id=rule.id,
                    rule_name=rule.name,
                    severity=rule.severity,
                    description=rule.description,
                    article=rule.article,
                    table=tname,
                    column=col,
                    detail=f"Coluna '{col}' contém dado pessoal sem indicação de criptografia",
                    recommendation=f"Considere criptografar '{col}' usando AES-256 ou armazenar apenas hash quando possível."
                ))

        # DB-002: Senha sem hash
        pwd_cols = [c for c in col_names if _is_password_column(c)]
        for col in pwd_cols:
            if not _is_encrypted_column(col):
                rule = RULES_BY_ID["DB-002"]
                findings.append(DBFinding(
                    rule_id=rule.id,
                    rule_name=rule.name,
                    severity=rule.severity,
                    description=rule.description,
                    article=rule.article,
                    table=tname,
                    column=col,
                    detail=f"Coluna '{col}' parece armazenar senha sem hash",
                    recommendation="Use Argon2 ou bcrypt para armazenar senhas. Nunca armazene em texto plano."
                ))

        # DB-003: Sem tabela de log/auditoria
        has_audit_table = any(
            ("log" in _normalize(t) or "audit" in _normalize(t) or "historico" in _normalize(t))
            for t in table_names
        )
        if personal_cols and not has_audit_table:
            rule = RULES_BY_ID["DB-003"]
            findings.append(DBFinding(
                rule_id=rule.id,
                rule_name=rule.name,
                severity=rule.severity,
                description=rule.description,
                article=rule.article,
                table=tname,
                column=None,
                detail=f"Tabela '{tname}' possui dados pessoais mas não há tabela de auditoria/log no banco",
                recommendation="Crie uma tabela de auditoria registrando quem acessou/modificou dados pessoais e quando."
            ))

        # DB-004: Sem campo de consentimento
        if _is_sensitive_table(tname) and personal_cols:
            has_consent = any(
                kw in _normalize(c) for c in col_names
                for kw in ["consent", "consentimento", "aceite", "termos", "lgpd", "opt"]
            )
            if not has_consent:
                rule = RULES_BY_ID["DB-004"]
                findings.append(DBFinding(
                    rule_id=rule.id,
                    rule_name=rule.name,
                    severity=rule.severity,
                    description=rule.description,
                    article=rule.article,
                    table=tname,
                    column=None,
                    detail=f"Tabela '{tname}' não possui campo de consentimento/aceite de termos",
                    recommendation="Adicione campo 'consent_at' (timestamp) ou 'lgpd_accepted' (boolean) para registrar o consentimento."
                ))

        # DB-005: Sem campo de data de exclusão/expiração
        if personal_cols:
            has_expiry = any(
                kw in _normalize(c) for c in col_names
                for kw in ["deleted_at", "expires_at", "expiracao", "exclusao", "removed_at", "valid_until"]
            )
            if not has_expiry:
                rule = RULES_BY_ID["DB-005"]
                findings.append(DBFinding(
                    rule_id=rule.id,
                    rule_name=rule.name,
                    severity=rule.severity,
                    description=rule.description,
                    article=rule.article,
                    table=tname,
                    column=None,
                    detail=f"Tabela '{tname}' não possui campo de expiração/exclusão de dados pessoais",
                    recommendation="Adicione 'deleted_at' ou 'expires_at' para controlar o ciclo de vida dos dados."
                ))

        # DB-006: Dados sensíveis expostos (Art. 11)
        sensitive_cols = [c for c in col_names if _is_sensitive_data(c)]
        for col in sensitive_cols:
            if not _is_encrypted_column(col):
                rule = RULES_BY_ID["DB-006"]
                findings.append(DBFinding(
                    rule_id=rule.id,
                    rule_name=rule.name,
                    severity=rule.severity,
                    description=rule.description,
                    article=rule.article,
                    table=tname,
                    column=col,
                    detail=f"Dado sensível '{col}' armazenado sem proteção extra (Art. 11 LGPD)",
                    recommendation="Dados sensíveis requerem criptografia obrigatória e controle de acesso reforçado."
                ))

        # DB-007: Sem soft delete
        if personal_cols:
            has_soft_delete = any(
                kw in _normalize(c) for c in col_names
                for kw in ["deleted", "ativo", "active", "status", "removed", "archived"]
            )
            if not has_soft_delete:
                rule = RULES_BY_ID["DB-007"]
                findings.append(DBFinding(
                    rule_id=rule.id,
                    rule_name=rule.name,
                    severity=rule.severity,
                    description=rule.description,
                    article=rule.article,
                    table=tname,
                    column=None,
                    detail=f"Tabela '{tname}' sem mecanismo de exclusão lógica (soft delete)",
                    recommendation="Implemente soft delete com campo 'deleted_at' para atender ao direito de exclusão do titular."
                ))

        # DB-009: Sem timestamps
        if personal_cols:
            has_timestamps = any(
                kw in _normalize(c) for c in col_names
                for kw in ["created_at", "updated_at", "criado_em", "atualizado_em", "created", "updated"]
            )
            if not has_timestamps:
                rule = RULES_BY_ID["DB-009"]
                findings.append(DBFinding(
                    rule_id=rule.id,
                    rule_name=rule.name,
                    severity=rule.severity,
                    description=rule.description,
                    article=rule.article,
                    table=tname,
                    column=None,
                    detail=f"Tabela '{tname}' sem campos de timestamp (created_at/updated_at)",
                    recommendation="Adicione timestamps para rastreabilidade do ciclo de vida dos dados."
                ))

        audit = TableAudit(
            table_name=tname,
            total_columns=len(columns),
            personal_data_columns=personal_cols,
            findings=findings,
        )
        table_audits.append(audit)
        all_findings.extend(findings)

    # DB-008: Índices sobre colunas sensíveis
    if indexes:
        for idx in indexes:
            col = idx.get("column_name", "")
            if _is_personal_column(col) or _is_sensitive_data(col):
                rule = RULES_BY_ID["DB-008"]
                all_findings.append(DBFinding(
                    rule_id=rule.id,
                    rule_name=rule.name,
                    severity=rule.severity,
                    description=rule.description,
                    article=rule.article,
                    table=idx.get("table_name", ""),
                    column=col,
                    detail=f"Índice '{idx.get('index_name')}' criado sobre coluna de dado pessoal '{col}'",
                    recommendation="Evite índices diretos sobre dados pessoais sensíveis. Use índices sobre hashes quando necessário."
                ))

    # DB-010: Foreign keys sem ON DELETE CASCADE
    if foreign_keys:
        for fk in foreign_keys:
            col = fk.get("column_name", "")
            tbl = fk.get("table_name", "")
            if _is_sensitive_table(tbl) and fk.get("on_delete", "").upper() not in ["CASCADE", "SET NULL"]:
                rule = RULES_BY_ID["DB-010"]
                all_findings.append(DBFinding(
                    rule_id=rule.id,
                    rule_name=rule.name,
                    severity=rule.severity,
                    description=rule.description,
                    article=rule.article,
                    table=tbl,
                    column=col,
                    detail=f"FK '{col}' em '{tbl}' sem ON DELETE CASCADE/SET NULL — exclusão do titular pode ser incompleta",
                    recommendation="Configure ON DELETE CASCADE ou ON DELETE SET NULL para garantir exclusão completa dos dados do titular."
                ))

    # Contagens por severidade
    critical = sum(1 for f in all_findings if f.severity == "critical")
    high = sum(1 for f in all_findings if f.severity == "high")
    medium = sum(1 for f in all_findings if f.severity == "medium")
    low = sum(1 for f in all_findings if f.severity == "low")

    # Score de conformidade
    score = max(0, 100 - (critical * 20) - (high * 10) - (medium * 5) - (low * 2))

    return DBAuditSummary(
        db_type=db_type,
        db_name=db_name,
        total_tables=len(tables),
        tables_with_personal_data=len(table_audits),
        findings=all_findings,
        table_audits=table_audits,
        critical=critical,
        high=high,
        medium=medium,
        low=low,
        score=score,
    )
