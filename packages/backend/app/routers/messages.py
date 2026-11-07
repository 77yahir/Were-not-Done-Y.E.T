from fastapi import APIRouter, Depends, HTTPException
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from postgrest.exceptions import APIError
from uuid import UUID

from app.core.auth import get_current_user
from app.schemas.messages import MessageCreate
from app.services.messages import get_conversations, get_unread_count, get_messages, send_message, mark_conversation_read, get_community_chats, get_community_messages, send_community_message

router = APIRouter(prefix="/api/messages", tags=["Messages"])

bearer = HTTPBearer()

# Raised by the database for anyone who isn't an approved member
NOT_A_COMMUNITY_MEMBER = "Only community members can use this chat"

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

@router.get("/communities")
def list_community_chats(
    user=Depends(get_current_user),
    credentials: HTTPAuthorizationCredentials = Depends(bearer)
):
    chats = get_community_chats(
        access_token=credentials.credentials
    )

    return {"chats": chats}

@router.get("/communities/{group_id}")
def list_community_messages(
    group_id: UUID,
    user=Depends(get_current_user),
    credentials: HTTPAuthorizationCredentials = Depends(bearer)
):
    try:
        messages = get_community_messages(
            group_id=str(group_id),
            access_token=credentials.credentials
        )

        return {"messages": messages}

    except APIError as error:
        if error.message == NOT_A_COMMUNITY_MEMBER:
            raise HTTPException(
                status_code=403,
                detail=NOT_A_COMMUNITY_MEMBER
            ) from error

        raise

@router.post("/communities/{group_id}")
def add_community_message(
    group_id: UUID,
    data: MessageCreate,
    user=Depends(get_current_user),
    credentials: HTTPAuthorizationCredentials = Depends(bearer)
):
    try:
        message_id = send_community_message(
            group_id=str(group_id),
            body=data.body,
            access_token=credentials.credentials
        )

        return {"message_id": message_id}

    except APIError as error:
        if error.message == NOT_A_COMMUNITY_MEMBER:
            raise HTTPException(
                status_code=403,
                detail=NOT_A_COMMUNITY_MEMBER
            ) from error

        raise
