"""
Regras LGPD para auditoria de bancos de dados.
Detecta padrões de colunas/tabelas que indicam dados pessoais sem proteção adequada.
"""

from dataclasses import dataclass
from typing import List
import re

@dataclass
class DBRule:
    id: str
    name: str
    description: str
    severity: str  # critical, high, medium, low
    article: str   # Artigo da LGPD relacionado


# Palavras-chave que indicam dados pessoais em nomes de colunas
PERSONAL_DATA_COLUMNS = [
    "cpf", "cnpj", "rg", "passaporte", "passport",
    "nome", "name", "sobrenome", "lastname",
    "email", "e_mail", "mail",
    "telefone", "phone", "celular", "mobile", "fone",
    "endereco", "address", "logradouro", "cep", "zipcode",
    "nascimento", "birth", "idade", "age",
    "sexo", "genero", "gender",
    "senha", "password", "pass", "pwd",
    "cartao", "card", "credito", "credit",
    "salario", "salary", "renda", "income",
    "religiao", "religion",
    "etnia", "raca", "race",
    "saude", "health", "diagnostico", "diagnosis",
    "biometria", "biometric",
    "ip_address", "ip_addr", "user_agent",
]

# Palavras-chave que indicam criptografia
ENCRYPTION_KEYWORDS = [
    "hash", "crypt", "encrypted", "hashed", "bcrypt",
    "argon", "sha", "md5", "encoded", "cipher"
]

# Palavras-chave que indicam tabelas com dados pessoais
SENSITIVE_TABLE_NAMES = [
    "user", "usuario", "cliente", "customer", "person", "pessoa",
    "funcionario", "employee", "paciente", "patient",
    "pagamento", "payment", "cartao", "card",
    "saude", "health", "medico", "medical",
    "auditoria", "log", "acesso", "access",
]

DB_RULES = [
    DBRule(
        id="DB-001",
        name="COLUNA_PESSOAL_SEM_CRIPTOGRAFIA",
        description="Coluna com dados pessoais identificada sem indicação de criptografia",
        severity="critical",
        article="Art. 46 LGPD — Segurança no tratamento de dados pessoais"
    ),
    DBRule(
        id="DB-002",
        name="SENHA_TEXTO_PLANO",
        description="Coluna de senha sem hash/criptografia detectada",
        severity="critical",
        article="Art. 46 LGPD — Medidas técnicas de segurança obrigatórias"
    ),
    DBRule(
        id="DB-003",
        name="SEM_LOG_AUDITORIA",
        description="Tabela com dados pessoais sem tabela de log/auditoria correspondente",
        severity="high",
        article="Art. 37 LGPD — Registro das operações de tratamento"
    ),
    DBRule(
        id="DB-004",
        name="SEM_CAMPO_CONSENTIMENTO",
        description="Tabela de usuários sem campo de consentimento/termos",
        severity="high",
        article="Art. 7 e Art. 8 LGPD — Consentimento do titular"
    ),
    DBRule(
        id="DB-005",
        name="SEM_DATA_EXCLUSAO",
        description="Tabela com dados pessoais sem campo de data de exclusão ou expiração",
        severity="medium",
        article="Art. 15 e Art. 16 LGPD — Término do tratamento e eliminação"
    ),
    DBRule(
        id="DB-006",
        name="DADO_SENSIVEL_EXPOSTO",
        description="Dado sensível (saúde, biometria, etnia) armazenado sem proteção extra",
        severity="critical",
        article="Art. 11 LGPD — Tratamento de dados pessoais sensíveis"
    ),
    DBRule(
        id="DB-007",
        name="SEM_SOFT_DELETE",
        description="Tabela com dados pessoais sem mecanismo de exclusão lógica",
        severity="medium",
        article="Art. 18 LGPD — Direito à eliminação pelo titular"
    ),
    DBRule(
        id="DB-008",
        name="INDICE_EXPOSTO",
        description="Índice criado sobre coluna de dado pessoal sensível (pode expor via timing attack)",
        severity="low",
        article="Art. 46 LGPD — Segurança no tratamento"
    ),
    DBRule(
        id="DB-009",
        name="TABELA_SEM_TIMESTAMPS",
        description="Tabela com dados pessoais sem campos de data de criação/atualização",
        severity="low",
        article="Art. 37 LGPD — Registro das operações"
    ),
    DBRule(
        id="DB-010",
        name="FOREIGN_KEY_SEM_CASCATA",
        description="Dados pessoais vinculados sem ON DELETE CASCADE — pode impedir exclusão total",
        severity="medium",
        article="Art. 18 LGPD — Direito à portabilidade e eliminação"
    ),
]

RULES_BY_ID = {rule.id: rule for rule in DB_RULES}
