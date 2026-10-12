import { useEffect, useState } from "react";
import {
  getFriends,
  removeFriend
} from "../../services/friends.js";
import FriendCard from "./FriendCard.jsx";

function FriendList() {
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
  }, []);

  if (loading) {
    return <p>Loading friends...</p>;
  }

  if (error) {
    return <p>{error}</p>;
  }

  return (
    <div>
      <h2>My Friends</h2>

      {message && <p>{message}</p>}

      {friends.length === 0 ? (
        <p>You have no friends yet</p>
      ) : (
        <>
          <p>{friends.length} friends found</p>

          {friends.map((friendship) => (
            <FriendCard
              key={friendship.friendship_id}
              friendship={friendship}
              onRemove={handleRemoveFriend}
              isRemoving={removingId === friendship.friendship_id}
            />
          ))}
        </>
      )}
    </div>
  );
}

export default FriendList;
