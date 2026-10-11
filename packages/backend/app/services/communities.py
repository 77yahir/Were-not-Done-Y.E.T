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