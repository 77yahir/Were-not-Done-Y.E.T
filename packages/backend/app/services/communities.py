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

def remove_community_member(
    group_id: str,
    user_id: str,
    access_token: str,
):
    client = get_user_supabase_client(access_token)
    
    response = client.rpc(
        "remove_community_member",
        {
            "p_group_id": group_id,
            "p_user_id": user_id
        }
    ).execute()
    
    return response.data

def get_community_members(
    group_id: str,
    access_token: str
):
    client = get_user_supabase_client(access_token)
    
    response = client.rpc(
        "get_community_members",
        {
            "p_group_id": group_id
        }
    ).execute()
    
    return response.data

def get_my_communities(access_token: str):
    client = get_user_supabase_client(access_token)

    response = client.rpc(
        "get_my_communities"
    ).execute()

    return response.data

def get_discoverable_communities(access_token: str):
    client = get_user_supabase_client(access_token)
    
    response = client.rpc(
        "get_discoverable_communities"
    ).execute()
    
    return response.data

def request_to_join_community(
    group_id: str,
    access_token: str
):
    client = get_user_supabase_client(access_token)
    
    response = client.rpc(
        "request_to_join_community",
        {
            "p_group_id": group_id
        }
    ).execute()
    
    return response.data
