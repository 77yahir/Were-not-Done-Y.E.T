from fastapi import FastAPI, Depends

from app.core.auth import get_current_user
from app.routers.communities import router as community_router
from app.routers.friends import router as friend_router
from app.routers.games import router as game_router

app = FastAPI(title="Board Buddies API")
app.include_router(community_router)
app.include_router(friend_router)
app.include_router(game_router)


@app.get("/api/health")
def health_check():
    return {"status": "ok"}

@app.get("/api/me")
def get_my_profile(user=Depends(get_current_user)):
    return {
        "id": str(user.id),
        "email": user.email,
    }

