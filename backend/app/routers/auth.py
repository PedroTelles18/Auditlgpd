from fastapi import APIRouter, Depends, HTTPException, status, Request, Form
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from typing import Optional
from datetime import datetime, timedelta, timezone
from jose import JWTError, jwt

from app.database import get_db
from app.models.user import User, ACCENT_COLORS, THEME_MODES
from app.schemas.user import Token, UserOut, UserCreate, ThemeUpdate, ThemeMeta, ForgotPasswordRequest, ResetPasswordRequest  # ← ADD
from app.core.security import (
    hash_password,
    verify_password,
    create_access_token,
    get_current_user,
)
from app.services.audit import log_event
from app.services.turnstile import verify_turnstile
from app.services.email import send_password_reset_email  # ← ADD
from app.config import settings  # ← ADD

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


# ══════════════════════════════════════════════════════════
# ← ADD: Customização visual — cada usuário escolhe a própria
# ══════════════════════════════════════════════════════════

@router.get("/theme-meta", response_model=ThemeMeta)
def get_theme_meta():
    """Retorna as opções válidas de cor/modo, para o front montar o seletor."""
    return ThemeMeta(accent_colors=ACCENT_COLORS, modes=THEME_MODES)


@router.patch("/me/theme", response_model=UserOut)
def update_my_theme(
    data: ThemeUpdate,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Salva a preferência visual (cor de destaque / claro-escuro) do usuário logado."""
    before = dict(current_user.theme_preferences or {})
    updated = dict(current_user.theme_preferences or {})

    if data.accent is not None:
        updated["accent"] = data.accent
    if data.mode is not None:
        updated["mode"] = data.mode

    current_user.theme_preferences = updated
    db.commit()
    db.refresh(current_user)

    log_event(
        db=db,
        event_type="user.theme_updated",
        actor_id=current_user.id,
        actor_role=current_user.role,
        entity_type="user",
        entity_id=current_user.id,
        payload_before={"theme_preferences": before},
        payload_after={"theme_preferences": updated},
        request=request,
    )

    return current_user


# ══════════════════════════════════════════════════════════
# ← ADD: Redefinição de senha por e-mail
# ══════════════════════════════════════════════════════════

RESET_TOKEN_PURPOSE = "password_reset"
RESET_TOKEN_EXPIRE_MINUTES = 30


def _create_reset_token(user_id: str) -> str:
    expire = datetime.now(timezone.utc) + timedelta(minutes=RESET_TOKEN_EXPIRE_MINUTES)
    payload = {"sub": user_id, "purpose": RESET_TOKEN_PURPOSE, "exp": expire}
    return jwt.encode(payload, settings.SECRET_KEY, algorithm=settings.ALGORITHM)


@router.post("/forgot-password")
def forgot_password(
    data: ForgotPasswordRequest,
    request: Request,
    db: Session = Depends(get_db),
):
    """
    Envia um e-mail com link de redefinição de senha, se o e-mail existir.
    SEMPRE retorna a mesma mensagem de sucesso, exista ou não o e-mail —
    isso evita que alguém descubra quais e-mails estão cadastrados no sistema
    (enumeração de usuários), uma prática padrão de segurança.
    """
    user = db.query(User).filter(User.email == data.email).first()

    if user and user.is_active:
        token = _create_reset_token(str(user.id))
        reset_link = f"{settings.FRONTEND_URL}/reset-password?token={token}"
        send_password_reset_email(user.email, reset_link, user.name)

        log_event(
            db=db,
            event_type="user.password_reset_requested",
            actor_id=user.id,
            actor_role=user.role,
            entity_type="user",
            entity_id=user.id,
            request=request,
        )

    return {"message": "Se o e-mail existir em nossa base, um link de redefinição foi enviado."}


@router.post("/reset-password")
def reset_password_with_token(
    data: ResetPasswordRequest,
    request: Request,
    db: Session = Depends(get_db),
):
    """Redefine a senha usando o token recebido por e-mail."""
    try:
        payload = jwt.decode(data.token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        if payload.get("purpose") != RESET_TOKEN_PURPOSE:
            raise HTTPException(status_code=400, detail="Token inválido para esta operação.")
        user_id = payload.get("sub")
    except JWTError:
        raise HTTPException(status_code=400, detail="Link inválido ou expirado. Solicite um novo.")

    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="Usuário não encontrado.")

    if len(data.new_password) < 6:
        raise HTTPException(status_code=400, detail="Senha deve ter pelo menos 6 caracteres.")

    user.hashed_password = hash_password(data.new_password)
    db.commit()

    log_event(
        db=db,
        event_type="user.password_changed",
        actor_id=user.id,
        actor_role=user.role,
        entity_type="user",
        entity_id=user.id,
        metadata={"reset_via": "email_link"},
        request=request,
    )

    return {"message": "Senha redefinida com sucesso. Você já pode fazer login."}
