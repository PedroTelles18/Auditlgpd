"""
Integração com Groq API — análise contextualizada de findings LGPD.
Usa o modelo Llama 3.3 70B para gerar recomendações detalhadas.
"""

import os
import json
import httpx
from typing import Optional
from app.config import settings


GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions"
GROQ_MODEL = "llama-3.3-70b-versatile"

SYSTEM_PROMPT = """Você é um especialista em LGPD (Lei Geral de Proteção de Dados) e segurança de software.
Sua função é analisar trechos de código-fonte e identificar violações à LGPD, explicando:
1. O risco específico para os titulares de dados
2. O artigo da LGPD que está sendo violado
3. Como corrigir o problema com exemplo de código

Responda SEMPRE em português brasileiro, de forma técnica mas clara.
Seja direto e objetivo. Máximo 200 palavras por análise."""


async def analyze_with_groq(
    code_snippet: str,
    finding_type: str,
    filename: str,
    line: int,
) -> Optional[str]:
    """
    Envia um trecho de código suspeito para o Groq e retorna análise detalhada.
    Retorna None se a API não estiver disponível.
    """
    api_key = getattr(settings, "GROQ_API_KEY", None)
    if not api_key:
        return None

    prompt = f"""Analise este trecho de código encontrado no arquivo `{filename}` (linha {line}):

```
{code_snippet}
```

Tipo de violação detectada: **{finding_type}**

Explique:
1. Qual o risco LGPD específico neste código
2. Qual artigo da LGPD é violado
3. Como corrigir (com exemplo de código corrigido)"""

    payload = {
        "model": GROQ_MODEL,
        "messages": [
            {"role": "system", "content": SYSTEM_PROMPT},
            {"role": "user", "content": prompt},
        ],
        "max_tokens": 400,
        "temperature": 0.3,
    }

    try:
        async with httpx.AsyncClient(timeout=15.0) as client:
            response = await client.post(
                GROQ_API_URL,
                headers={
                    "Authorization": f"Bearer {api_key}",
                    "Content-Type": "application/json",
                },
                json=payload,
            )
            response.raise_for_status()
            data = response.json()
            return data["choices"][0]["message"]["content"]
    except Exception as e:
        print(f"[Groq] Erro na análise: {e}")
        return None


async def generate_summary_report(
    filename: str,
    total_findings: int,
    critical: int,
    high: int,
    finding_types: list[str],
) -> Optional[str]:
    """
    Gera um resumo executivo do relatório de auditoria.
    """
    api_key = getattr(settings, "GROQ_API_KEY", None)
    if not api_key:
        return None

    prompt = f"""Gere um resumo executivo de auditoria LGPD para o arquivo `{filename}`:

- Total de problemas encontrados: {total_findings}
- Críticos: {critical}
- Altos: {high}
- Tipos de violações: {", ".join(set(finding_types))}

O resumo deve:
1. Avaliar o nível geral de conformidade (Crítico / Baixo / Médio / Alto)
2. Destacar os 2-3 riscos mais graves
3. Recomendar as ações prioritárias
4. Citar os artigos LGPD relevantes

Máximo 150 palavras. Tom profissional."""

    payload = {
        "model": GROQ_MODEL,
        "messages": [
            {"role": "system", "content": SYSTEM_PROMPT},
            {"role": "user", "content": prompt},
        ],
        "max_tokens": 300,
        "temperature": 0.2,
    }

    try:
        async with httpx.AsyncClient(timeout=15.0) as client:
            response = await client.post(
                GROQ_API_URL,
                headers={
                    "Authorization": f"Bearer {api_key}",
                    "Content-Type": "application/json",
                },
                json=payload,
            )
            response.raise_for_status()
            data = response.json()
            return data["choices"][0]["message"]["content"]
    except Exception as e:
        print(f"[Groq] Erro no sumário: {e}")
        return None
