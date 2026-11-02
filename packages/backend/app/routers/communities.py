from fastapi import APIRouter, Depends, HTTPException
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from uuid import UUID

from app.core.auth import get_current_user
from app.schemas.communities import CommunityCreate, JoinRequestReview
from app.services.communities import create_community, review_join_request, get_pending_join_requests, get_my_community_permissions
from postgrest.exceptions import APIError

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

@router.patch("/requests/{membership_id}/review")
def review_join_request_endpoint(
    membership_id: UUID,
    data: JoinRequestReview,
    user = Depends(get_current_user),
    credentials: HTTPAuthorizationCredentials = Depends(bearer)
):
    try:
        review_join_request(
            membership_id= str(membership_id),
            decision= data.decision,
            access_token=credentials.credentials
        )
        return {"message": "Join request reviewed successfully"}
    except APIError as error:
        if error.message == "Pending request not found":
            raise HTTPException(
                status_code=404,
                detail="Pending request not found"
            ) from error
            
        if error.message == "Request could not be updated":
            raise HTTPException(
                status_code=409,
                detail="Request could not be updated"
            ) from error
            
        if error.message == "Not authorized to review requests":
            raise HTTPException(
                status_code=403,
                detail="Not authorized to review requests"
            ) from error
            
        raise

@router.get("/{group_id}/requests")
def get_pending_join_requests_endpoint(
    group_id: UUID,
    user = Depends(get_current_user),
    credentials: HTTPAuthorizationCredentials = Depends(bearer)
):
    try:
        pending_requests = get_pending_join_requests(
            group_id=str(group_id),
            access_token=credentials.credentials
        )
        
        return {"requests": pending_requests}
    except APIError as error:
        if error.message == "Not authorized to view requests":
            raise HTTPException(
                status_code=403,
                detail="Not authorized to view requests"
            ) from error
            
        raise
    
@router.get("/{group_id}/membership/me")
def get_my_community_permissions_endpoint(
    group_id: UUID,
    user=Depends(get_current_user),
    credentials: HTTPAuthorizationCredentials = Depends(bearer)
):
    try:
        permissions = get_my_community_permissions(
            group_id=str(group_id),
            access_token=credentials.credentials
        )

        if not permissions:
            raise HTTPException(
                status_code=404,
                detail="Community permissions not found"
            )

        return permissions[0]

    except APIError as error:
        if error.message == "Community not found":
            raise HTTPException(
                status_code=404,
                detail="Community not found"
            ) from error

        if error.message == "Not authenticated":
            raise HTTPException(
                status_code=401,
                detail="Not authenticated"
            ) from error

        raise

    
    
    
