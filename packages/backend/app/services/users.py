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

def sign_in_user(email: str, password: str):
    guest = get_supabase_client()

    # Supabase Auth checks the password against its stored bcrypt hash
    # and issues a JWT session when it matches
    res = guest.auth.sign_in_with_password({
        "email": email,
        "password": password
    })

    return {
        "access_token": res.session.access_token,
        "refresh_token": res.session.refresh_token,
        "token_type": "bearer",
        "expires_in": res.session.expires_in,
        "user": {"id": res.user.id, "email": res.user.email}
    }
