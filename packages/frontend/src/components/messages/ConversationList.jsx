import Notice from "../ui/Notice";
import { IconChat, IconUsers } from "../ui/icons";
import CommunityChatCard from "./CommunityChatCard";
import ConversationCard from "./ConversationCard";

const LIST_CLASS = "flex flex-col gap-1";

// The small heading over each half of the list
const HEADING_CLASS =
  "mb-2 flex items-center gap-2 border-b border-parchment-300 pb-1.5 text-lg font-bold";

// Community chats load separately, so chats is missing while they
// load or if they fail
function CommunityChats({ chats, failed }) {
  if (!chats) {
    return (
      <Notice tone={failed ? "error" : "muted"}>
        {failed
          ? "Failed to load community chats"
          : "Loading community chats..."}
      </Notice>
    );
  }

  if (chats.length === 0) {
    return (
      <Notice>
        Join a community to chat with all of its members.
      </Notice>
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
    <div className="flex flex-col gap-5">
      <section>
        <h2 className={HEADING_CLASS}>
          <IconUsers className="size-5 shrink-0 text-wood-600" />
          Community chats
        </h2>
        <CommunityChats chats={chats} failed={chatsFailed} />
      </section>

      <section>
        <h2 className={HEADING_CLASS}>
          <IconChat className="size-5 shrink-0 text-wood-600" />
          Direct messages
        </h2>

        {conversations.length === 0 ? (
          <Notice>
            No one to message yet. Add a friend or join a
            community to get started.
          </Notice>
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
