import { useParams } from "react-router-dom";
import CommunityChatThread from "../components/messages/CommunityChatThread";
import ConversationList from "../components/messages/ConversationList";
import MessageThread from "../components/messages/MessageThread";
import { IconChat, IconMail } from "../components/ui/icons";
import Notice from "../components/ui/Notice";
import PageHeader from "../components/ui/PageHeader";
import Panel from "../components/ui/Panel";
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

  // On wide screens the page fills the window exactly, and the list
  // and the open chat scroll inside their panels. Below lg the header
  // is two rows, so the panels are the window's height minus about
  // 15.5rem for it, the page title and the padding
  return (
    <div className="flex flex-col lg:h-[calc(100vh-7rem)] lg:min-h-[30rem]">
      <PageHeader
        title="Messages"
        subtitle="Chat with friends and communities."
        icon={<IconMail className="size-8" />}
      />

      {!data && !error && (
        <Panel as="div">
          <Notice>Loading conversations...</Notice>
        </Panel>
      )}

      {!data && error && (
        <Panel as="div">
          <Notice role="alert" tone="error">
            Failed to load conversations
          </Notice>
        </Panel>
      )}

      {data && (
        <div className="grid gap-5 md:h-[calc(100dvh-15.5rem)] md:min-h-96 md:grid-cols-[20rem_minmax(0,1fr)] md:grid-rows-[minmax(0,1fr)] lg:h-auto lg:min-h-0 lg:flex-1">
          {/* Small screens show the list or a conversation, not both */}
          <Panel
            as="div"
            className={`min-h-0 flex-col overflow-hidden ${
              isOpen ? "hidden md:flex" : "flex"
            }`}
            bodyClassName="bb-scrollbar min-h-0 flex-1 overflow-y-auto">
            <ConversationList
              conversations={conversations}
              chats={chats}
              chatsFailed={chatsFailed}
            />
          </Panel>

          <Panel
            as="div"
            className={`h-[calc(100dvh-15.5rem)] min-h-96 flex-col md:h-auto md:min-h-0 ${
              isOpen ? "flex" : "hidden md:flex"
            }`}
            bodyClassName="flex min-h-0 flex-1 flex-col">
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
              <div className="m-auto flex max-w-sm flex-col items-center gap-3 text-center">
                <span className="flex size-16 items-center justify-center rounded-full bg-parchment-200 text-wood-600 ring-1 ring-parchment-300">
                  <IconChat className="size-8" />
                </span>

                <p className="text-lg text-ink-700">
                  {getPlaceholder(
                    userId,
                    groupId,
                    chats,
                    chatsFailed
                  )}
                </p>
              </div>
            )}
          </Panel>
        </div>
      )}
    </div>
  );
}

export default Messages;
