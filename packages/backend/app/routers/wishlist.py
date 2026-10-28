from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials

from app.core.auth import get_current_user
from app.schemas.wishlist import WishlistItemCreate
from app.services.wishlist import add_game_to_wishlist, remove_game_from_wishlist, get_wishlist

router = APIRouter(prefix="/api/wishlist", tags=["Wishlist"])

bearer = HTTPBearer()

@router.post("")
def add_game(
    data: WishlistItemCreate,
    user= Depends(get_current_user),
    credentials: HTTPAuthorizationCredentials = Depends(bearer)
):
    try:
        wishlist_item_id = add_game_to_wishlist(
            title= data.title,
            min_players= data.min_players,
            max_players= data.max_players,
            genre= data.genre,
            description= data.description,
            access_token= credentials.credentials
        )

        return {"wishlist_item_id": wishlist_item_id}

    except ValueError:
        raise HTTPException(
            status_code=409,
            detail="Game is already on your wishlist"
        )

@router.delete("/{wishlist_item_id}")
def delete_game(
    wishlist_item_id: UUID,
    user= Depends(get_current_user),
    credentials: HTTPAuthorizationCredentials = Depends(bearer)
):
    try:
        remove_game_from_wishlist(
            wishlist_item_id= str(wishlist_item_id),
            access_token= credentials.credentials
        )

        return {"message": "Game removed from wishlist"}

    except ValueError:
        raise HTTPException(
            status_code=404,
            detail="Game not found or removal not allowed"
        )

@router.get("")
def get_wishlist_games(
    user=Depends(get_current_user),
    credentials: HTTPAuthorizationCredentials = Depends(bearer)
):
    games = get_wishlist(
        access_token=credentials.credentials
    )

    return {"games": games}
