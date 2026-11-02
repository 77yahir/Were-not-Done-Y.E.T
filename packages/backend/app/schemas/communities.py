from pydantic import BaseModel, StringConstraints
from typing import Annotated
from pydantic import BaseModel
from typing import Literal

class CommunityCreate(BaseModel):
    name: Annotated[
        str,
        StringConstraints(
            strip_whitespace=True,
            min_length=1
        )
    ]
    description: str | None = None
    
class JoinRequestReview(BaseModel):
    decision: Literal["approved", "rejected"]
    