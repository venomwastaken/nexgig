from fastapi import APIRouter
from app.api.v1.endpoints import gigs, users, skills, admin, bookings

api_router = APIRouter()

api_router.include_router(gigs.router, prefix="/gigs", tags=["Gigs"])
api_router.include_router(users.router, prefix="/users", tags=["Users"])
api_router.include_router(skills.router, prefix="/skills", tags=["Skills"])
api_router.include_router(admin.router, prefix="/admin", tags=["Admin"])
api_router.include_router(bookings.router, prefix="/bookings", tags=["Bookings"])
