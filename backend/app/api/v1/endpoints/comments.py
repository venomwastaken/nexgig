import uuid
from datetime import datetime, timezone
from typing import List

from fastapi import APIRouter, Depends, HTTPException, status
from sqlmodel import Session, select

from app.api.v1.endpoints.users import get_or_create_user
from app.core.database import get_db
from app.models import Gig, GigApprovalStatus, GigComment, UserAccount, UserProfile
from app.schemas import GigCommentCreate, GigCommentRead, GigCommentUpdate, ProviderRead

router = APIRouter()


def _provider_summary(user_id: uuid.UUID, db: Session) -> ProviderRead:
    profile = db.exec(select(UserProfile).where(UserProfile.user_id == user_id)).first()
    if profile is None:
        return ProviderRead(user_id=user_id, first_name="Unknown", last_name="User", username="unknown")
    return ProviderRead(
        user_id=profile.user_id,
        first_name=profile.first_name,
        last_name=profile.last_name,
        username=profile.username,
        avatar_url=profile.avatar_url,
    )


def _get_visible_gig(gig_id: uuid.UUID, user: UserAccount, db: Session) -> Gig:
    gig = db.get(Gig, gig_id)
    if not gig:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Gig not found")
    if gig.approval_status != GigApprovalStatus.APPROVED and gig.user_id != user.user_id and not user.is_admin:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Gig not found")
    return gig


def _to_comment_read(comment: GigComment, db: Session) -> GigCommentRead:
    return GigCommentRead(
        id=comment.comment_id,
        gig_id=comment.gig_id,
        author=_provider_summary(comment.user_id, db),
        parent_comment_id=comment.parent_comment_id,
        body=comment.body,
        created_at=comment.created_at,
        updated_at=comment.updated_at,
        is_edited=comment.is_edited,
    )


@router.post("/gigs/{gig_id}/comments", response_model=GigCommentRead, status_code=status.HTTP_201_CREATED)
def create_gig_comment(
    gig_id: uuid.UUID,
    payload: GigCommentCreate,
    user: UserAccount = Depends(get_or_create_user),
    db: Session = Depends(get_db),
):
    gig = _get_visible_gig(gig_id, user, db)

    if payload.parent_comment_id is not None:
        parent = db.get(GigComment, payload.parent_comment_id)
        if not parent or parent.gig_id != gig.gig_id:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid parent_comment_id")

    comment = GigComment(
        gig_id=gig.gig_id,
        user_id=user.user_id,
        parent_comment_id=payload.parent_comment_id,
        body=payload.body,
    )
    db.add(comment)
    db.commit()
    db.refresh(comment)
    return _to_comment_read(comment, db)


@router.get("/gigs/{gig_id}/comments", response_model=List[GigCommentRead])
def list_gig_comments(
    gig_id: uuid.UUID,
    user: UserAccount = Depends(get_or_create_user),
    db: Session = Depends(get_db),
):
    gig = _get_visible_gig(gig_id, user, db)
    comments = db.exec(
        select(GigComment).where(GigComment.gig_id == gig.gig_id).order_by(GigComment.created_at.asc())
    ).all()
    return [_to_comment_read(c, db) for c in comments]


@router.patch("/comments/{comment_id}", response_model=GigCommentRead)
def update_gig_comment(
    comment_id: uuid.UUID,
    payload: GigCommentUpdate,
    user: UserAccount = Depends(get_or_create_user),
    db: Session = Depends(get_db),
):
    comment = db.get(GigComment, comment_id)
    if not comment:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Comment not found")
    if comment.user_id != user.user_id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized to edit this comment")

    comment.body = payload.body
    comment.is_edited = True
    comment.updated_at = datetime.now(timezone.utc)
    db.add(comment)
    db.commit()
    db.refresh(comment)
    return _to_comment_read(comment, db)


@router.delete("/comments/{comment_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_gig_comment(
    comment_id: uuid.UUID,
    user: UserAccount = Depends(get_or_create_user),
    db: Session = Depends(get_db),
):
    comment = db.get(GigComment, comment_id)
    if not comment:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Comment not found")
    if comment.user_id != user.user_id and not user.is_admin:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized to delete this comment")

    children = db.exec(select(GigComment).where(GigComment.parent_comment_id == comment.comment_id)).all()
    for child in children:
        child.parent_comment_id = None
        db.add(child)

    db.delete(comment)
    db.commit()
    return None
