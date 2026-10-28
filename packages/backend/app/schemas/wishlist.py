from app.schemas.games import BoardGameCreate

# A wishlist game has the same details as a library game,
# minus the condition of a copy the user doesn't own yet
class WishlistItemCreate(BoardGameCreate):
    pass
