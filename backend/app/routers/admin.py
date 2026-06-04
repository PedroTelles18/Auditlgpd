# backend/app/routers/admin.py
# ARQUIVO NOVO — adicione no main.py: app.include_router(admin.router)

from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from uuid import UUID

from app.database import get_db
from app.models.user import User, UserRole, AVAILABLE_MODULES, PLANS
from app.schemas.user import UserCreate, UserUpdate, UserOut, UserResetPassword, ModulesMeta
from app.core.security import hash_password, get_current_user, require_admin

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
    db:   Session = Depends(get_db),
    _:    User    = Depends(require_admin),
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
    db:      Session = Depends(get_db),
    current: User    = Depends(require_admin),
):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="Usuário não encontrado.")

    if data.name       is not None: user.name      = data.name
    if data.email      is not None:
        dup = db.query(User).filter(User.email == data.email, User.id != user_id).first()
        if dup:
            raise HTTPException(status_code=400, detail="E-mail já em uso por outro usuário.")
        user.email = data.email
    if data.role       is not None: user.role      = data.role
    if data.is_active  is not None: user.is_active = data.is_active

    # Atualiza plano / módulos
    new_plan    = data.plan            if data.plan            is not None else user.plan
    new_modules = data.allowed_modules if data.allowed_modules is not None else None

    if data.plan is not None or data.allowed_modules is not None:
        user.plan            = new_plan
        user.allowed_modules = resolve_modules(new_plan, new_modules or (user.allowed_modules if new_plan == "custom" else None))

    db.commit()
    db.refresh(user)
    return user


# ── Ativar / Desativar ────────────────────────────────────

@router.patch("/users/{user_id}/toggle-active", response_model=UserOut)
def toggle_active(
    user_id: UUID,
    db:      Session = Depends(get_db),
    current: User    = Depends(require_admin),
):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="Usuário não encontrado.")
    if str(user.id) == str(current.id):
        raise HTTPException(status_code=400, detail="Você não pode desativar sua própria conta.")
    user.is_active = not user.is_active
    db.commit()
    db.refresh(user)
    return user


# ── Reset de senha ────────────────────────────────────────

@router.patch("/users/{user_id}/reset-password", response_model=UserOut)
def reset_password(
    user_id: UUID,
    data:    UserResetPassword,
    db:      Session = Depends(get_db),
    _:       User    = Depends(require_admin),
):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="Usuário não encontrado.")
    if len(data.new_password) < 6:
        raise HTTPException(status_code=400, detail="Senha deve ter pelo menos 6 caracteres.")
    user.hashed_password = hash_password(data.new_password)
    db.commit()
    db.refresh(user)
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
