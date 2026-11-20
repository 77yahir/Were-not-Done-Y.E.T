from uuid import UUID
from fastapi import APIRouter, Depends, Query, HTTPException
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from postgrest.exceptions import APIError

from app.core.auth import get_current_user
from app.schemas.friends import FriendRequestCreate, FriendRequestDecision
from app.services.friends import search_users, send_friend_request, remove_friend, get_friends, respond_to_friend_request, get_my_friend_requests

router = APIRouter(prefix="/api/friends", tags=["Friends"])

bearer = HTTPBearer()

@router.get("/search")
def search_friends(
    username: str = Query(min_length=2, max_length=75),
    user= Depends(get_current_user),
    credentials: HTTPAuthorizationCredentials = Depends(bearer)
):
    users = search_users(
        search_term= username,
        access_token= credentials.credentials
    )
    
    return {"users": users}

@router.post("/requests")
def add_friend(
    data: FriendRequestCreate,
    user= Depends(get_current_user),
    credentials: HTTPAuthorizationCredentials = Depends(bearer)
):
    try:
        friendships = send_friend_request(
            recipient_id=str(data.recipient_user_id),
            access_token=credentials.credentials
        )

    except APIError as error:
        message = error.message or ""

        if (
            error.code == "23505"
            or message == "Friend request or friendship already exists"
        ):
            raise HTTPException(
                status_code=409,
                detail="A friend request or friendship already exists"
            ) from error

        if message == "Cannot send a friend request to yourself":
            raise HTTPException(
                status_code=400,
                detail=message
            ) from error

        if message == "Recipient not found":
            raise HTTPException(
                status_code=404,
                detail=message
            ) from error

        raise

    
@router.delete("/friendships/{friendship_id}")
def delete_friend(
    friendship_id: UUID,
    user= Depends(get_current_user),
    credentials: HTTPAuthorizationCredentials = Depends(bearer)
):
    try:
        remove_friend(
            friendship_id= str(friendship_id),
            access_token= credentials.credentials
        )
    
        return {"message": "Friend removed successfully"}

    except ValueError:
        raise HTTPException(
            status_code=404,
            detail="Friendship not found or removal not allowed"
        )
    
@router.get("/friendships")
def get_friends_list(
    user=Depends(get_current_user),
    credentials: HTTPAuthorizationCredentials = Depends(bearer)
):
    friends = get_friends(
        access_token=credentials.credentials
    )

    return {"friends": friends}

@router.patch("/requests/{friendship_id}")
def respond_to_friend_request_endpoint(
    friendship_id: UUID,
    data: FriendRequestDecision,
    user=Depends(get_current_user),
    credentials: HTTPAuthorizationCredentials = Depends(bearer)
):
    try:
        respond_to_friend_request(
            friendship_id=str(friendship_id),
            decision=data.decision,
            access_token=credentials.credentials
        )

        return {"message": "Friend request reviewed successfully"}

    except APIError as error:
        if error.message == "Request not found or action not allowed":
            raise HTTPException(
                status_code=404,
                detail="Request not found or action not allowed"
            ) from error

        raise

@router.get("/requests")
def get_my_friend_requests_endpoint(
    user=Depends(get_current_user),
    credentials: HTTPAuthorizationCredentials = Depends(bearer)
):
    requests = get_my_friend_requests(
        access_token=credentials.credentials
    )

    return {"requests": requests}





