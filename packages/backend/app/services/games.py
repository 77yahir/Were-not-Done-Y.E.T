from app.db.supabase import get_user_supabase_client

def add_game_to_library(
    title: str,
    min_players: int,
    max_players: int,
    genre: str,
    description: str,
    condition: str,
    access_token: str
):

    client = get_user_supabase_client(access_token)

    response = client.rpc(
        "add_game_to_library",
        {
            "p_title": title,
            "p_min_players": min_players,
            "p_max_players": max_players,
            "p_genre": genre,
            "p_description": description,
            "p_condition": condition
        }
    ).execute()

    return response.data

def remove_game_from_library(library_item_id: str, access_token: str):

    client = get_user_supabase_client(access_token)

    response = (
        client.table("library_items")
        .delete()
        .eq("library_item_id", library_item_id)
        .execute()
    )

    if not response.data:
        raise ValueError("Game not found or removal not allowed")

def get_library(access_token: str):
    client = get_user_supabase_client(access_token)

    response = client.rpc(
        "get_my_library"
    ).execute()

    return response.data
