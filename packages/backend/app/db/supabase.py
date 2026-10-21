import os
from pathlib import Path

from dotenv import load_dotenv
from supabase import create_client, Client

# Load environment variables from backend/env
env_path = Path(__file__).resolve().parents[2] / ".env"
load_dotenv(env_path)

def get_supabase_client() -> Client:
    url = os.getenv("SUPABASE_URL")
    key = os.getenv("SUPABASE_KEY")
    
    if not url or not key:
        raise RuntimeError(
            "Missing SUPABASE_URL or SUPABASE_KEY"
        )
    
    return create_client(url, key)

def get_user_supabase_client(access_token: str) -> Client:
    """
    Create a Supabase client authenticated
    as the current user
    """
    
    client = get_supabase_client()
    client.postgrest.auth(access_token)
    
    return client