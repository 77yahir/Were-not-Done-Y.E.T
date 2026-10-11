from pydantic import BaseModel, StringConstraints
from typing import Annotated

class CommunityCreate(BaseModel):
    name: Annotated[
        str,
        StringConstraints(
            strip_whitespace=True,
            min_length=1
        )
    ]
    description: str | None = None
    