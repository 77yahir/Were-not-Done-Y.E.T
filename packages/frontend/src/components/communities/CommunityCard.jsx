import { Link } from "react-router-dom";

export function CommunityCard({ community }) {
  return (
    <div>
      <Link to={`/communities/${community.group_id}`}>
        <h3>{community.name}</h3>
      </Link>

      <p>{community.description}</p>
      <p>Role: {community.role}</p>
    </div>
  );
}
