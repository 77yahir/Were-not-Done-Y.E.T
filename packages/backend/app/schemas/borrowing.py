from datetime import datetime
from typing import Literal
from uuid import UUID
from pydantic import BaseModel

class BorrowingRequestCreate(BaseModel):
    library_item_id: UUID
    due_at: datetime | None = None

class BorrrowingRequestDecision(BaseModel):
    decision: Literal["approved", "declined"]