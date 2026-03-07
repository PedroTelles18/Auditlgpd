from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.database import engine, Base
from app.routers import auth, analyze

# Cria tabelas no banco na inicialização
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="Privyon API",
    description="Backend do sistema de auditoria LGPD para infraestrutura de TI",
    version="1.0.0",
)

# CORS — aceita qualquer subdomínio do Vercel + URL configurada
origins = [
    settings.FRONTEND_URL,
    "https://auditlgpd.vercel.app",
    "https://privyon.com.br",
    "https://www.privyon.com.br",
    "http://localhost:3000",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_origin_regex=r"https://.*\.vercel\.app",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Rotas
app.include_router(auth.router)
app.include_router(analyze.router)


@app.get("/", tags=["Health"])
def health():
    return {"status": "ok", "app": "Privyon API v1.0"}
