from typing import Generator

from sqlmodel import Session

from app.core.database import get_db


def get_session() -> Generator[Session, None, None]:
    yield from get_db()


__all__ = ["get_db", "get_session"]
