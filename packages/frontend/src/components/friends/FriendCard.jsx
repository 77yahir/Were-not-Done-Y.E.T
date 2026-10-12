function FriendCard({ friendship, onRemove, isRemoving }) {
  return (
    <div>
      <p>{friendship.username}</p>

      <button
        type="button"
        onClick={() => onRemove(friendship.friendship_id)}
        disabled={isRemoving}>
        {isRemoving ? "Removing..." : "Remove Friend"}
      </button>
    </div>
  );
}

export default FriendCard;
