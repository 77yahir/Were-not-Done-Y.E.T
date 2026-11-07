from typing import Literal
from pydantic import BaseModel
from uuid import UUID

class FriendRequestCreate(BaseModel):
    recipient_user_id: UUID
    
class FriendRequestDecision(BaseModel):
    decision: Literal["accepted", "declined"]
