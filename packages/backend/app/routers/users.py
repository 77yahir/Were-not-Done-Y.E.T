from fastapi import APIRouter
from app.schemas.users import SignUp
from app.services.users import create_user

router = APIRouter(prefix="/api/users", tags=["Users"])

@router.post("/signup")
def signup(body: SignUp):
    return create_user(body.email, body.username, body.password)