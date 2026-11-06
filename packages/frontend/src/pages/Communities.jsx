import AddCommunity from "../components/communities/AddCommunity";
import { DiscoverableCommunities } from "../components/communities/DiscoverCommunities";
import { MyCommunities } from "../components/communities/MyCommunities";

function Communities() {
  return (
    <div>
      <h1>Communities</h1>
      <DiscoverableCommunities />
      <AddCommunity />
      <MyCommunities />
    </div>
  );
}

export default Communities;
