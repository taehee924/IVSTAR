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


@app.on_event("startup")
def cleanup_orphan_reports():
    """재시작으로 죽은 백그라운드 생성 작업의 고아 리포트 정리 (failed 처리 + 별 환불)"""
    from app.core.database import SessionLocal
    from app.models.report import Report
    from app.api.v1.reports import _fail_stale_generating

    db = SessionLocal()
    try:
        stale = db.query(Report).filter(Report.status == "generating").all()
        changed = sum(1 for r in stale if _fail_stale_generating(r, db))
        if changed:
            db.commit()
            print(f"Startup cleanup: {changed} orphaned generating report(s) -> failed")
    except Exception as e:
        print(f"Startup cleanup error: {e}")
    finally:
        db.close()


@app.get("/")
def root():
    return {"message": "API running"}


@app.get("/db-check")
def db_check():
    with engine.connect() as conn:
        result = conn.execute(text("SELECT 1"))
        return {"db": "connected", "result": result.scalar()}