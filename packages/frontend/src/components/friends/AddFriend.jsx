import { useState } from "react";
import {
  searchUsers,
  sendFriendRequest
} from "../../services/friends";
import { Link } from "react-router-dom";
import Avatar from "../ui/Avatar";
import Button from "../ui/Button";
import Notice from "../ui/Notice";
import Panel from "../ui/Panel";
import { IconSearch, IconUserPlus } from "../ui/icons";
import { fieldClass } from "../ui/styles";

// Failures in red, a sent request in green, anything else plain
function messageTone(message) {
  if (message.startsWith("Failed")) return "error";
  if (message === "Friend request sent!") return "success";
  return "muted";
}

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
    <Panel
      title="Search Users"
      icon={<IconUserPlus className="size-5" />}>
      <form onSubmit={handleSubmit} className="flex gap-2">
        <input
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          placeholder="Username"
          required
          className={`${fieldClass} min-w-0 flex-1`}
        />
        <Button type="submit" disabled={loading}>
          <IconSearch className="size-4" />
          {loading ? "Searching..." : "Search"}
        </Button>
      </form>

      {/* The message clears while a request is sent. Keeping its
          line stops the results jumping under the pointer */}
      {(message || users.length > 0) && (
        <div className="mt-3 min-h-5">
          {message && (
            <Notice
              tone={messageTone(message)}
              className="font-bold">
              {message}
            </Notice>
          )}
        </div>
      )}

      {users.length > 0 && (
        <ul className="mt-2 divide-y divide-parchment-300">
          {users.map((user) => (
            <li
              key={user.user_id}
              className="flex items-center gap-3 py-2.5">
              <Avatar name={user.username} />

              <span className="min-w-0 flex-1 wrap-anywhere">
                <Link
                  to={`/users/${user.user_id}`}
                  className="rounded-sm font-bold underline-offset-2 hover:text-forest-700 hover:underline">
                  {user.username}
                </Link>
              </span>

              <Button
                size="sm"
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
              </Button>
            </li>
          ))}
        </ul>
      )}
    </Panel>
  );
}

export default AddFriend;
