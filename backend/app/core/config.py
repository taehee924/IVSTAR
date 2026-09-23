from pydantic_settings import BaseSettings
from pydantic import ConfigDict


class Settings(BaseSettings):
    DATABASE_URL: str
    SECRET_KEY: str = "change-this-secret"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60

    ANTHROPIC_API_KEY: str | None = None
    GEMINI_API_KEY: str | None = None

    PAYPAL_CLIENT_ID: str | None = None
    PAYPAL_CLIENT_SECRET: str | None = None

    GOOGLE_CLIENT_ID: str | None = None
    GOOGLE_CLIENT_SECRET: str | None = None
    GOOGLE_REDIRECT_URI: str | None = None

    REDIS_URL: str | None = None

    # ── Email (Resend) ──
    RESEND_API_KEY: str | None = None
    EMAIL_FROM: str = "IVSTAR <daily@4fourstar.com>"
    # 데일리 이메일 cron 엔드포인트 보호용 시크릿 (Railway cron이 헤더로 전달)
    CRON_SECRET: str | None = None

    ENV: str = "local"  # "local" | "production"
    FRONTEND_URL: str = "https://www.4fourstar.com"
    # 이메일 unsubscribe 링크 등 백엔드 절대경로 생성용
    BACKEND_URL: str = "https://ivstar-production.up.railway.app"

    PROMO_CODE: str = "THANKS4USING"

    model_config = ConfigDict(env_file=".env", extra="ignore")


settings = Settings()