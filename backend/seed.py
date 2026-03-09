"""
Script para criar o primeiro usuário admin no banco.
Execute uma vez após configurar o .env:

  python seed.py
"""

import sys
import os
sys.path.append(os.path.dirname(__file__))

from app.database import SessionLocal, engine, Base
from app.models.user import User, UserRole
from app.core.security import hash_password

Base.metadata.create_all(bind=engine)

EMAIL = "admin@auditlgpd.com"
SENHA = "admin123"
NOME  = "Administrador"

db = SessionLocal()

existing = db.query(User).filter(User.email == EMAIL).first()
if existing:
    print(f"Usuário {EMAIL} já existe.")
else:
    user = User(
        name=NOME,
        email=EMAIL,
        hashed_password=hash_password(SENHA),
        role=UserRole.admin,
    )
    db.add(user)
    db.commit()
    print(f"✅ Usuário admin criado!")
    print(f"   E-mail: {EMAIL}")
    print(f"   Senha:  {SENHA}")
    print(f"\n⚠️  Troque a senha após o primeiro login!")

db.close()
