from fastapi import FastAPI, Depends

from app.core.auth import get_current_user

app = FastAPI(title="Board Buddies API")

@app.get("/api/health")
def health_check():
    return {"status": "ok"}

@app.get("/api/me")
def get_my_profile(user=Depends(get_current_user)):
    return {
        "id": str(user.id),
        "email": user.email,
    }