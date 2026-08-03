import resend
from typing import Optional

from app.config import settings

resend.api_key = getattr(settings, "RESEND_API_KEY", None)

# Enquanto o domínio privyon.com.br não estiver verificado no Resend,
# usa o domínio de testes deles — funciona sem configuração extra de DNS.
FROM_EMAIL = getattr(settings, "RESEND_FROM_EMAIL", None) or "Privyon <onboarding@resend.dev>"


def _send(to_email: str, subject: str, html: str) -> bool:
    if not resend.api_key:
        # Sem chave configurada: não quebra o fluxo, só não envia (ex: dev local)
        return False
    try:
        resend.Emails.send({
            "from": FROM_EMAIL,
            "to": [to_email],
            "subject": subject,
            "html": html,
        })
        return True
    except Exception:
        return False


def send_password_reset_email(to_email: str, reset_link: str, user_name: str) -> bool:
    html = f"""
    <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto;">
      <h2 style="color:#2563eb;">Redefinir senha — Privyon</h2>
      <p>Olá, {user_name}.</p>
      <p>Recebemos uma solicitação para redefinir sua senha. Clique no botão abaixo para continuar:</p>
      <p style="text-align:center; margin: 24px 0;">
        <a href="{reset_link}" style="background:#2563eb;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:bold;">
          Redefinir senha
        </a>
      </p>
      <p style="color:#64748b;font-size:12px;">Este link expira em 30 minutos. Se você não solicitou isso, ignore este e-mail com segurança.</p>
    </div>
    """
    return _send(to_email, "Redefinir sua senha — Privyon", html)


def send_report_email(to_email: str, user_name: str, pdf_bytes: bytes, filename: str, report_title: str) -> bool:
    if not resend.api_key:
        return False
    import base64
    try:
        resend.Emails.send({
            "from": FROM_EMAIL,
            "to": [to_email],
            "subject": f"Relatório Privyon — {report_title}",
            "html": f"""
            <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto;">
              <h2 style="color:#2563eb;">Seu relatório está pronto</h2>
              <p>Olá, {user_name}.</p>
              <p>Segue em anexo o relatório da auditoria: <strong>{report_title}</strong>.</p>
            </div>
            """,
            "attachments": [{
                "filename": filename,
                "content": list(base64.b64encode(pdf_bytes)),
            }],
        })
        return True
    except Exception:
        return False
