import uuid

from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlmodel import Session, or_, select
from typing import Annotated, List, Optional

from app.models import Category, Gig, GigApprovalStatus, GigStatus, GigTagLink, GigTagLink, UserAccount, UserProfile,Tag
from app.core.database import get_db
from app.schemas import GigCreate, GigRead, GigUpdate, GigStatusUpdate
from app.api.v1.endpoints.users import get_or_create_user


def get_current_user_optional() -> Optional[UserAccount]:
    return None

router = APIRouter()

@router.post("/", response_model=GigRead, status_code=status.HTTP_201_CREATED)
def create_gig(
    payload: GigCreate,
    user: UserAccount = Depends(get_or_create_user),
    db: Session = Depends(get_db)
):
    if not user:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="User not found")

    category = None
    if payload.category_id is not None:
        category = db.get(Category, payload.category_id)
        if not category:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid category_id")

    new_gig = Gig(
        title=payload.title,
        description=payload.description,
        price=payload.price,
        user_id=user.user_id,
        category_id=payload.category_id,
        approval_status=GigApprovalStatus.PENDING,
        banner_url=payload.banner_url,
        turnaround_time=payload.turnaround_time
    )
    db.add(new_gig)
    db.flush()

    if payload.tags:
        for tag_name in set(payload.tags):
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

@router.get("/", response_model=List[GigRead])
def list_gigs(
    tag_id: Annotated[Optional[uuid.UUID], Query(description="Filter gigs by tag ID")] = None,
    category_id: Annotated[Optional[uuid.UUID], Query(description="Filter gigs by category ID")] = None,
    q: Annotated[Optional[str], Query(description="Keyword search in title/description")] = None,
    user: UserAccount = Depends(get_or_create_user),
    db: Session = Depends(get_db),
):
    statement = select(Gig)

    if tag_id:
        statement = statement.join(GigTagLink).where(GigTagLink.tag_id == tag_id)

    if category_id:
        statement = statement.where(Gig.category_id == category_id)

    if q:
        pattern = f"%{q}%"
        statement = statement.where(
            or_(Gig.title.ilike(pattern), Gig.description.ilike(pattern))
        )

    if user.is_admin:
        pass
    else:
        statement = statement.where(
            or_(
                Gig.approval_status == GigApprovalStatus.APPROVED,
                Gig.user_id == user.user_id,
            )
        )

    return db.exec(statement).all()

@router.get("/search", response_model=list[GigRead])
def browse_gigs(
    category_id: Optional[uuid.UUID] = None,
    q: Optional[str] = None,
    session: Session = Depends(get_db),
    user: Optional[UserAccount] = Depends(get_current_user_optional),
):
    query = select(Gig).where(Gig.status == GigStatus.ACTIVE)

    if category_id:
        query = query.where(Gig.category_id == category_id)

    if q:
        pattern = f"%{q}%"
        query = query.where(or_(Gig.title.ilike(pattern), Gig.description.ilike(pattern)))

    if user is None:
        query = query.where(Gig.approval_status == GigApprovalStatus.APPROVED)
    elif not user.is_admin:
        query = query.where(
            or_(
                Gig.approval_status == GigApprovalStatus.APPROVED,
                Gig.user_id == user.user_id,
            )
        )

    return session.exec(query).all()

@router.get("/{id}", response_model=GigRead)
def get_gig(
    id: uuid.UUID, 
    user: UserAccount = Depends(get_or_create_user),
    db: Session = Depends(get_db)
):
    target = db.get(Gig, id)
    if not target:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Gig not found")

    # B3 Visibility Rule: Hide pending/rejected gigs from everyone except the owner or an admin
    if target.approval_status != GigApprovalStatus.APPROVED:
        is_owner = target.user_id == user.user_id
        is_admin = user.is_admin

        if not (is_owner or is_admin):
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND, detail="Gig not found"
            )

    return target


@router.patch("/{id}", response_model=GigRead)
def edit_gig(
    id: uuid.UUID,
    payload: GigUpdate,
    user: UserAccount = Depends(get_or_create_user),
    db: Session = Depends(get_db)
):
    target = db.get(Gig, id)
    if not target:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Gig not found")

    if target.user_id != user.user_id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized to edit this gig")

    # Extract only the fields sent in the request body
    data = payload.model_dump(exclude_unset=True)

    # Handle category validation if category_id was updated
    if "category_id" in data and data["category_id"] is not None:
        category = db.get(Category, data["category_id"])
        if not category:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid category_id")

    # Dynamically apply updates to Gig (including banner_url and turnaround_time)
    for key, value in data.items():
        if key != "tag_ids":
            setattr(target, key, value)

    # Handle tag relations separately if provided
    if payload.tag_ids is not None:
        # Delete existing tag links
        existing_links = db.exec(select(GigTagLink).where(GigTagLink.gig_id == id)).all()
        for old_link in existing_links:
            db.delete(old_link)
        # Add new tag links
        for next_id in payload.tag_ids:
            db.add(GigTagLink(gig_id=id, tag_id=next_id))

    db.add(target)
    db.commit()
    db.refresh(target)
    return target

@router.patch("/{id}/status", response_model=GigRead)
def update_gig_status(
    id: uuid.UUID,
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

@router.delete("/{id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_gig(
    id: uuid.UUID,
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