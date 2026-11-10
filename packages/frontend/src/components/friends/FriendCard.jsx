import { Link } from "react-router-dom";
import MessageLink from "../messages/MessageLink";
import Avatar from "../ui/Avatar";
import Button from "../ui/Button";

// One friend in the "My Friends" grid: their initial, their name
// (a link to their profile), and buttons to message or remove them.
// FriendList puts these in a list, so it's an <li>
function FriendCard({ friendship, onRemove, isRemoving }) {
  return (
    <li className="flex min-w-0 flex-col items-center gap-2 rounded-xl border border-parchment-300 bg-parchment-50 p-3 text-center shadow-sm shadow-black/10">
      <Avatar name={friendship.username} size="lg" />

      <Link
        to={`/users/${friendship.friend_user_id}`}
        className="max-w-full rounded-sm font-display text-lg leading-tight font-bold wrap-anywhere text-ink-900 underline-offset-2 hover:text-forest-700 hover:underline">
        {friendship.username}
      </Link>

      {/* A grid stretches both buttons to the card's width */}
      <div className="mt-auto grid w-full gap-2 pt-2">
        <MessageLink userId={friendship.friend_user_id} />

        <Button
          variant="danger"
          size="sm"
          className="w-full"
          onClick={() => onRemove(friendship.friendship_id)}
          disabled={isRemoving}>
          {isRemoving ? "Removing..." : "Remove Friend"}
        </Button>
      </div>
    </li>
  );
}

export default FriendCard;
