from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from fastapi import APIRouter, Depends, HTTPException
from uuid import UUID
from postgrest.exceptions import APIError
from datetime import datetime, timedelta, timezone

from app.core.auth import get_current_user
from app.schemas.borrowing import BorrowingRequestCreate, BorrrowingRequestDecision
from app.services.borrowing import (
    get_my_borrowed_games, get_my_lending, request_borrow,
    respond_to_borrow_request, return_borrowed_game)

router = APIRouter(prefix = "/api/borrowings", tags=["Borrowings"])
bearer = HTTPBearer()

ERROR_STATUS = {
    "Not authenticated": 401,
    "You can only borrow from friends": 403,
    "You cannot borrow your own game": 403,
    "Game not found": 404,
    "Request not found": 404,
    "Active loan not found": 404,
    "Game is already borrowed": 409,
    "Due date must be in the future": 400,
    "Due date has already passed": 400,
    "You already requested this game": 409,
}

def raise_http(error: APIError):
    status = ERROR_STATUS.get(error.message)
    if status is None:
        raise error
    raise HTTPException(status_code=status, detail=error.message) from error

@router.get("/")
def list_borrowed_games(
    user=Depends(get_current_user),
    credentials: HTTPAuthorizationCredentials = Depends(bearer)
):
    return get_my_borrowed_games(credentials.credentials)

@router.get("/lending")
def list_my_lending(
    user=Depends(get_current_user),
    credentials: HTTPAuthorizationCredentials = Depends(bearer)
):
    return get_my_lending(credentials.credentials)

@router.post("/")
def create_borrow_request(
    data: BorrowingRequestCreate,
    user=Depends(get_current_user),
    credentials: HTTPAuthorizationCredentials = Depends(bearer)
):
    try:
        due_at = data.due_at or (datetime.now(timezone.utc) + timedelta(days=7))
        borrowing_id = request_borrow(
            library_item_id=str(data.library_item_id),
            due_at=due_at.isoformat(),
            access_token=credentials.credentials
        )
    except APIError as error:
        raise_http(error)
    return {"borrowing_id": borrowing_id}

@router.patch("/{borrowing_id}/decision")
def decide_borrow_request(
    borrowing_id: UUID,
    data: BorrrowingRequestDecision,
    user=Depends(get_current_user),
    credentials: HTTPAuthorizationCredentials = Depends(bearer)
):
    try:
        respond_to_borrow_request(
            str(borrowing_id), data.decision == "approved",
            credentials.credentials
        )
    except APIError as error:
        raise_http(error)
    return {"message": f"Request {data.decision}"}

@router.patch("/{borrowing_id}/return")
def mark_returned(
    borrowing_id: UUID,
    user=Depends(get_current_user),
    credentials: HTTPAuthorizationCredentials = Depends(bearer)
):
    try:
        return_borrowed_game(str(borrowing_id), credentials.credentials)
    except APIError as error:
        raise_http(error)
    return {"message": "Game marked as returned"}
