# auth.py
import os
import jwt
from jwt import PyJWKClient
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from app.models import UserAccount, AccountStatus

CLERK_JWKS_URL = os.getenv("CLERK_JWKS_URL", "https://example.com/.well-known/jwks.json")

security = HTTPBearer()

# Cached client — fetches/refreshes JWKS keys automatically, including on kid rotation
_jwks_client = PyJWKClient(CLERK_JWKS_URL)


def verify_clerk_token(
    credentials: HTTPAuthorizationCredentials = Depends(security),
) -> dict:
    token = credentials.credentials
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


def clerk_id_from_token(payload: dict = Depends(verify_clerk_token)) -> str:
    return payload["sub"]


def get_current_user(
    token: HTTPAuthorizationCredentials = Depends(security),
) -> UserAccount:
    payload = verify_clerk_token(token)
    return UserAccount(
        id=payload["sub"],
        email=payload["email"],
        is_admin=payload["is_admin"],
        is_active=payload["is_active"],
        status=payload["status"],
    )


def require_admin(current_user: UserAccount = Depends(get_current_user)) -> UserAccount:
    if not getattr(current_user, "is_admin", False):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Admin access required")
    return current_user


def require_not_suspended(current_user: UserAccount = Depends(get_current_user)) -> UserAccount:
    if getattr(current_user, "status", None) == AccountStatus.suspended:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Account suspended")
    return current_user


def require_active_account(current_user: UserAccount = Depends(get_current_user)) -> UserAccount:
    if current_user.status != AccountStatus.active.value:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Suspended accounts cannot perform this action",
        )
    return current_user