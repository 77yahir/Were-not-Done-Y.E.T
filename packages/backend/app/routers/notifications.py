from fastapi import APIRouter, Depends, HTTPException
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from uuid import UUID

from app.core.auth import get_current_user
from app.services.notifications import get_notifications, mark_as_read

router = APIRouter(prefix="/api/notifications", tags=["Notifications"])

bearer = HTTPBearer()

@router.get("/")
def list_notifications(
    user=Depends(get_current_user),
    credentials: HTTPAuthorizationCredentials=Depends(bearer)
):
    return get_notifications(access_token=credentials.credentials)

@router.patch("/{notification_id}/read")
def read_notifications(
    notification_id: UUID,
    user=Depends(get_current_user),
    credentials: HTTPAuthorizationCredentials=Depends(bearer)
):
    try:
        return mark_as_read(notification_id, access_token=credentials.credentials)
    except ValueError:
        raise HTTPException(
            status_code = 404, 
            detail="Notification not found"
        )