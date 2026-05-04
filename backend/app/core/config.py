#환경변수를 불러오는 설정 파일 -> .env 파일에서 환경변수를 불러와서 사용할 수 있도록 설정.
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

    model_config = ConfigDict(env_file=".env", extra="ignore")


settings = Settings()

# config.py 맨 아래에 임시 추가
print(f"GOOGLE_CLIENT_ID: '{settings.GOOGLE_CLIENT_ID}'")