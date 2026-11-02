from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from fastapi import APIRouter, Depends, HTTPException

from app.core.auth import get_current_user
from app.services.borrowing import get_my_borrowed_games
router = APIRouter(prefix = "/api/borrowings", tags=["Borrowings"])

bearer = HTTPBearer()

@router.get("/")
def list_borrowed_games(
    user=Depends(get_current_user),
    credentials: HTTPAuthorizationCredentials = Depends(bearer)
):
    return get_my_borrowed_games(credentials.credentials)

