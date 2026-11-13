from app.db.supabase import get_user_supabase_client

def get_my_borrowed_games(access_token: str):
    client = get_user_supabase_client(access_token)
    user = client.auth.get_user(access_token).user

    result = (
        client.table("borrowing_records")
        .select(
        "borrowing_id, borrowed_at, due_at, returned_at, status, "
        "library_item:library_item_id("
        "owner_user_id, condition, "
        "board_game:board_game_id(title, genre, description, min_players, "
        "max_players, image_url, min_age, avg_playing_time)"
        ")"
        )
        .eq("borrower_user_id", str(user.id))
        .order("borrowed_at", desc=True)
        .execute()
    )

    return result.data

def get_my_lending(access_token: str):
    client = get_user_supabase_client(access_token)
    return client.rpc("get_my_lending").execute().data

def request_borrow(library_item_id: str, due_at: str, access_token: str):
    client = get_user_supabase_client(access_token)
    return client.rpc("request_borrow", {
        "p_library_item_id": library_item_id,
        "p_due_at": due_at
    }).execute().data

def respond_to_borrow_request(borrowing_id: str, approve: bool, access_token: str):
    client = get_user_supabase_client(access_token)
    client.rpc("respond_to_borrow_request", {
        "p_borrowing_id": borrowing_id,
        "p_approve": approve
    }).execute()

def return_borrowed_game(borrowing_id: str, access_token: str):
    client = get_user_supabase_client(access_token)
    client.rpc("return_borrowed_game", {
        "p_borrowing_id": borrowing_id
    }).execute()