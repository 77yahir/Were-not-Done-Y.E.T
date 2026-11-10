import { ButtonLink } from "../ui/Button";
import { IconChat } from "../ui/icons";

// Opens a community's group chat from its Community page
function CommunityChatLink({ groupId }) {
  return (
    <ButtonLink
      to={`/messages/communities/${groupId}`}
      size="sm">
      <IconChat className="size-4" />
      Group chat
    </ButtonLink>
  );
}

export default CommunityChatLink;
