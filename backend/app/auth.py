# auth.py
import os
import jwt
from jwt import PyJWKClient
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

CLERK_JWKS_URL = os.environ["CLERK_JWKS_URL"]  # e.g. https://your-app.clerk.accounts.dev/.well-known/jwks.json

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