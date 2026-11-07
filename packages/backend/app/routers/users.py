from fastapi import APIRouter, HTTPException, status, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from supabase import AuthApiError
from app.core.auth import get_current_user
from app.schemas.users import SignUp, SignIn
from app.services.users import create_user, sign_in_user, get_user_profile, get_user_library
from uuid import UUID
from postgrest.exceptions import APIError

router = APIRouter(prefix="/api/users", tags=["Users"])
bearer = HTTPBearer()

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

@router.get("/{user_id}")
def get_user_profile_endpoint(
    user_id: UUID,
    user=Depends(get_current_user),
    credentials: HTTPAuthorizationCredentials = Depends(bearer)
):
    profile = get_user_profile(
        user_id=str(user_id),
        access_token=credentials.credentials
    )

    if profile is None:
        raise HTTPException(
            status_code=404,
            detail="User profile not found"
        )

    return {"profile": profile}


@router.get("/{user_id}/library")
def get_user_library_endpoint(
    user_id: UUID,
    user=Depends(get_current_user),
    credentials: HTTPAuthorizationCredentials = Depends(bearer)
):
    try:
        games = get_user_library(
            user_id=str(user_id),
            access_token=credentials.credentials
        )

        return {"games": games}

    except APIError as error:
        if error.message == "Not authorized to view library":
            raise HTTPException(
                status_code=403,
                detail="Not authorized to view library"
            ) from error

        if error.message == "Not authenticated":
            raise HTTPException(
                status_code=401,
                detail="Not authenticated"
            ) from error

        raise
