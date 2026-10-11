from fastapi import APIRouter, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials

from app.core.auth import get_current_user
from app.schemas.communities import CommunityCreate
from app.services.communities import create_community

router = APIRouter(prefix="/api/communities", tags=["Communities"])

bearer = HTTPBearer()

@router.post("/")
def create_community_endpoint(
    data: CommunityCreate,
    user= Depends(get_current_user),
    credentials: HTTPAuthorizationCredentials = Depends(bearer)
):
    community_id = create_community(
        name= data.name,
        description= data.description,
        access_token= credentials.credentials
    )
    
    return {"community_id": community_id}