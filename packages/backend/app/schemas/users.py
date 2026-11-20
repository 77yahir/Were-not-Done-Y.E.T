from pydantic import BaseModel, Field
from typing import Literal

class SignUp(BaseModel):
    email: str
    username: str
    password: str

class SignIn(BaseModel):
    email: str
    password: str
    
class UsernameUpdate(BaseModel):
    username: str = Field(min_length=3, max_length=75)
    
class AvatarUpdate(BaseModel):
    avatar_id: Literal[
        "meeple", "cat", "fox",
        "bear", "robot", "wizard"
    ] | None
