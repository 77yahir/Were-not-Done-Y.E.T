import { Link } from "react-router-dom";

function CommunityCard({ community }) {
  return (
    <Link to={`/communities/${community.group_id}`}>
      {community.name}
    </Link>
  );
}

export default CommunityCard;
