from fastapi import APIRouter, HTTPException, status, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from supabase import AuthApiError
from app.core.auth import get_current_user
from app.schemas.users import SignUp, SignIn, UsernameUpdate, AvatarUpdate
from app.services.users import create_user, sign_in_user, get_user_profile, get_user_library, update_my_username, update_my_avatar
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
        
@router.patch("/me")
def update_my_username_endpoint(
    data: UsernameUpdate,
    user=Depends(get_current_user),
    credentials: HTTPAuthorizationCredentials = Depends(bearer)
):
    try:
        username = update_my_username(
            username=data.username,
            access_token=credentials.credentials
        )

        return {"username": username}

    except APIError as error:
        if "Username already taken" in error.message:
            raise HTTPException(
                status_code=409,
                detail="Username already taken"
            ) from error

        if "Username must be" in error.message:
            raise HTTPException(
                status_code=422,
                detail=error.message
            ) from error

        raise
    
@router.patch("/me/avatar")
def update_my_avatar_endpoint(
    body: AvatarUpdate,
    user=Depends(get_current_user),
    credentials: HTTPAuthorizationCredentials = Depends(bearer)
):
    avatar_id = update_my_avatar(
        avatar_id=body.avatar_id,
        access_token=credentials.credentials
    )

    return {"avatar_id": avatar_id}

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


