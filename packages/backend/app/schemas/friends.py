from pydantic import BaseModel
from uuid import UUID

class FriendRequestCreate(BaseModel):
    recipient_user_id: UUID
