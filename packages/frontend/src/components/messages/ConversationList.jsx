import CommunityChatCard from "./CommunityChatCard";
import ConversationCard from "./ConversationCard";

const LIST_CLASS = "m-0 flex list-none flex-col gap-1.5 p-0";

// Community chats load separately, so chats is missing while they
// load or if they fail
function CommunityChats({ chats, failed }) {
  if (!chats) {
    return (
      <p className="m-0">
        {failed
          ? "Failed to load community chats"
          : "Loading community chats..."}
      </p>
    );
  }

  if (chats.length === 0) {
    return (
      <p className="m-0">
        Join a community to chat with all of its members.
      </p>
    );
  }

  return (
    <ul className={LIST_CLASS}>
      {chats.map((chat) => (
        <li key={chat.group_id}>
          <CommunityChatCard chat={chat} />
        </li>
      ))}
    </ul>
  );
}

function ConversationList({
  conversations,
  chats,
  chatsFailed
}) {
  return (
    <div className="flex flex-col gap-4">
      <section>
        <h2 className="mb-1.5 text-lg">Community chats</h2>
        <CommunityChats chats={chats} failed={chatsFailed} />
      </section>

      <section>
        <h2 className="mb-1.5 text-lg">Direct messages</h2>

        {conversations.length === 0 ? (
          <p className="m-0">
            No one to message yet. Add a friend or join a
            community to get started.
          </p>
        ) : (
          <ul className={LIST_CLASS}>
            {conversations.map((conversation) => (
              <li key={conversation.user_id}>
                <ConversationCard conversation={conversation} />
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

export default ConversationList;
