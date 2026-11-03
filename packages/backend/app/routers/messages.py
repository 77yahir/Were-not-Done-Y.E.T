from fastapi import APIRouter, Depends, HTTPException
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from postgrest.exceptions import APIError
from uuid import UUID

from app.core.auth import get_current_user
from app.schemas.messages import MessageCreate
from app.services.messages import get_conversations, get_unread_count, get_messages, send_message, mark_conversation_read

router = APIRouter(prefix="/api/messages", tags=["Messages"])

bearer = HTTPBearer()

@router.get("/conversations")
def list_conversations(
    user=Depends(get_current_user),
    credentials: HTTPAuthorizationCredentials = Depends(bearer)
):
    conversations = get_conversations(
        access_token=credentials.credentials
    )

    return {"conversations": conversations}

@router.get("/unread-count")
def get_unread_message_count(
    user=Depends(get_current_user),
    credentials: HTTPAuthorizationCredentials = Depends(bearer)
):
    unread_count = get_unread_count(
        access_token=credentials.credentials
    )

    return {"unread_count": unread_count}

@router.get("/conversations/{user_id}")
def list_messages(
    user_id: UUID,
    user=Depends(get_current_user),
    credentials: HTTPAuthorizationCredentials = Depends(bearer)
):
    messages = get_messages(
        other_user_id=str(user_id),
        access_token=credentials.credentials
    )

    return {"messages": messages}

@router.post("/conversations/{user_id}")
def add_message(
    user_id: UUID,
    data: MessageCreate,
    user=Depends(get_current_user),
    credentials: HTTPAuthorizationCredentials = Depends(bearer)
):
    try:
        message_id = send_message(
            recipient_id=str(user_id),
            body=data.body,
            access_token=credentials.credentials
        )

        return {"message_id": message_id}

    except APIError as error:
        if error.message == "You can only message friends or community members":
            raise HTTPException(
                status_code=403,
                detail="You can only message friends or community members"
            ) from error

        raise

@router.patch("/conversations/{user_id}/read")
def read_conversation(
    user_id: UUID,
    user=Depends(get_current_user),
    credentials: HTTPAuthorizationCredentials = Depends(bearer)
):
    mark_conversation_read(
        other_user_id=str(user_id),
        access_token=credentials.credentials
    )

    return {"message": "Conversation marked as read"}
