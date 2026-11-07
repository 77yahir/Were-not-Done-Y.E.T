import { useCallback } from "react";
import { Link } from "react-router-dom";
import { usePolledData } from "../../hooks/usePolledData";
import {
  getCommunityMessages,
  sendCommunityMessage
} from "../../services/messages";
import MessageForm from "./MessageForm";
import MessageLog from "./MessageLog";

// How often an open chat checks for new messages
const POLL_MS = 5000;

// A community's group chat. Every approved member is in it, so it
// disappears from the Messages page as soon as someone leaves
function CommunityChatThread({ chat, onChange }) {
  const { group_id: groupId, name } = chat;

  const fetchMessages = useCallback(
    () => getCommunityMessages(groupId),
    [groupId]
  );
  const { data, error, reload } = usePolledData(
    fetchMessages,
    POLL_MS
  );

  async function handleSend(body) {
    await sendCommunityMessage(groupId, body);
    await Promise.all([reload(), onChange()]);
  }

  return (
    <section
      aria-label={`${name} group chat`}
      className="flex h-[calc(100vh-20rem)] min-h-96 flex-col gap-2 md:h-[calc(100vh-12rem)]">
      <div className="flex items-center gap-3">
        <Link to="/messages" className="text-bb-text md:hidden">
          Back
        </Link>

        <h2 className="truncate text-xl">{name}</h2>
      </div>

      <MessageLog
        data={data}
        error={error}
        emptyText="No messages yet. Say hello to the community!"
        showSenders
      />

      <MessageForm
        onSend={handleSend}
        forbiddenMessage="You're no longer a member of this community"
      />
    </section>
  );
}

export default CommunityChatThread;
