import uuid
from fastapi.testclient import TestClient
from sqlmodel import SQLModel, Session, create_engine
from app.main import app
from app.core.database import get_db
from app.api.v1.endpoints import verification
from app.models import UserAccount

engine = create_engine('sqlite:///./test_verification.sqlite3')
SQLModel.metadata.drop_all(engine)
SQLModel.metadata.create_all(engine)


def override_get_db():
    with Session(engine) as session:
        yield session


def override_get_or_create_user():
    return UserAccount(
        user_id=uuid.UUID('00000000-0000-0000-0000-000000000104'),
        email='student4@example.com',
        clerk_id='clerk_student_test_4',
    )

app.dependency_overrides[get_db] = override_get_db
app.dependency_overrides[verification.get_or_create_user] = override_get_or_create_user
verification.send_email = lambda *args, **kwargs: None

client = TestClient(app)
res = client.post('/api/v1/verification/email/request', json={'email': 'student@school.edu'})
print(res.status_code)
print(res.text)
