from google.oauth2 import id_token
from google.auth.transport import requests
from app.core.config import settings


def decode_jwt(token: str) -> dict | None:
    try:
        print(f"=== TOKEN START ===")
        print(f"Token length: {len(token)}")
        print(f"Token prefix: {token[:20]}")
        print(f"=== TOKEN END ===")

        payload = id_token.verify_oauth2_token(
            token,
            requests.Request(),
            settings.GOOGLE_CLIENT_ID,
        )
        print(f"=== PAYLOAD: {payload} ===")
        return payload
    except Exception as e:
        print(f"=== JWT ERROR: {e} ===")
        return None