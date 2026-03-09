# ============================================================
#  AuditLGPD ? Setup Backend (Windows)
#  Execute na pasta: auditlgpd/backend
# ============================================================

$ErrorActionPreference = "Stop"

Write-Host "`n  Backend AuditLGPD ? Setup" -ForegroundColor Cyan
Write-Host "  -------------------------" -ForegroundColor Cyan

# 1. Verificar Python
Write-Host "`n>> Verificando Python..." -ForegroundColor Cyan
try {
    $v = python --version
    Write-Host "   OK: $v" -ForegroundColor Green
} catch {
    Write-Host "   ERRO: Python nao encontrado. Instale em https://python.org" -ForegroundColor Red
    exit 1
}

# 2. Criar virtualenv
Write-Host "`n>> Criando ambiente virtual..." -ForegroundColor Cyan
if (-not (Test-Path ".venv")) {
    python -m venv .venv
    Write-Host "   OK: .venv criado" -ForegroundColor Green
} else {
    Write-Host "   OK: .venv ja existe" -ForegroundColor Green
}

# 3. Ativar e instalar dependencias
Write-Host "`n>> Instalando dependencias..." -ForegroundColor Cyan
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt --quiet
Write-Host "   OK: dependencias instaladas" -ForegroundColor Green

# 4. Criar .env se nao existir
if (-not (Test-Path ".env")) {
    Copy-Item ".env.example" ".env"
    Write-Host "`n  ATENCAO: Arquivo .env criado a partir do .env.example" -ForegroundColor Yellow
    Write-Host "  ATENCAO: EDITE o .env com sua DATABASE_URL e SECRET_KEY antes de continuar!" -ForegroundColor Yellow
    Write-Host "`n  Pressione Enter apos editar o .env..."
    Read-Host
}

# 5. Criar tabelas e seed
Write-Host "`n>> Criando tabelas e usuario admin..." -ForegroundColor Cyan
python seed.py

# 6. Iniciar servidor
Write-Host ""
Write-Host "  +------------------------------------+" -ForegroundColor Green
Write-Host "  |   Backend rodando!                  |" -ForegroundColor Green
Write-Host "  |   API:  http://localhost:8000       |" -ForegroundColor Green
Write-Host "  |   Docs: http://localhost:8000/docs  |" -ForegroundColor Green
Write-Host "  +------------------------------------+" -ForegroundColor Green
Write-Host ""

uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
