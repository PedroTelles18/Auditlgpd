from pydantic_settings import BaseSettings, SettingsConfigDict
from typing import Optional


class Settings(BaseSettings):
    DATABASE_URL: str
    SECRET_KEY: str
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 480
    FRONTEND_URL: str = "http://localhost:3000"
    GROQ_API_KEY: Optional[str] = None
    TURNSTILE_SECRET_KEY: Optional[str] = None
    RESEND_API_KEY: Optional[str] = None       # ← ADD
    RESEND_FROM_EMAIL: Optional[str] = None    # ← ADD: opcional, usa domínio de teste se não configurado

    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8")


settings = Settings()
