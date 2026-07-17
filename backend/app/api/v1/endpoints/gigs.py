import uuid

from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlmodel import Session, select
from typing import List, Optional

from app.models import Gig, GigTagLink, GigTagLink, UserAccount, UserProfile,Tag
from app.core.database import get_db
from app.schemas import GigCreate, GigRead, GigUpdate, GigStatusUpdate
# Assuming your auth dependency is located in your root auth or clerk_auth file
from app.api.v1.endpoints.users import get_or_create_user 

router = APIRouter()

@router.post("/create-gig", response_model=GigRead, status_code=status.HTTP_201_CREATED)
def create_gig(
    payload: GigCreate, 
    user: UserAccount = Depends(get_or_create_user),
    db: Session = Depends(get_db)
):
    if not user:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="User not found")
        
    # COMMENT OUT TRY/EXCEPT TEMPORARILY TO SEE THE REAL ERROR LOG
    # try:
    new_gig = Gig(
        title=payload.title,
        description=payload.description,
        price=payload.price,
        user_id=user.user_id
    )
    db.add(new_gig)
    db.flush()
    
    for tag_name in set(payload.tags): # set() prevents duplicate link crashes
        tag_name_clean = tag_name.lower().strip()
        tag = db.query(Tag).filter(Tag.name == tag_name_clean).first()
        if not tag:
            tag = Tag(name=tag_name_clean)
            db.add(tag)
            db.flush() 
        
        link = GigTagLink(gig_id=new_gig.gig_id, tag_id=tag.tag_id)
        db.add(link)

    db.commit()
    db.refresh(new_gig)
    return new_gig
    # except Exception as e:
    #     db.rollback()
    #     raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))

@router.get("/list-gigs", response_model=List[GigRead])
def list_gigs(
    tag_id: Optional[uuid.UUID] = Query(None, description="Filter gigs by tag ID"),
    db: Session = Depends(get_db)
):
    statement = select(Gig)
    if tag_id:
        statement = statement.join(GigTagLink).where(GigTagLink.tag_id == tag_id)
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
    user: UserAccount = Depends(get_or_create_user),
    db: Session = Depends(get_db)
):
    target = db.get(Gig, id)
    if not target:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Gig not found")
        
    if target.user_id != user.user_id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized to edit this gig")
        
    data = payload.model_dump(exclude_unset=True)
    for key, value in data.items():
        if key != "tag_ids":
            setattr(target, key, value)
            
    if payload.skill_ids is not None:
        existing_links = db.exec(select(GigTagLink).where(GigTagLink.gig_id == id)).all()
        for old_link in existing_links:
            db.delete(old_link)
        for next_id in payload.skill_ids:
            db.add(GigTagLink(gig_id=id, tag_id=next_id))
            
    db.add(target)
    db.commit()
    db.refresh(target)
    return target

@router.patch("/update-gig-status/{id}/status", response_model=GigRead)
def update_gig_status(
    id: int,
    payload: GigStatusUpdate,
    user: UserAccount = Depends(get_or_create_user),
    db: Session = Depends(get_db)
):
    target = db.get(Gig, id)
    if not target:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Gig not found")
        
    if target.user_id != user.user_id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized to modify this gig")
        
    target.status = payload.status
    db.add(target)
    db.commit()
    db.refresh(target)
    return target

@router.delete("/delete-gig/{id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_gig(
    id: int,
    user: UserAccount = Depends(get_or_create_user),
    db: Session = Depends(get_db)
):
    target = db.get(Gig, id)
    if not target:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Gig not found")
        
    if target.user_id != user.user_id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized to delete this gig")
        
    db.delete(target)
    db.commit()
    return None