import requests
from typing import Optional

from app.config import settings

TURNSTILE_VERIFY_URL = "https://challenges.cloudflare.com/turnstile/v0/siteverify"


def verify_turnstile(token: Optional[str], remote_ip: Optional[str] = None) -> bool:
    """
    Valida o token do Cloudflare Turnstile.

    Retorna True se:
    - a validação com a Cloudflare confirmar que o token é válido, OU
    - a TURNSTILE_SECRET_KEY não estiver configurada (permite login sem captcha
      em ambientes de desenvolvimento local, onde a variável pode não existir).

    Retorna False se a secret key existir mas o token for inválido/ausente —
    nesse caso o login deve ser bloqueado.
    """
    secret = getattr(settings, "TURNSTILE_SECRET_KEY", None)

    if not secret:
        # Sem secret key configurada = captcha desativado (ex: dev local)
        return True

    if not token:
        return False

    try:
        response = requests.post(
            TURNSTILE_VERIFY_URL,
            data={
                "secret": secret,
                "response": token,
                **({"remoteip": remote_ip} if remote_ip else {}),
            },
            timeout=5,
        )
        result = response.json()
        return bool(result.get("success"))
    except requests.RequestException:
        # Se a Cloudflare estiver fora do ar, é mais seguro bloquear o login
        # do que deixar passar sem verificação nenhuma.
        return False
