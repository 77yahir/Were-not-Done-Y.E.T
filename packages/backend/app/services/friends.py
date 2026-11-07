from app.db.supabase import get_user_supabase_client

def search_users(search_term: str, access_token: str):
    
    client = get_user_supabase_client(access_token)
    
    response = client.rpc(
        "search_users",
        {
            "search_term": search_term,
        }
    ).execute()
    
    return response.data

def send_friend_request(recipient_id: str, access_token: str):
    
    client = get_user_supabase_client(access_token)
    user = client.auth.get_user(access_token).user
    
    response = client.table("friendships").insert({
        "requester_user_id": str(user.id),
        "recipient_user_id": recipient_id,
        "status": "pending"
    }).execute()

    return response.data

def get_my_friend_requests(access_token: str):
    client = get_user_supabase_client(access_token)

    response = client.rpc(
        "get_my_friend_requests"
    ).execute()

    return response.data

def respond_to_friend_request(
    friendship_id: str,
    decision: str,
    access_token: str
):
    client = get_user_supabase_client(access_token)

    response = client.rpc(
        "respond_to_friend_request",
        {
            "p_friendship_id": friendship_id,
            "p_response": decision
        }
    ).execute()

    return response.data

def remove_friend(friendship_id: str, access_token: str):
    
    client = get_user_supabase_client(access_token)
    
    response = (
        client.table("friendships")
        .delete()
        .eq("friendship_id", friendship_id)
        .execute()
    )
    
    if not response.data:
        raise ValueError("Friendship not found or removal not allowed")
    
def get_friends(access_token: str):
    client = get_user_supabase_client(access_token)

    response = client.rpc(
        "get_accepted_friends"
    ).execute()

    return response.data


