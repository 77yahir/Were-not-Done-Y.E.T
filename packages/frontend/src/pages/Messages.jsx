import { useParams } from "react-router-dom";
import CommunityChatThread from "../components/messages/CommunityChatThread";
import ConversationList from "../components/messages/ConversationList";
import MessageThread from "../components/messages/MessageThread";
import { usePolledData } from "../hooks/usePolledData";
import {
  getCommunityChats,
  getConversations
} from "../services/messages";

// How often the lists check for changes, including someone joining
// or leaving a community
const POLL_MS = 10000;

// What to show when nothing can be opened at this address
function getPlaceholder(userId, groupId, chats, chatsFailed) {
  if (groupId) {
    if (chats) {
      return "Only community members can use this chat";
    }

    return chatsFailed
      ? "Failed to load community chats"
      : "Loading chat...";
  }

  return userId
    ? "You can only message friends or community members"
    : "Choose someone to message";
}

function Messages() {
  const { userId, groupId } = useParams();
  const { data, error, reload } = usePolledData(
    getConversations,
    POLL_MS
  );
  // Loaded on their own so direct messages still work if they fail
  const chatList = usePolledData(getCommunityChats, POLL_MS);

  const conversations = data?.conversations ?? [];
  const chats = chatList.data?.chats;
  const chatsFailed = Boolean(chatList.error);
  const isOpen = Boolean(userId || groupId);

  const selected = conversations.find(
    (conversation) => conversation.user_id === userId
  );
  const selectedChat = chats?.find(
    (chat) => chat.group_id === groupId
  );

  return (
    <div className="tailwind-page mt-[7px] bg-bb-cream px-6 py-4">
      <h1>Messages</h1>

      {!data && !error && <p>Loading conversations...</p>}

      {!data && error && (
        <p role="alert">Failed to load conversations</p>
      )}

      {data && (
        <div className="mt-3 grid grid-cols-1 gap-4 md:grid-cols-[18rem_minmax(0,1fr)]">
          {/* Small screens show the list or a conversation, not both */}
          <div
            className={`md:h-[calc(100vh-12rem)] md:min-h-96 md:overflow-y-auto ${
              isOpen ? "hidden md:block" : ""
            }`}>
            <ConversationList
              conversations={conversations}
              chats={chats}
              chatsFailed={chatsFailed}
            />
          </div>

          <div className={isOpen ? "" : "hidden md:block"}>
            {selectedChat ? (
              <CommunityChatThread
                key={selectedChat.group_id}
                chat={selectedChat}
                onChange={chatList.reload}
              />
            ) : selected ? (
              <MessageThread
                key={selected.user_id}
                contact={selected}
                onChange={reload}
              />
            ) : (
              <p className="m-0 text-center">
                {getPlaceholder(
                  userId,
                  groupId,
                  chats,
                  chatsFailed
                )}
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default Messages;
