from pydantic import BaseModel
from typing import Optional


class FindingOut(BaseModel):
    rule_id: str
    type: str
    severity: str
    description: str
    line: int
    column: int
    code_snippet: str
    recommendation: str
    analyzer: str


class FileAnalysisOut(BaseModel):
    filename: str
    language: str
    total_lines: int
    analyzed_at: str
    total_findings: int
    findings: list[FindingOut]
    error: Optional[str] = None


class AnalysisSummary(BaseModel):
    total_files: int
    total_findings: int
    critical: int
    high: int
    medium: int
    low: int
    results: list[FileAnalysisOut]
