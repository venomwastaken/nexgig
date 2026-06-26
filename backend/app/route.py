from fastapi import Depends, FastAPI
from fastapi_clerk_auth import ClerkHTTPBearer


app = FastAPI()
clerk_auth = ClerkHTTPBearer()

@app.get("/me")
async def me(claims: dict = Depends(clerk_auth)):
    return {"user_id": claims["sub"]}