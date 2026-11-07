import AddFriend from "../components/friends/AddFriend";
import FriendList from "../components/friends/FriendList";
import { FriendRequests } from "../components/friends/FriendRequests";
import { useState } from "react";

function Friends() {
  const [refreshVersion, setRefreshVersion] = useState(0);

  function refreshFriendData() {
    setRefreshVersion((current) => current + 1);
  }
  return (
    <div>
      <h1>Friends</h1>

      <AddFriend onFriendChanged={refreshFriendData} />
      <FriendList
        refreshVersion={refreshVersion}
        onFriendChanged={refreshFriendData}
      />
      <FriendRequests
        refreshVersion={refreshVersion}
        onFriendChanged={refreshFriendData}
      />
    </div>
  );
}

export default Friends;
