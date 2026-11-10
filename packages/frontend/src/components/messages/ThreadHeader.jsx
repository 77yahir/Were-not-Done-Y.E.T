import Avatar from "../ui/Avatar";
import { ButtonLink } from "../ui/Button";
import { IconArrowLeft } from "../ui/icons";

// The top of an open conversation or group chat. Back only shows on
// small screens, where the list and the chat don't fit side by side
function ThreadHeader({ name }) {
  return (
    <div className="flex items-center gap-3 border-b border-parchment-300 pb-3">
      <ButtonLink
        to="/messages"
        variant="ghost"
        size="sm"
        className="-ml-2 min-h-9 md:hidden">
        <IconArrowLeft className="size-4" />
        Back
      </ButtonLink>

      <Avatar name={name} />

      <h2 className="min-w-0 truncate text-xl font-bold">
        {name}
      </h2>
    </div>
  );
}

export default ThreadHeader;
