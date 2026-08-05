from uuid import UUID
import uuid
from sqlmodel import SQLModel, Field

class T(SQLModel, table=True):
    user_id: UUID = Field(default_factory=uuid.uuid4, primary_key=True)

print(T)
