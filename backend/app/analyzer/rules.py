"""
Padrões de detecção LGPD para análise de código-fonte.
Cada regra tem: id, tipo, severidade, descrição e padrão regex.
"""

import re
from dataclasses import dataclass
from typing import Optional


@dataclass
class Rule:
    id: str
    type: str
    severity: str  # critical | high | medium | low
    description: str
    pattern: re.Pattern
    recommendation: str


# ── Regras LGPD ───────────────────────────────────────────────────────────────

RULES: list[Rule] = [

    # ── Logs com dados pessoais ──────────────────────────────────────────────
    Rule(
        id="LGPD-001",
        type="LOG_DADOS_PESSOAIS",
        severity="critical",
        description="Log contendo possível dado pessoal (CPF, e-mail, nome, telefone) sem anonimização.",
        pattern=re.compile(
            r'(log|logger|print|console\.log)\s*[\.(].*'
            r'(cpf|email|e-mail|nome|telefone|celular|senha|password|rg|cnpj)',
            re.IGNORECASE,
        ),
        recommendation="Anonimize ou remova dados pessoais de logs. Use máscaras como '***' ou hashes.",
    ),

    # ── Query SQL com concatenação ───────────────────────────────────────────
    Rule(
        id="LGPD-002",
        type="SQL_INJECTION_DADOS_PESSOAIS",
        severity="critical",
        description="Query SQL construída com concatenação de string — risco de SQL Injection e exposição de dados pessoais.",
        pattern=re.compile(
            r'(SELECT|INSERT|UPDATE|DELETE).*'
            r'(\+\s*[a-zA-Z_]+|\"\s*\+|\'\s*\+|f\".*\{|f\'.*\{)',
            re.IGNORECASE,
        ),
        recommendation="Use queries parametrizadas (prepared statements) ao invés de concatenação de strings.",
    ),

    # ── Secrets hardcoded ────────────────────────────────────────────────────
    Rule(
        id="LGPD-003",
        type="SECRET_HARDCODED",
        severity="high",
        description="Chave de API, senha ou segredo encontrado diretamente no código-fonte.",
        pattern=re.compile(
            r'(api_key|apikey|secret|password|passwd|token|jwt_secret|private_key)\s*=\s*["\'][^"\']{8,}["\']',
            re.IGNORECASE,
        ),
        recommendation="Mova segredos para variáveis de ambiente (.env) e nunca os commite no repositório.",
    ),

    # ── Export sem anonimização ──────────────────────────────────────────────
    Rule(
        id="LGPD-004",
        type="EXPORT_SEM_ANONIMIZACAO",
        severity="high",
        description="Exportação de dados (CSV, JSON, Excel) sem evidência de anonimização dos dados pessoais.",
        pattern=re.compile(
            r'(to_csv|to_excel|to_json|json\.dump|open\(.*w).*'
            r'(usuario|user|cliente|client|cpf|email|pessoal|personal)',
            re.IGNORECASE,
        ),
        recommendation="Aplique anonimização ou pseudonimização antes de exportar dados pessoais (Art. 12 LGPD).",
    ),

    # ── Dados pessoais sem criptografia ─────────────────────────────────────
    Rule(
        id="LGPD-005",
        type="DADO_PESSOAL_SEM_CRIPTO",
        severity="high",
        description="Armazenamento ou transmissão de dado pessoal sensível sem criptografia aparente.",
        pattern=re.compile(
            r'(cpf|rg|cartao|card_number|numero_cartao|senha|password)\s*=\s*["\'][^"\']+["\']',
            re.IGNORECASE,
        ),
        recommendation="Criptografe dados pessoais sensíveis em repouso e em trânsito (Art. 46 LGPD).",
    ),

    # ── Retenção indefinida ──────────────────────────────────────────────────
    Rule(
        id="LGPD-006",
        type="RETENCAO_SEM_PRAZO",
        severity="medium",
        description="Inserção de dados pessoais sem campo de data de expiração ou prazo de retenção.",
        pattern=re.compile(
            r'INSERT\s+INTO\s+\w+\s*\((?!.*expir|.*retenc|.*validade|.*prazo).*'
            r'(cpf|email|nome|telefone)',
            re.IGNORECASE,
        ),
        recommendation="Inclua campo de data de expiração ou política de retenção para dados pessoais (Art. 15 LGPD).",
    ),

    # ── Acesso sem autenticação ──────────────────────────────────────────────
    Rule(
        id="LGPD-007",
        type="ROTA_SEM_AUTENTICACAO",
        severity="medium",
        description="Rota ou endpoint que retorna dados pessoais sem verificação de autenticação.",
        pattern=re.compile(
            r'@(app|router)\.(get|post|put|delete)\s*\([^)]*\)\s*\n'
            r'(?!.*auth|.*login|.*token|.*jwt|.*require)',
            re.IGNORECASE,
        ),
        recommendation="Proteja endpoints que retornam dados pessoais com autenticação e autorização adequadas.",
    ),

    # ── CPF/RG em texto plano ────────────────────────────────────────────────
    Rule(
        id="LGPD-008",
        type="DOCUMENTO_TEXTO_PLANO",
        severity="medium",
        description="Número de CPF ou RG encontrado em texto plano no código.",
        pattern=re.compile(
            r'\b\d{3}[\.\-]?\d{3}[\.\-]?\d{3}[\-]?\d{2}\b',
        ),
        recommendation="Remova documentos reais do código. Use dados fictícios em testes e máscaras em produção.",
    ),

    # ── Debug com dados pessoais ─────────────────────────────────────────────
    Rule(
        id="LGPD-009",
        type="DEBUG_DADOS_PESSOAIS",
        severity="low",
        description="Instrução de debug (print/console.log) que pode expor dados pessoais em produção.",
        pattern=re.compile(
            r'(print|console\.log|console\.debug|pprint)\s*\(.*'
            r'(user|usuario|cliente|cpf|email|senha|dados)',
            re.IGNORECASE,
        ),
        recommendation="Remova ou substitua instruções de debug por logging estruturado com níveis adequados.",
    ),

    # ── Comentário com dado pessoal ──────────────────────────────────────────
    Rule(
        id="LGPD-010",
        type="DADO_PESSOAL_EM_COMENTARIO",
        severity="low",
        description="Possível dado pessoal encontrado em comentário de código.",
        pattern=re.compile(
            r'(#|\/\/|\/\*).*'
            r'(cpf|email|telefone|senha|password|rg)\s*[:\=]\s*\S+',
            re.IGNORECASE,
        ),
        recommendation="Remova dados pessoais reais de comentários. Use exemplos fictícios na documentação.",
    ),
]

# Mapa rápido por ID
RULES_BY_ID = {r.id: r for r in RULES}
