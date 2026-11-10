import ChatCard from "./ChatCard";

function getPreview(conversation) {
  if (conversation.last_message) {
    return conversation.last_message;
  }

  return conversation.is_friend ? "Friend" : "Community member";
}

function ConversationCard({ conversation }) {
  return (
    <ChatCard
      to={`/messages/${conversation.user_id}`}
      name={conversation.username}
      preview={getPreview(conversation)}
      unreadCount={conversation.unread_count}
    />
  );
}

export default ConversationCard;
