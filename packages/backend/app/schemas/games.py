from pydantic import BaseModel, Field, StringConstraints, model_validator
from typing import Annotated, Literal

# Board game details shared by library and wishlist items
class BoardGameCreate(BaseModel):
    title: Annotated[
        str,
        StringConstraints(
            strip_whitespace=True,
            min_length=1,
            max_length=100
        )
    ]
    min_players: int = Field(ge=1)
    max_players: int = Field(ge=1)
    genre: Annotated[
        str,
        StringConstraints(
            strip_whitespace=True,
            min_length=1,
            max_length=50
        )
    ]
    description: Annotated[
        str,
        StringConstraints(
            strip_whitespace=True,
            min_length=1,
            max_length=300
        )
    ]

    @model_validator(mode="after")
    def check_player_count(self):
        if self.max_players < self.min_players:
            raise ValueError("max_players must be at least min_players")
        return self

class LibraryItemCreate(BoardGameCreate):
    condition: Literal["new", "like_new", "good", "fair", "poor"]
