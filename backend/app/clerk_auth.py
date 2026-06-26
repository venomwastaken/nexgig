from functools import lru_cache
from typing import Optional

import jwt
from fastapi import HTTPException, Request, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from jwt import PyJWKClient
from pydantic_settings import BaseSettings


class ClerkConfig(BaseSettings):
    """Clerk JWT verification settings (reads from env vars prefixed CLERK_)."""

    jwks_url: str          # CLERK_JWKS_URL
    issuer: str            # CLERK_ISSUER (your Clerk Frontend API URL)
    audience: Optional[str] = None  # CLERK_AUDIENCE, only if you set one in Clerk
    algorithms: list[str] = ["RS256"]

    class Config:
        env_prefix = "CLERK_"


@lru_cache
def get_clerk_config() -> ClerkConfig:
    return ClerkConfig()


@lru_cache
def get_jwk_client(jwks_url: str) -> PyJWKClient:
    # PyJWKClient caches keys and refetches automatically on an unknown kid
    return PyJWKClient(jwks_url, cache_keys=True)


class ClerkHTTPBearer(HTTPBearer):
    """Validates a Clerk-issued JWT against Clerk's JWKS endpoint."""

    def __init__(self, config: Optional[ClerkConfig] = None, auto_error: bool = True):
        super().__init__(auto_error=auto_error)
        self.config = config or get_clerk_config()
        self.jwk_client = get_jwk_client(self.config.jwks_url)

    async def __call__(self, request: Request) -> dict:
        credentials: HTTPAuthorizationCredentials = await super().__call__(request)

        if credentials.scheme.lower() != "bearer":
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid authentication scheme.",
            )

        token = credentials.credentials

        try:
            signing_key = self.jwk_client.get_signing_key_from_jwt(token)
            payload = jwt.decode(
                token,
                signing_key.key,
                algorithms=self.config.algorithms,
                audience=self.config.audience,
                issuer=self.config.issuer,
                options={"require": ["exp", "iat"]},
            )
        except jwt.PyJWKClientError:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Unable to fetch signing key from JWKS.",
            )
        except jwt.ExpiredSignatureError:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Token has expired.",
            )
        except jwt.InvalidTokenError as exc:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail=f"Invalid token: {exc}",
            )

        # stash claims on request.state in case other dependencies need them
        request.state.clerk_claims = payload
        return payload