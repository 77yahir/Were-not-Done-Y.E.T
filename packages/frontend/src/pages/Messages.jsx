import { useParams } from "react-router-dom";
import ConversationList from "../components/messages/ConversationList";
import MessageThread from "../components/messages/MessageThread";
import { usePolledData } from "../hooks/usePolledData";
import { getConversations } from "../services/messages";

// How often the conversation list checks for changes
const POLL_MS = 10000;

function Messages() {
  const { userId } = useParams();
  const { data, error, reload } = usePolledData(
    getConversations,
    POLL_MS
  );

  const conversations = data?.conversations ?? [];
  const selected = conversations.find(
    (conversation) => conversation.user_id === userId
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
              userId ? "hidden md:block" : ""
            }`}>
            <ConversationList conversations={conversations} />
          </div>

          <div className={userId ? "" : "hidden md:block"}>
            {selected ? (
              <MessageThread
                key={selected.user_id}
                contact={selected}
                onChange={reload}
              />
            ) : (
              <p className="m-0 text-center">
                {userId
                  ? "You can only message friends or community members"
                  : "Choose someone to message"}
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default Messages;
