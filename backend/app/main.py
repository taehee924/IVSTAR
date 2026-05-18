from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import text

from app.core.database import engine
from app.api.v1.auth import router as auth_router
from app.api.v1.users import router as users_router
from app.api.v1.birth_profiles import router as birth_profiles_router
from app.api.v1.reports import router as reports_router
from app.api.v1.payments import router as payments_router
from app.api.v1.compatibility import router as compatibility_router

app = FastAPI(title="Spirit Tech API", version="0.1.0")

# CORS 설정
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",       # Next.js 로컬
        "https://www.4fourstar.com",   # 프로덕션 도메인
        "https://4fourstar.com",       # www 없는 버전
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 라우터 등록
app.include_router(auth_router, prefix="/api/v1")
app.include_router(users_router, prefix="/api/v1")
app.include_router(birth_profiles_router, prefix="/api/v1")
app.include_router(reports_router, prefix="/api/v1")
app.include_router(payments_router, prefix="/api/v1")
app.include_router(compatibility_router, prefix="/api/v1")


@app.get("/")
def root():
    return {"message": "API running"}


@app.get("/db-check")
def db_check():
    with engine.connect() as conn:
        result = conn.execute(text("SELECT 1"))
        return {"db": "connected", "result": result.scalar()}