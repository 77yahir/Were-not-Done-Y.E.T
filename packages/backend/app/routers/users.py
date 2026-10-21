from fastapi import APIRouter, Depends
from uuid import UUID
from app.schemas.users import SignUp
from app.services.users import create_user, delete_user
from app.core.auth import get_current_user

router = APIRouter(prefix="/api/users", tags=["Users"])

@router.post("/signup")
def signup(body: SignUp):
    return create_user(body.email, body.username, body.password)