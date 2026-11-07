import { Link } from "react-router-dom";

// Opens a community's group chat from its Community page. Styled in
// App.css because the Community pages don't use Tailwind
function CommunityChatLink({ groupId }) {
  return (
    <Link
      to={`/messages/communities/${groupId}`}
      className="message-link">
      Group chat
    </Link>
  );
}

export default CommunityChatLink;
