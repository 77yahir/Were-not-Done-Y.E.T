from app.db.supabase import get_user_supabase_client

def get_my_borrowed_games(access_token: str):
    client = get_user_supabase_client(access_token)

    result = (
        client.table("borrowing_records")
        .select(
        "borrowing_id, borrowed_at, due_at, returned_at, status, "
        "library_item:library_item_id("
        "owner_user_id, condition, "
        "board_game:board_game_id(title, genre)"
        ")"
        )
        .order("borrowed_at", desc=True)
        .execute()
    )

    return result.data