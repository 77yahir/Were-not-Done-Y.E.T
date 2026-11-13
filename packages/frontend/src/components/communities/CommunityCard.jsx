import { Link } from "react-router-dom";
import Avatar from "../ui/Avatar";
import RolePill from "./RolePill";

// One of your communities. Its badge and name link to its page
export function CommunityCard({ community }) {
  return (
    <div className="rounded-xl border border-parchment-300 bg-parchment-50 p-3 shadow-sm shadow-black/10">
      <div className="flex items-center gap-2">
        <Link
          to={`/communities/${community.group_id}`}
          className="group flex min-w-0 flex-1 items-center gap-3 rounded-lg">
          <Avatar name={community.name} />

          <h3 className="min-w-0 text-lg leading-tight font-bold wrap-anywhere group-hover:text-forest-700 group-hover:underline">
            {community.name}
          </h3>
        </Link>

        <p className="shrink-0">
          <RolePill role={community.role} />
        </p>
      </div>

      <p className="mt-2 text-sm text-ink-700 wrap-anywhere empty:hidden">
        {community.description}
      </p>
    </div>
  );
}
