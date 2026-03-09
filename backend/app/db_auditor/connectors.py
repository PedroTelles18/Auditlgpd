"""
Conectores para diferentes bancos de dados.
Extrai o schema (tabelas, colunas, índices, FK) para análise LGPD.
"""

from typing import List, Dict, Any, Optional
from dataclasses import dataclass


@dataclass
class ConnectionConfig:
    db_type: str  # postgresql, mysql, sqlite, sqlserver
    host: Optional[str] = None
    port: Optional[int] = None
    database: str = ""
    username: Optional[str] = None
    password: Optional[str] = None
    connection_string: Optional[str] = None  # alternativa à config manual


class DBConnectorError(Exception):
    pass


def get_schema(config: ConnectionConfig) -> Dict[str, Any]:
    """
    Conecta ao banco e retorna o schema completo.
    Retorna: {tables, indexes, foreign_keys, db_name}
    """
    db_type = config.db_type.lower()

    if db_type == "postgresql":
        return _get_postgresql_schema(config)
    elif db_type == "mysql":
        return _get_mysql_schema(config)
    elif db_type == "sqlite":
        return _get_sqlite_schema(config)
    elif db_type in ("sqlserver", "mssql"):
        return _get_sqlserver_schema(config)
    else:
        raise DBConnectorError(f"Banco não suportado: {db_type}")


def _get_postgresql_schema(config: ConnectionConfig) -> Dict[str, Any]:
    try:
        import psycopg2
    except ImportError:
        raise DBConnectorError("psycopg2 não instalado. Adicione ao requirements.txt.")

    try:
        conn_str = config.connection_string or (
            f"host={config.host} port={config.port or 5432} "
            f"dbname={config.database} user={config.username} password={config.password}"
        )
        conn = psycopg2.connect(conn_str)
        cursor = conn.cursor()

        # Tabelas e colunas
        cursor.execute("""
            SELECT 
                t.table_name,
                c.column_name,
                c.data_type,
                c.is_nullable
            FROM information_schema.tables t
            JOIN information_schema.columns c 
                ON t.table_name = c.table_name 
                AND t.table_schema = c.table_schema
            WHERE t.table_schema = 'public'
                AND t.table_type = 'BASE TABLE'
            ORDER BY t.table_name, c.ordinal_position
        """)
        rows = cursor.fetchall()

        # Índices
        cursor.execute("""
            SELECT 
                t.relname AS table_name,
                a.attname AS column_name,
                i.relname AS index_name
            FROM pg_class t
            JOIN pg_index ix ON t.oid = ix.indrelid
            JOIN pg_class i ON i.oid = ix.indexrelid
            JOIN pg_attribute a ON a.attrelid = t.oid AND a.attnum = ANY(ix.indkey)
            JOIN pg_namespace n ON n.oid = t.relnamespace
            WHERE n.nspname = 'public'
        """)
        indexes = [{"table_name": r[0], "column_name": r[1], "index_name": r[2]} for r in cursor.fetchall()]

        # Foreign keys
        cursor.execute("""
            SELECT
                tc.table_name,
                kcu.column_name,
                rc.delete_rule AS on_delete
            FROM information_schema.table_constraints tc
            JOIN information_schema.key_column_usage kcu
                ON tc.constraint_name = kcu.constraint_name
            JOIN information_schema.referential_constraints rc
                ON tc.constraint_name = rc.constraint_name
            WHERE tc.constraint_type = 'FOREIGN KEY'
                AND tc.table_schema = 'public'
        """)
        fks = [{"table_name": r[0], "column_name": r[1], "on_delete": r[2]} for r in cursor.fetchall()]

        conn.close()
        return _build_schema(rows, indexes, fks, config.database, "postgresql")

    except Exception as e:
        raise DBConnectorError(f"Erro ao conectar ao PostgreSQL: {str(e)}")


def _get_mysql_schema(config: ConnectionConfig) -> Dict[str, Any]:
    try:
        import pymysql
    except ImportError:
        raise DBConnectorError("pymysql não instalado. Adicione 'pymysql' ao requirements.txt.")

    try:
        conn = pymysql.connect(
            host=config.host,
            port=config.port or 3306,
            database=config.database,
            user=config.username,
            password=config.password,
        )
        cursor = conn.cursor()

        cursor.execute("""
            SELECT table_name, column_name, data_type, is_nullable
            FROM information_schema.columns
            WHERE table_schema = %s
            ORDER BY table_name, ordinal_position
        """, (config.database,))
        rows = cursor.fetchall()

        cursor.execute("""
            SELECT table_name, column_name, index_name
            FROM information_schema.statistics
            WHERE table_schema = %s
        """, (config.database,))
        indexes = [{"table_name": r[0], "column_name": r[1], "index_name": r[2]} for r in cursor.fetchall()]

        cursor.execute("""
            SELECT kcu.table_name, kcu.column_name, rc.delete_rule
            FROM information_schema.referential_constraints rc
            JOIN information_schema.key_column_usage kcu
                ON rc.constraint_name = kcu.constraint_name
            WHERE rc.constraint_schema = %s
        """, (config.database,))
        fks = [{"table_name": r[0], "column_name": r[1], "on_delete": r[2]} for r in cursor.fetchall()]

        conn.close()
        return _build_schema(rows, indexes, fks, config.database, "mysql")

    except Exception as e:
        raise DBConnectorError(f"Erro ao conectar ao MySQL: {str(e)}")


def _get_sqlite_schema(config: ConnectionConfig) -> Dict[str, Any]:
    try:
        import sqlite3
        db_path = config.database or config.connection_string
        conn = sqlite3.connect(db_path)
        cursor = conn.cursor()

        cursor.execute("SELECT name FROM sqlite_master WHERE type='table'")
        table_names = [r[0] for r in cursor.fetchall()]

        rows = []
        for tname in table_names:
            cursor.execute(f"PRAGMA table_info('{tname}')")
            for col in cursor.fetchall():
                rows.append((tname, col[1], col[2], "YES" if not col[3] else "NO"))

        indexes = []
        cursor.execute("SELECT tbl_name, name FROM sqlite_master WHERE type='index'")
        for r in cursor.fetchall():
            indexes.append({"table_name": r[0], "column_name": "", "index_name": r[1]})

        conn.close()
        return _build_schema(rows, indexes, [], config.database, "sqlite")

    except Exception as e:
        raise DBConnectorError(f"Erro ao conectar ao SQLite: {str(e)}")


def _get_sqlserver_schema(config: ConnectionConfig) -> Dict[str, Any]:
    try:
        import pyodbc
    except ImportError:
        raise DBConnectorError("pyodbc não instalado. Adicione 'pyodbc' ao requirements.txt.")

    try:
        conn_str = config.connection_string or (
            f"DRIVER={{ODBC Driver 17 for SQL Server}};"
            f"SERVER={config.host},{config.port or 1433};"
            f"DATABASE={config.database};"
            f"UID={config.username};PWD={config.password}"
        )
        conn = pyodbc.connect(conn_str)
        cursor = conn.cursor()

        cursor.execute("""
            SELECT TABLE_NAME, COLUMN_NAME, DATA_TYPE, IS_NULLABLE
            FROM INFORMATION_SCHEMA.COLUMNS
            WHERE TABLE_CATALOG = ?
            ORDER BY TABLE_NAME, ORDINAL_POSITION
        """, config.database)
        rows = cursor.fetchall()

        cursor.execute("""
            SELECT t.name, c.name, i.name
            FROM sys.indexes i
            JOIN sys.index_columns ic ON i.object_id = ic.object_id AND i.index_id = ic.index_id
            JOIN sys.columns c ON ic.object_id = c.object_id AND ic.column_id = c.column_id
            JOIN sys.tables t ON i.object_id = t.object_id
        """)
        indexes = [{"table_name": r[0], "column_name": r[1], "index_name": r[2]} for r in cursor.fetchall()]

        cursor.execute("""
            SELECT 
                fk.parent_object_id,
                COL_NAME(fkc.parent_object_id, fkc.parent_column_id),
                fk.delete_referential_action_desc
            FROM sys.foreign_keys fk
            JOIN sys.foreign_key_columns fkc ON fk.object_id = fkc.constraint_object_id
        """)
        fks = [{"table_name": str(r[0]), "column_name": r[1], "on_delete": r[2]} for r in cursor.fetchall()]

        conn.close()
        return _build_schema(rows, indexes, fks, config.database, "sqlserver")

    except Exception as e:
        raise DBConnectorError(f"Erro ao conectar ao SQL Server: {str(e)}")


def _build_schema(
    rows: List,
    indexes: List[Dict],
    foreign_keys: List[Dict],
    db_name: str,
    db_type: str,
) -> Dict[str, Any]:
    """Agrupa linhas de colunas por tabela."""
    tables_map: Dict[str, List] = {}
    for row in rows:
        tname, col_name, col_type, nullable = row
        if tname not in tables_map:
            tables_map[tname] = []
        tables_map[tname].append({
            "name": col_name,
            "type": col_type,
            "nullable": nullable,
        })

    tables = [
        {"table_name": tname, "columns": cols}
        for tname, cols in tables_map.items()
    ]

    return {
        "db_name": db_name,
        "db_type": db_type,
        "tables": tables,
        "indexes": indexes,
        "foreign_keys": foreign_keys,
    }
