from uuid import UUID
from fastapi import APIRouter, Depends, Query, HTTPException
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials

from app.core.auth import get_current_user
from app.schemas.friends import FriendRequestCreate
from app.services.friends import search_users, send_friend_request, remove_friend, get_friends

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
    friendships = send_friend_request(
        recipient_id= str(data.recipient_user_id),
        access_token= credentials.credentials
    )
    
    friendship_id = friendships[0]["friendship_id"]
    
    return {"friendship_id": friendship_id}
    
@router.delete("/requests/{friendship_id}")
def delete_friend(
    friendship_id= UUID,
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


