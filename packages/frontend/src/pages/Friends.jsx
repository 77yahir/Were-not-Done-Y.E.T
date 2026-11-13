import AddFriend from "../components/friends/AddFriend";
import FriendList from "../components/friends/FriendList";
import { FriendRequests } from "../components/friends/FriendRequests";
import { useState } from "react";
import PageHeader from "../components/ui/PageHeader";
import { IconUser } from "../components/ui/icons";

function Friends() {
  const [refreshVersion, setRefreshVersion] = useState(0);

  function refreshFriendData() {
    setRefreshVersion((current) => current + 1);
  }
  return (
    <div>
      <PageHeader
        title="Friends"
        subtitle="Find people to play with and keep up with your friends."
        icon={<IconUser className="size-8" />}
      />

      {/* Wide screens: your friends on the left, with searching and
          requests in a column on the right. Narrower, they stack */}
      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_22rem] lg:items-start xl:grid-cols-[minmax(0,1fr)_24rem]">
        <FriendList
          refreshVersion={refreshVersion}
          onFriendChanged={refreshFriendData}
        />

        <div className="flex min-w-0 flex-col gap-5">
          <AddFriend onFriendChanged={refreshFriendData} />
          <FriendRequests
            refreshVersion={refreshVersion}
            onFriendChanged={refreshFriendData}
          />
        </div>
      </div>
    </div>
  );
}

export default Friends;
