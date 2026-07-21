from fastapi import APIRouter
from app.api.v1.endpoints import gigs, users, skills  # Imports your endpoint files

api_router = APIRouter()

# Register the routes with clean URL prefixes
api_router.include_router(gigs.router, prefix="/gigs", tags=["Gigs"])
api_router.include_router(users.router, prefix="/users", tags=["Users"])
api_router.include_router(skills.router, prefix="/skills", tags=["Skills"])
