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

    ENV: str = "local"  # "local" | "production"
    FRONTEND_URL: str = "https://www.4fourstar.com"

    PROMO_CODE: str = "THANKS4USING"

    model_config = ConfigDict(env_file=".env", extra="ignore")


settings = Settings()