import ChatCard from "./ChatCard";

function getPreview(chat) {
  if (!chat.last_message) {
    return "No messages yet";
  }

  return `${chat.last_sender_username}: ${chat.last_message}`;
}

function CommunityChatCard({ chat }) {
  return (
    <ChatCard
      to={`/messages/communities/${chat.group_id}`}
      name={chat.name}
      preview={getPreview(chat)}
    />
  );
}

export default CommunityChatCard;
