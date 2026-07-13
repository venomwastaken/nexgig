import os
from sqlmodel import create_engine, Session

# Replace with your actual database URL string or environment variable loader
DATABASE_URL = os.environ["DATABASE_URL"]
engine = create_engine(DATABASE_URL, echo=True)

def get_db():
    """
    FastAPI dependency that yields a database session 
    and automatically closes it when the request is done.
    """
    with Session(engine) as session:
        yield session