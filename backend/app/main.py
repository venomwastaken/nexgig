from fastapi import FastAPI

# This is the entire backend for now. Its only job in Sprint 0
# is to prove the server starts and responds — nothing about
# gigs, users, or payments lives here yet.

app = FastAPI(title="NexGiG API")


@app.get("/health")
def health_check():
    """
    A 'health check' endpoint is a tiny convention: it does no
    real work, it just confirms the server is up and can respond.
    Deployment platforms (Railway, Render) and Docker can ping this
    to know if the backend is alive.
    """
    return {"status": "ok"}
