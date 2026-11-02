import AddCommunity from "../components/communities/AddCommunity";
import { MyCommunities } from "../components/communities/MyCommunities";

function Communities() {
  return (
    <div>
      <h1>Communities</h1>
      <AddCommunity />
      <MyCommunities />
    </div>
  );
}

export default Communities;
