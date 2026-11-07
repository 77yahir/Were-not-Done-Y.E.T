import { Link } from "react-router-dom";
import MessageLink from "../messages/MessageLink";

function FriendCard({ friendship, onRemove, isRemoving }) {
  return (
    <div>
      <Link to={`/users/${friendship.friend_user_id}`}>
        {friendship.username}
      </Link>

      <MessageLink userId={friendship.friend_user_id} />

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
