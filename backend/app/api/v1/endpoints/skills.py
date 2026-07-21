import os
from fastapi import Depends,HTTPException,APIRouter, Query
from typing import Generator, List, Optional

from sqlmodel import Session, create_engine, func, select
 
from app.models import UserAccount,Skill, UserAccount, UserProfile, UserSkillLink
from app.schemas import UserSkillRead,UserSkillUpdate
from app.core.database import get_db
from app.api.v1.endpoints.users import get_or_create_user

router = APIRouter()

DATABASE_URL = os.environ["DATABASE_URL"]
engine = create_engine(DATABASE_URL, echo=False, pool_pre_ping=True)
 
 
def get_session() -> Generator[Session, None, None]:
    with Session(engine) as session:
        yield session

# ---------- Global skills search / autocomplete ----------

@router.get("/", response_model=List[UserSkillRead])
def search_skills(
    search: Optional[str] = Query(default=None, min_length=1, max_length=50),
    limit: int = Query(default=20, le=50),
    session: Session = Depends(get_db),
):
    query = select(Skill)
    if search:
        query = query.where(func.lower(Skill.name).contains(search.lower()))
    query = query.order_by(Skill.name).limit(limit)
    return session.exec(query).all()


# ---------- User profile skill tags ----------

@router.put("/", response_model=List[UserSkillRead])
def update_my_skills(
    payload: UserSkillUpdate,
    current_user: UserAccount = Depends(get_or_create_user),
    session: Session = Depends(get_db),
):
    profile = session.exec(
        select(UserProfile).where(UserProfile.user_id == current_user.user_id)
    ).first()
    if not profile:
        raise HTTPException(
            status_code=404,
            detail="Profile not found — create a profile before adding skills",
        )

    # Normalize to match how Skill.name is stored, so "React" and "react"
    # resolve to the same row instead of creating duplicates
    normalized_names = {name.strip().lower() for name in payload.skills if name.strip()}

    resolved_skills: List[Skill] = []
    for name in normalized_names:
        skill = session.exec(select(Skill).where(Skill.name == name)).first()
        if not skill:
            skill = Skill(name=name)
            session.add(skill)
            session.flush()  # get skill.skill_id without a full commit yet
        resolved_skills.append(skill)

    # Replace the full set rather than diffing — simple, correct for a
    # "submit the whole list" style form, and fine at this data scale.
    existing_links = session.exec(
        select(UserSkillLink).where(UserSkillLink.user_profile_id == profile.profile_id)
    ).all()
    for link in existing_links:
        session.delete(link)

    for skill in resolved_skills:
        session.add(UserSkillLink(user_profile_id=profile.profile_id, skill_id=skill.skill_id))

    session.commit()
    return resolved_skills