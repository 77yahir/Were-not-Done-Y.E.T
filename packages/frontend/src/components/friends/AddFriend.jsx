import { useState } from "react";
import {
  searchUsers,
  sendFriendRequest
} from "../../services/friends";

function AddFriend() {
  const [username, setUsername] = useState("");
  const [users, setUsers] = useState([]);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [sendingTo, setSendingTo] = useState(false);

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
      setMessage("Friend request sent!");
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
          <p>{user.username}</p>
          <button
            type="button"
            onClick={() => handleAddFriend(user.user_id)}
            disabled={sendingTo === user.user_id}>
            {sendingTo === user.user_id
              ? "Adding..."
              : "Add Friend"}
          </button>
        </div>
      ))}
    </div>
  );
}

export default AddFriend;
