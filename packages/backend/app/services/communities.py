from app.db.supabase import get_user_supabase_client

def create_community(name: str, description:  str | None, access_token: str):
    
    client = get_user_supabase_client(access_token)
    
    response = client.rpc(
        "create_community",
        {
            "p_name": name,
            "p_description": description
        }
    ).execute()
    
    return response.data

def review_join_request(
    membership_id: str,
    decision: str,
    access_token: str
):
    client = get_user_supabase_client(access_token)
    
    response = client.rpc(
        "review_join_request",
        {
            "p_membership_id": membership_id,
            "p_decision": decision
        }
    ).execute()
    
    return response.data

def get_pending_join_requests(
    group_id: str,
    access_token: str
):
    client = get_user_supabase_client(access_token)
    
    response = client.rpc(
        "get_pending_join_requests",
        {
            "p_group_id": group_id,
        }
    ).execute()
    
    return response.data

def get_my_community_permissions(
    group_id: str,
    access_token: str
):
    client = get_user_supabase_client(access_token)

    response = client.rpc(
        "get_my_community_permissions",
        {"p_group_id": group_id}
    ).execute()

    return response.data
