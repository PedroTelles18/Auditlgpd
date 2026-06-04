# backend/app/main.py
# Adicione as duas linhas marcadas com  ← ADD  ao seu main.py existente

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.database import engine, Base
from app.routers import auth, analyze, db_audit, reports, history
from app.routers import admin          # ← ADD

Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="Privyon API",
    description="Backend do sistema de auditoria LGPD para infraestrutura de TI",
    version="1.0.0",
)

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

app.include_router(auth.router)
app.include_router(analyze.router)
app.include_router(db_audit.router)
app.include_router(reports.router)
app.include_router(history.router)
app.include_router(admin.router)      # ← ADD


@app.get("/", tags=["Health"])
def health():
    return {"status": "ok", "app": "Privyon API v1.0"}
