import os
from fastapi import Depends, FastAPI, Header, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from typing import Generator, List
from app.api.v1.router import api_router



# This is the entire backend for now. Its only job in Sprint 0
# is to prove the server starts and responds — nothing about
# gigs, users, or payments lives here yet.

app = FastAPI(title="NexGiG API")

# Mounts everything under http://localhost:8000/api/v1/...
app.include_router(api_router, prefix="/api/v1")

# CORS: by default, browsers block a page on one origin (our Vite
# frontend, http://localhost:5173) from reading responses from a
# different origin (this API, http://localhost:8000). This middleware
# tells FastAPI to explicitly allow that specific frontend origin.
#
# In production, swap this list for your real deployed frontend URL
# (e.g. https://nexgig.vercel.app) — leaving "*" or localhost in a
# production config would defeat the point of the protection.
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
def health_check():
    """
    A 'health check' endpoint is a tiny convention: it does no
    real work, it just confirms the server is up and can respond.
    Deployment platforms (Railway, Render) and Docker can ping this
    to know if the backend is alive.
    """
    return {"status": "ok"}


