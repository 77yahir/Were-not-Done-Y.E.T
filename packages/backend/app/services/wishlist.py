from postgrest.exceptions import APIError

from app.db.supabase import get_user_supabase_client

# add_game_to_wishlist raises this when the title is already listed
DUPLICATE_GAME_CODE = "23505"

def add_game_to_wishlist(
    title: str,
    min_players: int,
    max_players: int,
    genre: str,
    description: str,
    image_url: str | None,
    min_age: int | None,
    avg_playing_time: int | None,
    access_token: str
):

    client = get_user_supabase_client(access_token)

    try:
        response = client.rpc(
            "add_game_to_wishlist",
            {
                "p_title": title,
                "p_min_players": min_players,
                "p_max_players": max_players,
                "p_genre": genre,
                "p_description": description,
                "p_image_url": image_url,
                "p_min_age": min_age,
                "p_avg_playing_time": avg_playing_time
            }
        ).execute()
    except APIError as error:
        if error.code == DUPLICATE_GAME_CODE:
            raise ValueError("Game is already on your wishlist")
        raise

    return response.data

def remove_game_from_wishlist(wishlist_item_id: str, access_token: str):

    client = get_user_supabase_client(access_token)

    response = (
        client.table("wishlist_items")
        .delete()
        .eq("wishlist_item_id", wishlist_item_id)
        .execute()
    )

    if not response.data:
        raise ValueError("Game not found or removal not allowed")

def get_wishlist(access_token: str):
    client = get_user_supabase_client(access_token)

    response = client.rpc(
        "get_my_wishlist"
    ).execute()

    return response.data
