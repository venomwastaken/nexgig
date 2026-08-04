import uuid
from typing import List

from fastapi import APIRouter, Depends, HTTPException, status
from sqlmodel import Session, func, select

from app.api.v1.endpoints.users import get_or_create_user
from app.core.database import get_db
from app.models import Gig, GigApprovalStatus, UserAccount, UserProfile, UserReview
from app.schemas import GigReviewCreate, GigReviewRead, GigReviewSummary, ProviderRead

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


def _to_review_read(review: UserReview, gig_id: uuid.UUID, db: Session) -> GigReviewRead:
    return GigReviewRead(
        review_id=review.review_id,
        gig_id=gig_id,
        reviewer=_provider_summary(review.reviewer_id, db),
        rating=review.rating,
        comment=review.comment,
        created_at=review.created_at,
    )


@router.post("/gigs/{gig_id}/reviews", response_model=GigReviewRead, status_code=status.HTTP_201_CREATED)
def create_gig_review(
    gig_id: uuid.UUID,
    payload: GigReviewCreate,
    user: UserAccount = Depends(get_or_create_user),
    db: Session = Depends(get_db),
):
    gig = _get_visible_gig(gig_id, user, db)

    if gig.user_id == user.user_id:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="You can't review your own gig")

    existing = db.exec(
        select(UserReview).where(
            UserReview.gig_id == gig_id,
            UserReview.reviewer_id == user.user_id,
        )
    ).first()
    if existing:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="You've already reviewed this gig")

    review = UserReview(
        reviewer_id=user.user_id,
        reviewee_id=gig.user_id,
        gig_id=gig_id,
        rating=payload.rating,
        comment=payload.comment,
    )
    db.add(review)
    db.commit()
    db.refresh(review)

    return _to_review_read(review, gig_id, db)


@router.get("/gigs/{gig_id}/reviews", response_model=List[GigReviewRead])
def list_gig_reviews(
    gig_id: uuid.UUID,
    user: UserAccount = Depends(get_or_create_user),
    db: Session = Depends(get_db),
):
    gig = _get_visible_gig(gig_id, user, db)
    reviews = db.exec(
        select(UserReview)
        .where(UserReview.gig_id == gig.gig_id)
        .order_by(UserReview.created_at.desc())
    ).all()
    return [_to_review_read(r, gig.gig_id, db) for r in reviews]


@router.get("/gigs/{gig_id}/reviews/summary", response_model=GigReviewSummary)
def get_gig_review_summary(
    gig_id: uuid.UUID,
    user: UserAccount = Depends(get_or_create_user),
    db: Session = Depends(get_db),
):
    gig = _get_visible_gig(gig_id, user, db)
    avg_rating, review_count = db.exec(
        select(func.avg(UserReview.rating), func.count(UserReview.review_id)).where(
            UserReview.gig_id == gig.gig_id
        )
    ).one()
    return GigReviewSummary(
        gig_id=gig.gig_id,
        average_rating=float(avg_rating) if avg_rating is not None else None,
        review_count=review_count or 0,
    )


@router.delete("/reviews/{review_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_gig_review(
    review_id: uuid.UUID,
    user: UserAccount = Depends(get_or_create_user),
    db: Session = Depends(get_db),
):
    review = db.get(UserReview, review_id)
    if not review:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Review not found")
    if review.reviewer_id != user.user_id and not user.is_admin:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized to delete this review")

    db.delete(review)
    db.commit()
    return None
