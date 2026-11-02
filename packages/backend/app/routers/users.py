from fastapi import APIRouter, HTTPException, status
from supabase import AuthApiError
from app.schemas.users import SignUp, SignIn
from app.services.users import create_user, sign_in_user

router = APIRouter(prefix="/api/users", tags=["Users"])

@router.post("/signup")
def signup(body: SignUp):
    return create_user(body.email, body.username, body.password)

@router.post("/signin")
def signin(body: SignIn):
    try:
        return sign_in_user(body.email, body.password)
    except AuthApiError as error:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=error.message,
            headers={"WWW-Authenticate": "Bearer"},
        )
