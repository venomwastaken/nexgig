from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlmodel import Session, select
from typing import List, Optional

from app.models import Gig, GigSkillLink, UserProfile
from app.core.database import get_db
from app.schemas import GigCreate, GigRead, GigUpdate, GigStatusUpdate
# Assuming your auth dependency is located in your root auth or clerk_auth file
from app.api.v1.endpoints.users import get_or_create_user 

router = APIRouter()

@router.post("/create-gig", response_model=GigRead, status_code=status.HTTP_201_CREATED)
def create_gig(
    payload: GigCreate, 
    profile: UserProfile = Depends(get_or_create_user),
    db: Session = Depends(get_db)
):
    new_gig = Gig(
        title=payload.title,
        description=payload.description,
        budget=payload.budget,
        provider_id=profile.id
    )
    db.add(new_gig)
    db.commit()
    db.refresh(new_gig)
    
    for skill_id in payload.skill_ids:
        link = GigSkillLink(gig_id=new_gig.id, skill_id=skill_id)
        db.add(link)
    db.commit()
    db.refresh(new_gig)
    return new_gig

@router.get("/list-gigs", response_model=List[GigRead])
def list_gigs(
    skill_id: Optional[int] = Query(None, description="Filter gigs by skill ID"),
    db: Session = Depends(get_db)
):
    statement = select(Gig)
    if skill_id:
        statement = statement.join(GigSkillLink).where(GigSkillLink.skill_id == skill_id)
    return db.exec(statement).all()

@router.get("/get-gig/{id}", response_model=GigRead)
def get_gig(id: int, db: Session = Depends(get_db)):
    target = db.get(Gig, id)
    if not target:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Gig not found")
    return target

@router.patch("/edit-gig/{id}", response_model=GigRead)
def edit_gig(
    id: int, 
    payload: GigUpdate,
    profile: UserProfile = Depends(get_or_create_user),
    db: Session = Depends(get_db)
):
    target = db.get(Gig, id)
    if not target:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Gig not found")
        
    if target.provider_id != profile.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized to edit this gig")
        
    data = payload.model_dump(exclude_unset=True)
    for key, value in data.items():
        if key != "skill_ids":
            setattr(target, key, value)
            
    if payload.skill_ids is not None:
        existing_links = db.exec(select(GigSkillLink).where(GigSkillLink.gig_id == id)).all()
        for old_link in existing_links:
            db.delete(old_link)
        for next_id in payload.skill_ids:
            db.add(GigSkillLink(gig_id=id, skill_id=next_id))
            
    db.add(target)
    db.commit()
    db.refresh(target)
    return target

@router.patch("/update-gig-status/{id}/status", response_model=GigRead)
def update_gig_status(
    id: int,
    payload: GigStatusUpdate,
    profile: UserProfile = Depends(get_or_create_user),
    db: Session = Depends(get_db)
):
    target = db.get(Gig, id)
    if not target:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Gig not found")
        
    if target.provider_id != profile.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized to modify this gig")
        
    target.status = payload.status
    db.add(target)
    db.commit()
    db.refresh(target)
    return target

@router.delete("/delete-gig/{id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_gig(
    id: int,
    profile: UserProfile = Depends(get_or_create_user),
    db: Session = Depends(get_db)
):
    target = db.get(Gig, id)
    if not target:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Gig not found")
        
    if target.provider_id != profile.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized to delete this gig")
        
    db.delete(target)
    db.commit()
    return None