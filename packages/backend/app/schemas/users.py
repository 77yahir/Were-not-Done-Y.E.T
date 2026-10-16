from pydantic import BaseModel

class SignUp(BaseModel):
    email: str
    username: str
    password: str