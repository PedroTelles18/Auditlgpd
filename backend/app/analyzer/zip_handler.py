"""
Processa arquivos .zip — extrai e analisa cada arquivo suportado dentro dele.
"""

import io
import zipfile
from app.analyzer.engine import CodeAnalyzer, FileAnalysisResult

SUPPORTED_EXTENSIONS = {".py", ".js", ".ts", ".jsx", ".tsx"}
MAX_FILE_SIZE = 500 * 1024  # 500 KB por arquivo
MAX_FILES_IN_ZIP = 50


def analyze_zip(zip_bytes: bytes, zip_filename: str) -> list[FileAnalysisResult]:
    """Extrai um ZIP e analisa todos os arquivos de código suportados."""
    analyzer = CodeAnalyzer()
    results = []

    with zipfile.ZipFile(io.BytesIO(zip_bytes)) as zf:
        code_files = [
            name for name in zf.namelist()
            if any(name.endswith(ext) for ext in SUPPORTED_EXTENSIONS)
            and not any(skip in name for skip in ["node_modules/", "__pycache__/", ".git/", "venv/", ".venv/"])
        ]

        if not code_files:
            from datetime import datetime, timezone
            return [FileAnalysisResult(
                filename=zip_filename,
                language="zip",
                total_lines=0,
                analyzed_at=datetime.now(timezone.utc).isoformat(),
                error="Nenhum arquivo de código suportado encontrado dentro do ZIP.",
            )]

        for name in code_files[:MAX_FILES_IN_ZIP]:
            info = zf.getinfo(name)
            if info.file_size > MAX_FILE_SIZE:
                continue

            try:
                content = zf.read(name).decode("utf-8", errors="replace")
                result = analyzer.analyze_content(name, content)
                results.append(result)
            except Exception as e:
                from datetime import datetime, timezone
                results.append(FileAnalysisResult(
                    filename=name,
                    language="unknown",
                    total_lines=0,
                    analyzed_at=datetime.now(timezone.utc).isoformat(),
                    error=str(e),
                ))

    return results
