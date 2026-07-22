from fastapi import APIRouter, Depends, HTTPException, status, Request, Form
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from typing import Optional

from app.database import get_db
from app.models.user import User
from app.schemas.user import Token, UserOut, UserCreate
from app.core.security import (
    hash_password,
    verify_password,
    create_access_token,
    get_current_user,
)
from app.services.audit import log_event
from app.services.turnstile import verify_turnstile  # ← ADD

router = APIRouter(prefix="/auth", tags=["Autenticação"])


@router.post("/login", response_model=Token)
def login(
    request: Request,
    form_data: OAuth2PasswordRequestForm = Depends(),
    captcha_token: Optional[str] = Form(None),  # ← ADD: vem do frontend junto com username/password
    db: Session = Depends(get_db),
):
    """Login com e-mail e senha. Retorna JWT."""

    # ← ADD: valida o captcha ANTES de qualquer consulta ao banco
    client_ip = request.client.host if request.client else None
    if not verify_turnstile(captcha_token, client_ip):
        log_event(
            db=db,
            event_type="user.login_failed",
            actor_id="00000000-0000-0000-0000-000000000000",
            actor_role=None,
            entity_type="user",
            metadata={"reason": "captcha_failed", "attempted_email": form_data.username},
            request=request,
        )
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Falha na verificação de segurança. Tente novamente.",
        )

    user = db.query(User).filter(User.email == form_data.username).first()

    if not user or not verify_password(form_data.password, user.hashed_password):
        # ← ADD: registra tentativa de login que falhou (importante para segurança)
        log_event(
            db=db,
            event_type="user.login_failed",
            actor_id=user.id if user else "00000000-0000-0000-0000-000000000000",
            actor_role=user.role if user else None,
            entity_type="user",
            entity_id=user.id if user else None,
            metadata={"attempted_email": form_data.username},
            request=request,
        )
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="E-mail ou senha incorretos",
        )

    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Usuário inativo. Contate o administrador.",
        )

    # ← ADD: registra login bem-sucedido
    log_event(
        db=db,
        event_type="user.login",
        actor_id=user.id,
        actor_role=user.role,
        entity_type="user",
        entity_id=user.id,
        request=request,
    )

    token = create_access_token({"sub": str(user.id)})
    return Token(access_token=token, user=UserOut.model_validate(user))


@router.get("/me", response_model=UserOut)
def get_me(current_user: User = Depends(get_current_user)):
    """Retorna dados do usuário autenticado."""
    return current_user


@router.post("/register", response_model=UserOut, status_code=201)
def register(
    data: UserCreate,
    request: Request,  # ← ADD
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Cria novo usuário. Restrito a administradores."""
    if current_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Apenas administradores podem criar contas.",
        )

    existing = db.query(User).filter(User.email == data.email).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="E-mail já cadastrado",
        )

    user = User(
        name=data.name,
        email=data.email,
        hashed_password=hash_password(data.password),
        role=data.role,
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    # ← ADD: registra criação de usuário (quem criou, quem foi criado, com qual role)
    log_event(
        db=db,
        event_type="user.created",
        actor_id=current_user.id,
        actor_role=current_user.role,
        entity_type="user",
        entity_id=user.id,
        payload_after={"name": user.name, "email": user.email, "role": user.role},
        request=request,
    )

    return user
