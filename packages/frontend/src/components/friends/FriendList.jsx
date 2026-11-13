import { useEffect, useState } from "react";
import {
  getFriends,
  removeFriend
} from "../../services/friends.js";
import Notice from "../ui/Notice.jsx";
import Panel from "../ui/Panel.jsx";
import { IconUserPlus, IconUsers } from "../ui/icons.jsx";
import FriendCard from "./FriendCard.jsx";

// The "My Friends" card. It shows while the list loads too, so the
// page doesn't jump around
function FriendsPanel({ children }) {
  return (
    <Panel
      title="My Friends"
      icon={<IconUsers className="size-5" />}>
      {children}
    </Panel>
  );
}

function FriendList({ refreshVersion = 0, onFriendChanged }) {
  const [friends, setFriends] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [removingId, setRemovingId] = useState(null);

  async function handleRemoveFriend(friendshipId) {
    setRemovingId(friendshipId);
    setMessage("");

    try {
      await removeFriend(friendshipId);

      setFriends((current) =>
        current.filter(
          (friendship) =>
            friendship.friendship_id !== friendshipId
        )
      );

      setMessage("Friend removed successfully");

      onFriendChanged?.();
    } catch (error) {
      setMessage("Failed to remove friend");
      console.error(error);
    } finally {
      setRemovingId(null);
    }
  }

  useEffect(() => {
    let active = true;

    async function loadFriends() {
      try {
        const result = await getFriends();
        if (active) {
          setFriends(result.friends);
        }
      } catch (error) {
        if (active) {
          setError("Failed to load friends");
          console.error(error);
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    loadFriends();

    return () => {
      active = false;
    };
  }, [refreshVersion]);

  if (loading) {
    return (
      <FriendsPanel>
        <Notice>Loading friends...</Notice>
      </FriendsPanel>
    );
  }

  if (error) {
    return (
      <FriendsPanel>
        <Notice tone="error">{error}</Notice>
      </FriendsPanel>
    );
  }

  return (
    <FriendsPanel>
      {/* The count holds this line open, so the cards don't jump
          when the message clears during a removal */}
      {(message || friends.length > 0) && (
        <div className="mb-4 flex min-h-5 flex-wrap items-center gap-x-3 gap-y-1">
          {message && (
            <Notice
              tone={
                message.startsWith("Failed")
                  ? "error"
                  : "success"
              }
              className="font-bold">
              {message}
            </Notice>
          )}

          {friends.length > 0 && (
            <p className="ml-auto text-sm font-bold text-ink-700">
              {friends.length} friends found
            </p>
          )}
        </div>
      )}

      {friends.length === 0 ? (
        <div className="flex flex-col items-center gap-2 py-8 text-center">
          <IconUserPlus className="size-10 text-parchment-400" />
          <Notice>You have no friends yet</Notice>
        </div>
      ) : (
        <ul className="grid grid-cols-[repeat(auto-fill,minmax(10rem,1fr))] gap-3">
          {friends.map((friendship) => (
            <FriendCard
              key={friendship.friendship_id}
              friendship={friendship}
              onRemove={handleRemoveFriend}
              isRemoving={
                removingId === friendship.friendship_id
              }
            />
          ))}
        </ul>
      )}
    </FriendsPanel>
  );
}

export default FriendList;
