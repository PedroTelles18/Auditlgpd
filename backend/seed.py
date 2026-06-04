# backend/seed.py  (substitui o original)
"""
Cria o usuário admin padrão do Privyon.
Execute uma vez após configurar o .env:

  python seed.py
"""

import sys, os
sys.path.append(os.path.dirname(__file__))

from app.database import SessionLocal, engine, Base
from app.models.user import User, UserRole, AVAILABLE_MODULES
from app.core.security import hash_password

Base.metadata.create_all(bind=engine)

EMAIL = "admin@privyon.com"
SENHA = "admin@admin"
NOME  = "Administrador Privyon"

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
        plan="enterprise",
        allowed_modules=AVAILABLE_MODULES,  # admin tem acesso a tudo
    )
    db.add(user)
    db.commit()
    print(f"✅ Usuário admin criado!")
    print(f"   E-mail : {EMAIL}")
    print(f"   Senha  : {SENHA}")
    print(f"\n⚠️  Troque a senha após o primeiro login!")

db.close()
