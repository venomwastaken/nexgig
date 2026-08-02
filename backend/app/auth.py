# auth.py
import os
import jwt
from jwt import PyJWKClient
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

CLERK_JWKS_URL = os.getenv("CLERK_JWKS_URL", "https://example.com/.well-known/jwks.json")

security = HTTPBearer()

# Cached client — fetches/refreshes JWKS keys automatically, including on kid rotation
_jwks_client = PyJWKClient(CLERK_JWKS_URL)


def _decode_and_verify(token: str) -> dict:
    try:
        signing_key = _jwks_client.get_signing_key_from_jwt(token)
        payload = jwt.decode(
            token,
            signing_key.key,
            algorithms=["RS256"],
            options={"require": ["exp", "iat", "sub"]},
        )
    except jwt.PyJWTError as e:
        print(f"JWT verification failed: {type(e).__name__}: {e}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token",
        )
    return payload


def verify_clerk_token(
    credentials: HTTPAuthorizationCredentials = Depends(security),
) -> dict:
    return _decode_and_verify(credentials.credentials)


def verify_clerk_token_string(token: str) -> dict:
    """Same verification as verify_clerk_token, for callers (WebSocket routes) that
    receive the raw JWT as a plain string (e.g. a `?token=` query param) instead of
    via the Authorization header / HTTPBearer machinery — browsers can't set custom
    headers on native WebSocket connections."""
    return _decode_and_verify(token)


def clerk_id_from_token(payload: dict = Depends(verify_clerk_token)) -> str:
    return payload["sub"]