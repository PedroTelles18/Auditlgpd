# backend/app/routers/admin.py
# ARQUIVO NOVO — adicione no main.py: app.include_router(admin.router)

import sys
import platform
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, status, Query, Request
from sqlalchemy.orm import Session
from sqlalchemy import func as sa_func, text
from typing import List, Optional
from uuid import UUID

from app.database import get_db
from app.models.user import User, UserRole, AVAILABLE_MODULES, PLANS
from app.models.audit_log import AuditLog  # ← ADD
from app.schemas.user import UserCreate, UserUpdate, UserOut, UserResetPassword, ModulesMeta
from app.core.security import (
    hash_password,
    get_current_user,
    require_admin,
    require_security_admin,  # ← ADD
)
from app.services.audit import log_event  # ← ADD
from app.config import settings  # ← ADD

router = APIRouter(prefix="/admin", tags=["Admin"])


# ── Helpers ───────────────────────────────────────────────

def resolve_modules(plan: str, allowed_modules: Optional[List[str]]) -> List[str]:
    """
    Resolve a lista final de módulos baseado no plano.
    - Se plan != 'custom': usa os módulos do plano predefinido.
    - Se plan == 'custom': usa a lista manual (allowed_modules).
    """
    if plan == "custom":
        if not allowed_modules:
            raise HTTPException(
                status_code=400,
                detail="Plano 'custom' exige a lista de módulos (allowed_modules)."
            )
        invalid = [m for m in allowed_modules if m not in AVAILABLE_MODULES]
        if invalid:
            raise HTTPException(
                status_code=400,
                detail=f"Módulos inválidos: {invalid}. Disponíveis: {AVAILABLE_MODULES}"
            )
        return allowed_modules
    if plan not in PLANS:
        raise HTTPException(status_code=400, detail=f"Plano inválido: {plan}. Opções: {list(PLANS.keys())}")
    return PLANS[plan]


# ── Meta ─────────────────────────────────────────────────

@router.get("/meta", response_model=ModulesMeta)
def get_meta(_: User = Depends(require_admin)):
    """Retorna os módulos disponíveis e planos predefinidos para o front montar os forms."""
    return ModulesMeta(available_modules=AVAILABLE_MODULES, plans=PLANS)


# ── Listar usuários ───────────────────────────────────────

@router.get("/users", response_model=List[UserOut])
def list_users(
    search:    Optional[str]  = Query(None, description="Busca por nome ou email"),
    role:      Optional[str]  = Query(None, description="Filtrar por role"),
    is_active: Optional[bool] = Query(None, description="Filtrar por ativo/inativo"),
    plan:      Optional[str]  = Query(None, description="Filtrar por plano"),
    skip:      int            = Query(0,    ge=0),
    limit:     int            = Query(50,   le=200),
    db:        Session        = Depends(get_db),
    _:         User           = Depends(require_admin),
):
    q = db.query(User)
    if search:
        term = f"%{search}%"
        q = q.filter((User.name.ilike(term)) | (User.email.ilike(term)))
    if role:
        q = q.filter(User.role == role)
    if is_active is not None:
        q = q.filter(User.is_active == is_active)
    if plan:
        q = q.filter(User.plan == plan)
    return q.order_by(User.created_at.desc()).offset(skip).limit(limit).all()


# ── Criar usuário ─────────────────────────────────────────

@router.post("/users", response_model=UserOut, status_code=201)
def create_user(
    data: UserCreate,
    request: Request,
    db:   Session = Depends(get_db),
    current: User = Depends(require_admin),
):
    existing = db.query(User).filter(User.email == data.email).first()
    if existing:
        raise HTTPException(status_code=400, detail="E-mail já cadastrado.")

    modules = resolve_modules(data.plan, data.allowed_modules)

    user = User(
        name=data.name,
        email=data.email,
        hashed_password=hash_password(data.password),
        role=data.role,
        plan=data.plan,
        allowed_modules=modules,
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    log_event(
        db=db,
        event_type="user.created",
        actor_id=current.id,
        actor_role=current.role,
        entity_type="user",
        entity_id=user.id,
        payload_after={"name": user.name, "email": user.email, "role": user.role, "plan": user.plan},
        request=request,
    )

    return user


# ── Buscar usuário por ID ─────────────────────────────────

@router.get("/users/{user_id}", response_model=UserOut)
def get_user(
    user_id: UUID,
    db:      Session = Depends(get_db),
    _:       User    = Depends(require_admin),
):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="Usuário não encontrado.")
    return user


# ── Editar usuário ────────────────────────────────────────

@router.patch("/users/{user_id}", response_model=UserOut)
def update_user(
    user_id: UUID,
    data:    UserUpdate,
    request: Request,
    db:      Session = Depends(get_db),
    current: User    = Depends(require_admin),
):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="Usuário não encontrado.")

    before = {"name": user.name, "email": user.email, "role": user.role, "is_active": user.is_active, "plan": user.plan}
    role_before = user.role

    if data.name       is not None: user.name      = data.name
    if data.email      is not None:
        dup = db.query(User).filter(User.email == data.email, User.id != user_id).first()
        if dup:
            raise HTTPException(status_code=400, detail="E-mail já em uso por outro usuário.")
        user.email = data.email
    if data.role       is not None: user.role      = data.role
    if data.is_active  is not None: user.is_active = data.is_active

    new_plan    = data.plan            if data.plan            is not None else user.plan
    new_modules = data.allowed_modules if data.allowed_modules is not None else None

    if data.plan is not None or data.allowed_modules is not None:
        user.plan            = new_plan
        user.allowed_modules = resolve_modules(new_plan, new_modules or (user.allowed_modules if new_plan == "custom" else None))

    db.commit()
    db.refresh(user)

    log_event(
        db=db,
        event_type="user.updated",
        actor_id=current.id,
        actor_role=current.role,
        entity_type="user",
        entity_id=user.id,
        payload_before=before,
        payload_after={"name": user.name, "email": user.email, "role": user.role, "is_active": user.is_active, "plan": user.plan},
        request=request,
    )

    if data.role is not None and data.role != role_before:
        log_event(
            db=db,
            event_type="user.role_changed",
            actor_id=current.id,
            actor_role=current.role,
            entity_type="user",
            entity_id=user.id,
            payload_before={"role": role_before},
            payload_after={"role": user.role},
            request=request,
        )

    return user


# ── Ativar / Desativar ────────────────────────────────────

@router.patch("/users/{user_id}/toggle-active", response_model=UserOut)
def toggle_active(
    user_id: UUID,
    request: Request,
    db:      Session = Depends(get_db),
    current: User    = Depends(require_admin),
):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="Usuário não encontrado.")
    if str(user.id) == str(current.id):
        raise HTTPException(status_code=400, detail="Você não pode desativar sua própria conta.")

    was_active = user.is_active
    user.is_active = not user.is_active
    db.commit()
    db.refresh(user)

    log_event(
        db=db,
        event_type="user.deactivated" if was_active else "user.reactivated",
        actor_id=current.id,
        actor_role=current.role,
        entity_type="user",
        entity_id=user.id,
        payload_before={"is_active": was_active},
        payload_after={"is_active": user.is_active},
        request=request,
    )

    return user


# ── Reset de senha ────────────────────────────────────────

@router.patch("/users/{user_id}/reset-password", response_model=UserOut)
def reset_password(
    user_id: UUID,
    data:    UserResetPassword,
    request: Request,
    db:      Session = Depends(get_db),
    current: User = Depends(require_admin),
):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="Usuário não encontrado.")
    if len(data.new_password) < 6:
        raise HTTPException(status_code=400, detail="Senha deve ter pelo menos 6 caracteres.")
    user.hashed_password = hash_password(data.new_password)
    db.commit()
    db.refresh(user)

    log_event(
        db=db,
        event_type="user.password_changed",
        actor_id=current.id,
        actor_role=current.role,
        entity_type="user",
        entity_id=user.id,
        metadata={"reset_by_admin": True},
        request=request,
    )

    return user


# ── Histórico de auditorias do usuário ───────────────────

@router.get("/users/{user_id}/history")
def get_user_history(
    user_id: UUID,
    skip:    int     = Query(0,  ge=0),
    limit:   int     = Query(20, le=100),
    db:      Session = Depends(get_db),
    _:       User    = Depends(require_admin),
):
    from app.models.audit_history import AuditHistory  # import local p/ evitar circular

    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="Usuário não encontrado.")

    history = (
        db.query(AuditHistory)
        .filter(AuditHistory.user_id == user_id)
        .order_by(AuditHistory.created_at.desc())
        .offset(skip)
        .limit(limit)
        .all()
    )
    return history


# ══════════════════════════════════════════════════════════
# ← ADD: NOVO BLOCO — RBAC granular para TI/segurança do cliente
# Esses endpoints usam require_security_admin, NÃO require_admin.
# Ou seja: um "admin" de negócio comum não acessa isso por padrão,
# só quem tiver a flag is_security_admin concedida explicitamente.
# ══════════════════════════════════════════════════════════

# ── Conceder / revogar acesso de segurança (só admin de negócio pode) ──

@router.patch("/users/{user_id}/security-admin", response_model=UserOut)
def toggle_security_admin(
    user_id: UUID,
    request: Request,
    db:      Session = Depends(get_db),
    current: User    = Depends(require_admin),  # decisão de negócio: só admin concede
):
    """Concede ou revoga acesso ao painel de debug/logs técnicos para um usuário."""
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="Usuário não encontrado.")

    was_security_admin = user.is_security_admin
    user.is_security_admin = not user.is_security_admin
    db.commit()
    db.refresh(user)

    log_event(
        db=db,
        event_type="user.security_admin_granted" if user.is_security_admin else "user.security_admin_revoked",
        actor_id=current.id,
        actor_role=current.role,
        entity_type="user",
        entity_id=user.id,
        payload_before={"is_security_admin": was_security_admin},
        payload_after={"is_security_admin": user.is_security_admin},
        request=request,
    )

    return user


# ── Listar entradas do audit_log (só TI/segurança) ────────

@router.get("/audit-log")
def list_audit_log(
    request: Request,
    event_type: Optional[str] = Query(None, description="Filtrar por tipo de evento, ex: user.login"),
    actor_id:   Optional[UUID] = Query(None, description="Filtrar por quem realizou a ação"),
    entity_type: Optional[str] = Query(None, description="Filtrar por tipo de entidade afetada"),
    skip:  int = Query(0,   ge=0),
    limit: int = Query(50,  le=500),
    db:    Session = Depends(get_db),
    current: User = Depends(require_security_admin),
):
    """
    Lista entradas do audit_log para o time de TI/segurança do cliente auditar.
    Requer is_security_admin=True — não é o mesmo que ser admin de negócio.
    """
    q = db.query(AuditLog)
    if event_type:
        q = q.filter(AuditLog.event_type == event_type)
    if actor_id:
        q = q.filter(AuditLog.actor_id == actor_id)
    if entity_type:
        q = q.filter(AuditLog.entity_type == entity_type)

    total = q.count()
    records = q.order_by(AuditLog.created_at.desc()).offset(skip).limit(limit).all()

    # ← Acesso ao próprio painel de auditoria também vira log — auditoria de quem audita
    log_event(
        db=db,
        event_type="admin.audit_log_viewed",
        actor_id=current.id,
        actor_role=current.role,
        entity_type="audit_log",
        metadata={"filters": {"event_type": event_type, "entity_type": entity_type}, "result_count": len(records)},
        request=request,
    )

    return {
        "total": total,
        "skip": skip,
        "limit": limit,
        "results": [
            {
                "id": r.id,
                "event_type": r.event_type,
                "entity_type": r.entity_type,
                "entity_id": str(r.entity_id) if r.entity_id else None,
                "actor_id": str(r.actor_id),
                "actor_role": r.actor_role,
                "payload_before": r.payload_before,
                "payload_after": r.payload_after,
                "ip_origin": str(r.ip_origin) if r.ip_origin else None,
                "user_agent": r.user_agent,
                "metadata": r.audit_metadata,
                "created_at": r.created_at.isoformat() if r.created_at else None,
            }
            for r in records
        ],
    }


# ── Estatísticas rápidas do audit_log (dashboard do painel de TI) ──

@router.get("/audit-log/stats")
def audit_log_stats(
    db: Session = Depends(get_db),
    _: User = Depends(require_security_admin),
):
    """Contagem de eventos por tipo, para montar um resumo visual no painel de TI."""
    rows = (
        db.query(AuditLog.event_type, sa_func.count(AuditLog.id))
        .group_by(AuditLog.event_type)
        .order_by(sa_func.count(AuditLog.id).desc())
        .all()
    )
    return {"event_counts": {event_type: count for event_type, count in rows}}


# ── Painel de debug/info do sistema (só TI/segurança) ─────

@router.get("/debug-info")
def debug_info(
    request: Request,
    db: Session = Depends(get_db),
    current: User = Depends(require_security_admin),
):
    """
    Informações técnicas do backend para o time de TI do cliente inspecionar:
    versão do Python, status da conexão com o banco, feature flags ativas.
    NUNCA expõe segredos (chaves, senhas) — só booleanos indicando se estão configurados.
    """
    db_ok = True
    db_error = None
    try:
        db.execute(text("SELECT 1"))
    except Exception as e:
        db_ok = False
        db_error = str(e)

    info = {
        "app": "Privyon API",
        "python_version": sys.version,
        "platform": platform.platform(),
        "server_time_utc": datetime.now(timezone.utc).isoformat(),
        "database": {
            "connected": db_ok,
            "error": db_error,
        },
        "feature_flags": {
            "groq_ai_enabled": bool(settings.GROQ_API_KEY),
            "captcha_enabled": bool(getattr(settings, "TURNSTILE_SECRET_KEY", None)),
        },
    }

    # ← Acesso ao modo debug é sempre logado — item que a Alpargatas pediu explicitamente
    log_event(
        db=db,
        event_type="admin.debug_accessed",
        actor_id=current.id,
        actor_role=current.role,
        entity_type="system",
        metadata={"endpoint": "/admin/debug-info"},
        request=request,
    )

    return info
