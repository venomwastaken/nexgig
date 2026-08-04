from fastapi import APIRouter
from app.api.v1.endpoints import (
    admin,
    comments,
    gigs,
    notifications,
    messaging,
    orders,
    reviews,
    skills,
    users,
    verification,
)

api_router = APIRouter()

api_router.include_router(gigs.router, prefix="/gigs", tags=["Gigs"])
api_router.include_router(users.router, prefix="/users", tags=["Users"])
api_router.include_router(skills.router, prefix="/skills", tags=["Skills"])
api_router.include_router(admin.router, prefix="/admin", tags=["Admin"])
api_router.include_router(messaging.router, prefix="/messaging", tags=["Messaging"])
api_router.include_router(notifications.router, tags=["Notifications"])
api_router.include_router(verification.router, prefix="/verification", tags=["Verification"])
api_router.include_router(orders.router, prefix="/orders", tags=["Orders"])
api_router.include_router(reviews.router, tags=["Reviews"])
api_router.include_router(comments.router, tags=["Comments"])
