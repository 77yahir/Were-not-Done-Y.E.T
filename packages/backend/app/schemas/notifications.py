from uuid import UUID
from pydantic import BaseModel

class NotificationCreate(BaseModel):
    recipient_id: UUID
    type: str
    message: str