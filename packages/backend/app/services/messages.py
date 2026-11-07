from app.db.supabase import get_user_supabase_client

def get_conversations(access_token: str):
    client = get_user_supabase_client(access_token)

    response = client.rpc(
        "get_my_conversations"
    ).execute()

    return response.data

def get_unread_count(access_token: str):
    client = get_user_supabase_client(access_token)

    response = client.rpc(
        "get_unread_message_count"
    ).execute()

    return response.data

def get_messages(other_user_id: str, access_token: str):
    client = get_user_supabase_client(access_token)

    response = client.rpc(
        "get_conversation",
        {
            "p_other_user_id": other_user_id
        }
    ).execute()

    # The database sends newest first; a conversation reads oldest first
    return list(reversed(response.data))

def send_message(recipient_id: str, body: str, access_token: str):
    client = get_user_supabase_client(access_token)

    response = client.rpc(
        "send_message",
        {
            "p_recipient_user_id": recipient_id,
            "p_body": body
        }
    ).execute()

    return response.data

def mark_conversation_read(other_user_id: str, access_token: str):
    client = get_user_supabase_client(access_token)

    client.rpc(
        "mark_conversation_read",
        {
            "p_other_user_id": other_user_id
        }
    ).execute()

def get_community_chats(access_token: str):
    client = get_user_supabase_client(access_token)

    response = client.rpc(
        "get_my_community_chats"
    ).execute()

    return response.data

def get_community_messages(group_id: str, access_token: str):
    client = get_user_supabase_client(access_token)

    response = client.rpc(
        "get_community_messages",
        {
            "p_group_id": group_id
        }
    ).execute()

    # The database sends newest first; a chat reads oldest first
    return list(reversed(response.data))

def send_community_message(group_id: str, body: str, access_token: str):
    client = get_user_supabase_client(access_token)

    response = client.rpc(
        "send_community_message",
        {
            "p_group_id": group_id,
            "p_body": body
        }
    ).execute()

    return response.data
