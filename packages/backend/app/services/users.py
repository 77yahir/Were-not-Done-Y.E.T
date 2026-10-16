from app.db.supabase import get_supabase_client

def create_user(email: str, username: str, password: str):
    guest = get_supabase_client()
    
    res = guest.auth.admin.create_user({
        "email": email,
        "password": password,
        "email_confirm": True
    })

    try:
        guest.table("users").insert({
            "user_id": res.user.id,
            "username": username,
            "email": email
        }).execute()
    except Exception:
        guest.auth.admin.delete_user(res.user.id)
        raise
    
    return {"id": res.user.id, "username": username}
