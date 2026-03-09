"""
Router para auditoria de bancos de dados.
POST /db-audit/analyze  — conecta ao banco e retorna findings LGPD
POST /db-audit/schema   — analisa schema enviado manualmente (sem conexão)
"""

from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from typing import Optional, List, Any, Dict

from app.db_auditor.connectors import ConnectionConfig, get_schema, DBConnectorError
from app.db_auditor.engine import analyze_schema, DBFinding, TableAudit, DBAuditSummary
from app.core.security import get_current_user

router = APIRouter(prefix="/db-audit", tags=["DB Auditor"])


# ── Schemas de entrada ──────────────────────────────────────

class DBConnectionRequest(BaseModel):
    db_type: str  # postgresql, mysql, sqlite, sqlserver
    host: Optional[str] = None
    port: Optional[int] = None
    database: str
    username: Optional[str] = None
    password: Optional[str] = None
    connection_string: Optional[str] = None


class ColumnSchema(BaseModel):
    name: str
    type: str
    nullable: Optional[str] = "YES"


class TableSchema(BaseModel):
    table_name: str
    columns: List[ColumnSchema]


class ManualSchemaRequest(BaseModel):
    db_type: str
    db_name: str
    tables: List[TableSchema]


# ── Schemas de saída ─────────────────────────────────────────

class FindingOut(BaseModel):
    rule_id: str
    rule_name: str
    severity: str
    description: str
    article: str
    table: str
    column: Optional[str]
    detail: str
    recommendation: Optional[str]


class TableAuditOut(BaseModel):
    table_name: str
    total_columns: int
    personal_data_columns: List[str]
    findings: List[FindingOut]


class DBAuditOut(BaseModel):
    db_type: str
    db_name: str
    total_tables: int
    tables_with_personal_data: int
    critical: int
    high: int
    medium: int
    low: int
    score: int
    total_findings: int
    findings: List[FindingOut]
    table_audits: List[TableAuditOut]


def _summary_to_out(summary: DBAuditSummary) -> DBAuditOut:
    return DBAuditOut(
        db_type=summary.db_type,
        db_name=summary.db_name,
        total_tables=summary.total_tables,
        tables_with_personal_data=summary.tables_with_personal_data,
        critical=summary.critical,
        high=summary.high,
        medium=summary.medium,
        low=summary.low,
        score=summary.score,
        total_findings=len(summary.findings),
        findings=[FindingOut(**f.__dict__) for f in summary.findings],
        table_audits=[
            TableAuditOut(
                table_name=ta.table_name,
                total_columns=ta.total_columns,
                personal_data_columns=ta.personal_data_columns,
                findings=[FindingOut(**f.__dict__) for f in ta.findings],
            )
            for ta in summary.table_audits
        ],
    )


# ── Endpoints ────────────────────────────────────────────────

@router.post("/analyze", response_model=DBAuditOut)
async def analyze_database(
    request: DBConnectionRequest,
    current_user=Depends(get_current_user),
):
    """Conecta ao banco de dados e analisa conformidade LGPD."""
    config = ConnectionConfig(
        db_type=request.db_type,
        host=request.host,
        port=request.port,
        database=request.database,
        username=request.username,
        password=request.password,
        connection_string=request.connection_string,
    )

    try:
        schema = get_schema(config)
    except DBConnectorError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erro inesperado: {str(e)}")

    summary = analyze_schema(
        db_type=schema["db_type"],
        db_name=schema["db_name"],
        tables=schema["tables"],
        indexes=schema.get("indexes"),
        foreign_keys=schema.get("foreign_keys"),
    )

    return _summary_to_out(summary)


@router.post("/schema", response_model=DBAuditOut)
async def analyze_manual_schema(
    request: ManualSchemaRequest,
    current_user=Depends(get_current_user),
):
    """Analisa um schema enviado manualmente (sem precisar conectar ao banco)."""
    tables = [
        {
            "table_name": t.table_name,
            "columns": [{"name": c.name, "type": c.type, "nullable": c.nullable} for c in t.columns],
        }
        for t in request.tables
    ]

    summary = analyze_schema(
        db_type=request.db_type,
        db_name=request.db_name,
        tables=tables,
    )

    return _summary_to_out(summary)


@router.get("/supported-databases")
async def get_supported_databases():
    """Retorna os bancos de dados suportados."""
    return {
        "databases": [
            {"type": "postgresql", "name": "PostgreSQL", "default_port": 5432},
            {"type": "mysql", "name": "MySQL / MariaDB", "default_port": 3306},
            {"type": "sqlite", "name": "SQLite", "default_port": None},
            {"type": "sqlserver", "name": "SQL Server", "default_port": 1433},
        ]
    }
