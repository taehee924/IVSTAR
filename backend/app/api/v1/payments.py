import httpx
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from pydantic import BaseModel

from app.core.config import settings
from app.core.database import get_db
from app.api.deps import get_current_user
from app.models.user import User
from app.models.report import Report
from app.models.payment import Payment, PaymentStatus, PaymentMethod

router = APIRouter(prefix="/payments", tags=["payments"])

PAYPAL_API = (
    "https://api-m.paypal.com"
    if settings.ENV == "production"
    else "https://api-m.sandbox.paypal.com"
)


# ── 스키마 ────────────────────────────────────────────────

class PaymentResponse(BaseModel):
    id: int
    user_id: int
    currency: str
    amount: int
    status: str
    payment_method: str | None
    refunded_amount: int | None
    paypal_order_id: str | None
    paypal_capture_id: str | None
    created_at: str

    class Config:
        from_attributes = True


class PaypalCreateRequest(BaseModel):
    report_id: int
    currency: str = "USD"


class PaypalCaptureRequest(BaseModel):
    paypal_order_id: str
    report_id: int


# ── 내부 헬퍼 ─────────────────────────────────────────────

def format_payment(payment: Payment) -> dict:
    return {
        "id": payment.id,
        "user_id": payment.user_id,
        "currency": payment.currency,
        "amount": payment.amount,
        "status": payment.status.value,
        "payment_method": payment.payment_method.value if payment.payment_method else None,
        "refunded_amount": payment.refunded_amount,
        "paypal_order_id": payment.paypal_order_id,
        "paypal_capture_id": payment.paypal_capture_id,
        "created_at": str(payment.created_at),
    }


def get_payment_or_404(payment_id: int, user_id: int, db: Session) -> Payment:
    payment = db.query(Payment).filter(
        Payment.id == payment_id,
        Payment.user_id == user_id,
    ).first()
    if not payment:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Payment not found")
    return payment


async def get_paypal_access_token() -> str:
    """PayPal OAuth 토큰 발급"""
    async with httpx.AsyncClient() as client:
        res = await client.post(
            f"{PAYPAL_API}/v1/oauth2/token",
            data={"grant_type": "client_credentials"},
            auth=(settings.PAYPAL_CLIENT_ID, settings.PAYPAL_CLIENT_SECRET),
        )
    if res.status_code != 200:
        raise HTTPException(status_code=502, detail="PayPal 인증 실패")
    return res.json()["access_token"]


# ── 라우트 ────────────────────────────────────────────────

@router.get("/", response_model=list[PaymentResponse])
def get_my_payments(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """내 결제 내역 조회"""
    payments = (
        db.query(Payment)
        .filter(Payment.user_id == current_user.id)
        .order_by(Payment.created_at.desc())
        .all()
    )
    return [format_payment(p) for p in payments]


@router.get("/{payment_id}", response_model=PaymentResponse)
def get_payment(
    payment_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """결제 단건 조회"""
    payment = get_payment_or_404(payment_id, current_user.id, db)
    return format_payment(payment)


@router.post("/paypal/create", response_model=dict, status_code=status.HTTP_201_CREATED)
async def paypal_create_order(
    body: PaypalCreateRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    PayPal Order 생성 (결제 시작).
    1. Report에서 price 조회
    2. PayPal Order 생성
    3. DB에 Payment 레코드 pending 상태로 저장
    4. paypal_order_id 반환 → 프론트에서 PayPal 결제창 호출
    """
    # 리포트 조회 + 본인 소유 확인
    report = db.query(Report).filter(
        Report.id == body.report_id,
        Report.user_id == current_user.id,
    ).first()
    if not report:
        raise HTTPException(status_code=404, detail="Report not found")

    # 무료 리포트는 결제 불가
    if report.price == 0:
        raise HTTPException(status_code=400, detail="This report is free")

    # 이미 결제된 리포트 중복 결제 방지
    if report.payment_id:
        raise HTTPException(status_code=400, detail="Already paid")

    amount_dollars = f"{report.price:.2f}"  # Numeric → "0.99"
    amount_cents = int(report.price * 100)  # DB 저장용 cents

    # PayPal Order 생성
    token = await get_paypal_access_token()
    async with httpx.AsyncClient() as client:
        res = await client.post(
            f"{PAYPAL_API}/v2/checkout/orders",
            json={
                "intent": "CAPTURE",
                "purchase_units": [
                    {
                        "reference_id": f"report_{report.id}",
                        "description": f"{report.report_type.value.capitalize()} Report",
                        "amount": {
                            "currency_code": body.currency,
                            "value": amount_dollars,
                        },
                    }
                ],
            },
            headers={"Authorization": f"Bearer {token}"},
        )

    if res.status_code != 201:
        raise HTTPException(status_code=502, detail="PayPal Order 생성 실패")

    order_id = res.json()["id"]

    # DB에 Payment 기록 (pending)
    payment = Payment(
        user_id=current_user.id,
        amount=amount_cents,
        currency=body.currency,
        payment_method=PaymentMethod.paypal,
        status=PaymentStatus.pending,
        paypal_order_id=order_id,
    )
    db.add(payment)
    db.commit()
    db.refresh(payment)

    return {"paypal_order_id": order_id, "payment_id": payment.id}


@router.post("/paypal/capture", response_model=PaymentResponse)
async def paypal_capture_order(
    body: PaypalCaptureRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    PayPal 결제 캡처 (유저 승인 후 실제 금액 청구).
    1. DB에서 Payment 조회
    2. PayPal Capture API 호출
    3. Payment status → paid, capture_id 저장
    4. Report에 payment_id 연결
    """
    # DB에서 pending 상태 Payment 조회
    payment = db.query(Payment).filter(
        Payment.paypal_order_id == body.paypal_order_id,
        Payment.user_id == current_user.id,
        Payment.status == PaymentStatus.pending,
    ).first()
    if not payment:
        raise HTTPException(status_code=404, detail="Payment not found or already processed")

    # PayPal Capture 호출
    token = await get_paypal_access_token()
    async with httpx.AsyncClient() as client:
        res = await client.post(
            f"{PAYPAL_API}/v2/checkout/orders/{body.paypal_order_id}/capture",
            headers={
                "Authorization": f"Bearer {token}",
                "Content-Type": "application/json",
            },
        )

    if res.status_code != 201:
        payment.status = PaymentStatus.failed
        db.commit()
        raise HTTPException(status_code=502, detail="PayPal 캡처 실패")

    capture_data = res.json()
    capture_id = (
        capture_data
        .get("purchase_units", [{}])[0]
        .get("payments", {})
        .get("captures", [{}])[0]
        .get("id")
    )

    # Payment 업데이트
    payment.status = PaymentStatus.paid
    payment.paypal_capture_id = capture_id

    # Report에 payment_id 연결
    report = db.query(Report).filter(
        Report.id == body.report_id,
        Report.user_id == current_user.id,
    ).first()
    if report:
        report.payment_id = payment.id

    db.commit()
    db.refresh(payment)
    return format_payment(payment)


@router.post("/{payment_id}/refund", response_model=PaymentResponse)
async def refund_payment(
    payment_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    환불 처리.
    PayPal Captures Refund API 호출.
    """
    payment = get_payment_or_404(payment_id, current_user.id, db)

    if payment.status != PaymentStatus.paid:
        raise HTTPException(status_code=400, detail="Only paid payments can be refunded")

    if not payment.paypal_capture_id:
        raise HTTPException(status_code=400, detail="Capture ID not found")

    token = await get_paypal_access_token()
    async with httpx.AsyncClient() as client:
        res = await client.post(
            f"{PAYPAL_API}/v2/payments/captures/{payment.paypal_capture_id}/refund",
            headers={
                "Authorization": f"Bearer {token}",
                "Content-Type": "application/json",
            },
            json={},  # 전액 환불 (부분 환불 시 amount 필드 추가)
        )

    if res.status_code != 201:
        raise HTTPException(status_code=502, detail="PayPal 환불 실패")

    payment.status = PaymentStatus.refunded
    payment.refunded_amount = payment.amount
    db.commit()
    db.refresh(payment)
    return format_payment(payment)