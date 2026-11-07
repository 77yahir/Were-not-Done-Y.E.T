import AddFriend from "../components/friends/AddFriend";
import FriendList from "../components/friends/FriendList";
import { FriendRequests } from "../components/friends/FriendRequests";

function Friends() {
  return (
    <div>
      <h1>Friends</h1>

      <AddFriend />
      <FriendList />
      <FriendRequests />
    </div>
  );
}

export default Friends;
