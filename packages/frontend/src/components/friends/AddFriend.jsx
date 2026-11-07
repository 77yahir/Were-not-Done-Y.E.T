import { useState } from "react";
import {
  searchUsers,
  sendFriendRequest
} from "../../services/friends";
import { Link } from "react-router-dom";

function AddFriend({ onFriendChanged }) {
  const [username, setUsername] = useState("");
  const [users, setUsers] = useState([]);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [sendingTo, setSendingTo] = useState(null);
  const [requestedIds, setRequestedIds] = useState([]);

  async function handleSubmit(e) {
    e.preventDefault();
    setUsers([]);
    setLoading(true);
    setMessage("");

    try {
      const result = await searchUsers(username);
      if (result.users.length === 0) {
        setMessage("No users found");
      } else {
        setUsers(result.users);
        setMessage("Users found");
      }
    } catch (error) {
      setMessage("Failed to search users");
      console.error(error);
    } finally {
      setLoading(false);
    }
  }

  async function handleAddFriend(userId) {
    setSendingTo(userId);
    setMessage("");

    try {
      await sendFriendRequest(userId);

      setRequestedIds((current) =>
        current.includes(userId)
          ? current
          : [...current, userId]
      );

      setMessage("Friend request sent!");

      onFriendChanged?.();
    } catch (error) {
      setMessage("Failed to send friend request");
      console.error(error);
    } finally {
      setSendingTo(null);
    }
  }

  return (
    <div>
      {message && <p>{message}</p>}
      <h2>Search Users</h2>

      <form onSubmit={handleSubmit}>
        <input
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          placeholder="Username"
          required
        />
        <button type="submit" disabled={loading}>
          {loading ? "Searching..." : "Search"}
        </button>
      </form>
      {users.map((user) => (
        <div key={user.user_id}>
          <Link to={`/users/${user.user_id}`}>
            {user.username}
          </Link>
          <button
            type="button"
            onClick={() => handleAddFriend(user.user_id)}
            disabled={
              sendingTo !== null ||
              requestedIds.includes(user.user_id)
            }>
            {sendingTo === user.user_id
              ? "Adding..."
              : requestedIds.includes(user.user_id)
                ? "Request Sent"
                : "Add Friend"}
          </button>
        </div>
      ))}
    </div>
  );
}

export default AddFriend;
