from pydantic import BaseModel, StringConstraints
from typing import Annotated

class MessageCreate(BaseModel):
    body: Annotated[
        str,
        StringConstraints(
            strip_whitespace=True,
            min_length=1,
            max_length=2000
        )
    ]
