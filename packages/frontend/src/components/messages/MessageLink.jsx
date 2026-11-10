import { ButtonLink } from "../ui/Button";
import { IconChat } from "../ui/icons";

// Opens a conversation with this user from the Friends and
// Community pages
function MessageLink({ userId, className }) {
  return (
    <ButtonLink
      to={`/messages/${userId}`}
      variant="secondary"
      className={className}
      size="sm">
      <IconChat className="size-4" />
      Message
    </ButtonLink>
  );
}

export default MessageLink;
