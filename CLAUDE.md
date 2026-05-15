# CLAUDE.md — Spirit Tech 프로젝트 개발 가이드

## 프로젝트 개요
글로벌(영어권) 타겟 사주/점성술 웹 플랫폼.
Eastern Saju + Western Astrology 결합, English-first 서비스.

---

## 기술 스택

### 프론트엔드
- Next.js 15 + TypeScript
- Tailwind CSS + shadcn/ui
- Auth.js (Google OAuth)
- 배포: Vercel

### 백엔드
- FastAPI + Python 3.12
- SQLAlchemy 2.x + Alembic
- PostgreSQL
- Redis (캐시/비동기, MVP는 BackgroundTasks)
- 배포: Railway

### 외부 서비스
- Google login API - 로그인
- Gemini API (Anthropic) — AI 리포트 생성 (`ANTHROPIC_API_KEY`)
- Paypal — 결제
- Swiss Ephemeris (pyswisseph) — 천체 계산
- manseryeok - 사주 계산

---

## 레포 구조

```
spirit-tech/
├── frontend/        # Next.js 15
└── backend/         # FastAPI
    ├── app/
    │   ├── main.py
    │   ├── api/
    │   │   ├── deps.py
    │   │   ├── router.py
    │   │   └── v1/
    │   │       ├── auth.py
    │   │       ├── users.py
    │   │       ├── birth_profiles.py
    │   │       ├── fortunes.py
    │   │       ├── reports.py
    │   │       ├── payments.py
    │   │       ├── compatibility.py
    │   │       └── share.py
    │   ├── core/
    │   │   ├── config.py
    │   │   ├── security.py
    │   │   ├── database.py
    │   │   ├── redis.py
    │   │   └── exceptions.py
    │   ├── models/
    │   │   ├── __init__.py   # Base + 모든 모델 import
    │   │   ├── user.py
    │   │   ├── birth_profile.py
    │   │   ├── report.py
    │   │   ├── payment.py
    │   │   └── compatibility.py
    │   ├── schemas/
    │   ├── services/
    │   ├── integrations/
    │   │   ├── claude/       # Claude API 연동
    │   │   ├── lemonsqueezy/ # 결제
    │   │   ├── astrology/    # 서양 점성술 계산
    │   │   └── saju/         # 사주 계산
    │   ├── repositories/
    │   ├── workers/
    │   └── utils/
    ├── alembic/
    ├── alembic.ini
    ├── requirements.txt
    └── .env
```

---

## DB 모델 구조

### User
- `id`, `email` (unique), `name`, `profile_image`
- `role`: Enum (user / admin)
- Google OAuth로만 가입, 비밀번호 없음

### BirthProfile
- `user_id` → User FK
- `birth_date` (필수), `birth_time` (선택), `birth_place` (선택)
- `gender`: Enum (male / female / other)

### Report
- `user_id` → User FK
- `birth_profile_id` → BirthProfile FK
- `payment_id` → Payment FK (무료는 null)
- `report_type`: Enum (general / love / career / wealth / health)
- `content`: AI 생성 텍스트

### Payment
- `user_id` → User FK
- `amount`: cents 단위 (ex. $9.99 → 999)
- `currency`: 기본 USD
- `status`: Enum (pending / paid / failed / refunded)
- `payment_method`: Enum (card / kakao_pay / apple_pay)
- `transaction_id`: Lemonsqueezy 결제 ID

### Compatibility
- `user_id` → User FK
- `profile_1_id`, `profile_2_id` → BirthProfile FK
- `result`: AI 생성 궁합 텍스트

---

## API 구조

베이스 URL: `/api/v1`

| Method | Endpoint | 설명 |
|--------|----------|------|
| POST | `/auth/me` | Google 로그인 후 유저 생성/조회 |
| GET | `/users/me` | 내 프로필 조회 |
| PATCH | `/users/me` | 내 프로필 수정 |
| DELETE | `/users/me` | 회원 탈퇴 |
| GET | `/birth-profiles/` | 출생 정보 목록 |
| POST | `/birth-profiles/` | 출생 정보 생성 |
| GET | `/birth-profiles/{id}` | 출생 정보 단건 조회 |
| PATCH | `/birth-profiles/{id}` | 출생 정보 수정 |
| DELETE | `/birth-profiles/{id}` | 출생 정보 삭제 |
| GET | `/reports/` | 리포트 목록 |
| GET | `/reports/{id}` | 리포트 단건 조회 |
| POST | `/reports/preview` | 무료 미리보기 생성 |
| POST | `/reports/full` | 유료 전체 리포트 생성 |
| DELETE | `/reports/{id}` | 리포트 삭제 |
| GET | `/payments/` | 결제 내역 조회 |
| POST | `/payments/` | 결제 생성 (pending) |
| POST | `/payments/{id}/refund` | 환불 처리 |
| GET | `/compatibility/` | 궁합 목록 |
| POST | `/compatibility/` | 궁합 생성 |
| GET | `/compatibility/{id}` | 궁합 단건 조회 |
| DELETE | `/compatibility/{id}` | 궁합 삭제 |

---

## 인증 흐름

```
프론트 (Auth.js Google 로그인)
  → JWT 발급
  → FastAPI 호출 시 Authorization: Bearer <token> 헤더 첨부
  → FastAPI에서 JWT 검증 (app/core/security.py)
  → 유저 조회/생성 (app/api/v1/auth.py)
  → is_new_user: true면 프론트에서 /onboarding으로 redirect
```

---

## 환경변수 (.env)

```
DATABASE_URL=postgresql://...
SECRET_KEY=...
ANTHROPIC_API_KEY=...
REDIS_URL=...
ENV=local
```

---

## 개발 규칙

- 모든 API는 JWT 인증 필수 (`deps.py`의 `get_current_user` 사용)
- DB 세션은 항상 `get_db()` 의존성 주입으로 처리
- Enum은 모델 파일 내에 정의
- 새 API 추가 시 `main.py`에 라우터 등록 필요
- 마이그레이션: 모델 수정 후 반드시 `alembic revision --autogenerate -m "설명"` 실행
- Claude API 연동 전까지 리포트/궁합 생성은 placeholder 텍스트 반환

---

## 미완성 (TODO)
- 디자인 
- 프롬포트 작성
- [ ] 프론트 전체 화면 구현

## 개발일정
-5/9까지 1차 개발 완료 