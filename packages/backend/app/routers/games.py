from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, Path, Query
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials

from app.core.auth import get_current_user
from app.schemas.games import LibraryItemCreate
from app.services.bgg import BoardGameSearchError, search_board_games, get_board_game
from app.services.games import add_game_to_library, remove_game_from_library, get_library

router = APIRouter(prefix="/api/games", tags=["Games"])

bearer = HTTPBearer()

@router.get("/search")
def search_games(
    query: str = Query(min_length=3, max_length=100),
    user= Depends(get_current_user)
):
    try:
        games = search_board_games(query.strip())
    except BoardGameSearchError as error:
        raise HTTPException(
            status_code=503,
            detail=f"Board game search is unavailable: {error}"
        )

    return {"games": games}

@router.get("/search/{bgg_id}")
def get_search_result(
    bgg_id: int = Path(ge=1),
    user= Depends(get_current_user)
):
    try:
        game = get_board_game(bgg_id)
    except BoardGameSearchError as error:
        raise HTTPException(
            status_code=503,
            detail=f"Board game search is unavailable: {error}"
        )

    if game is None:
        raise HTTPException(
            status_code=404,
            detail="Board game not found"
        )

    return {"game": game}

@router.post("/library")
def add_game(
    data: LibraryItemCreate,
    user= Depends(get_current_user),
    credentials: HTTPAuthorizationCredentials = Depends(bearer)
):
    library_item_id = add_game_to_library(
        title= data.title,
        min_players= data.min_players,
        max_players= data.max_players,
        genre= data.genre,
        description= data.description,
        condition= data.condition,
        image_url= data.image_url,
        min_age= data.min_age,
        avg_playing_time= data.avg_playing_time,
        access_token= credentials.credentials
    )

    return {"library_item_id": library_item_id}

@router.delete("/library/{library_item_id}")
def delete_game(
    library_item_id: UUID,
    user= Depends(get_current_user),
    credentials: HTTPAuthorizationCredentials = Depends(bearer)
):
    try:
        remove_game_from_library(
            library_item_id= str(library_item_id),
            access_token= credentials.credentials
        )

        return {"message": "Game removed successfully"}

    except ValueError:
        raise HTTPException(
            status_code=404,
            detail="Game not found or removal not allowed"
        )

@router.get("/library")
def get_games_list(
    user=Depends(get_current_user),
    credentials: HTTPAuthorizationCredentials = Depends(bearer)
):
    games = get_library(
        access_token=credentials.credentials
    )

    return {"games": games}
