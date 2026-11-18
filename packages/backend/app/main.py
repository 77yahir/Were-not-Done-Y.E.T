import os

from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware

from app.core.auth import get_current_user
from app.routers.communities import router as community_router
from app.routers.friends import router as friend_router
from app.routers.users import router as user_router
from app.routers.games import router as game_router
from app.routers.wishlist import router as wishlist_router
from app.routers.notifications import router as notification_router
from app.routers.borrowing import router as borrowing_router
from app.routers.messages import router as message_router

app = FastAPI(title="Board Buddies API")

# The deployed frontend is on a different domain from this API, and the
# browser only lets it call the API if the API names that domain.
# CORS_ORIGINS lists them, comma-separated. Locally nothing needs
# listing, because Vite's dev server forwards /api to this API
cors_origins = [
    origin.strip().rstrip("/")
    for origin in os.getenv("CORS_ORIGINS", "").split(",")
    if origin.strip()
]

if cors_origins:
    app.add_middleware(
        CORSMiddleware,
        allow_origins=cors_origins,
        allow_methods=["*"],
        allow_headers=["*"],
    )

app.include_router(community_router)
app.include_router(friend_router)
app.include_router(user_router)
app.include_router(game_router)
app.include_router(wishlist_router)
app.include_router(notification_router)
app.include_router(borrowing_router)
app.include_router(message_router)


@app.get("/api/health")
def health_check():
    return {"status": "ok"}

@app.get("/api/me")
def get_my_profile(user=Depends(get_current_user)):
    return {
        "id": str(user.id),
        "email": user.email,
    }

