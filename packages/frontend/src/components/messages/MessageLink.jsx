import { Link } from "react-router-dom";

// Opens a conversation with this user from another page. Styled in
// App.css because the Friends and Community pages don't use Tailwind
function MessageLink({ userId }) {
  return (
    <Link to={`/messages/${userId}`} className="message-link">
      Message
    </Link>
  );
}

export default MessageLink;
