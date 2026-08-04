from fastapi import APIRouter
<<<<<<< HEAD
from app.api.v1.endpoints import gigs, users, skills, admin, bookings
from .endpoints import admin as admin_router
=======
from app.api.v1.endpoints import gigs, users, skills, admin, messaging  # Imports your endpoint files
>>>>>>> b4a90e1d79555041a4ba0db59c910ed4a5205ab8

api_router = APIRouter()

api_router.include_router(gigs.router, prefix="/gigs", tags=["Gigs"])
api_router.include_router(users.router, prefix="/users", tags=["Users"])
api_router.include_router(skills.router, prefix="/skills", tags=["Skills"])
<<<<<<< HEAD
api_router.include_router(admin_router.router, prefix="/admin", tags=["Admin"])
api_router.include_router(bookings.router, prefix="/bookings", tags=["Bookings"])
=======
api_router.include_router(admin.router, prefix="/admin", tags=["Admin"])
api_router.include_router(messaging.router, prefix="/messaging", tags=["Messaging"])
>>>>>>> b4a90e1d79555041a4ba0db59c910ed4a5205ab8
