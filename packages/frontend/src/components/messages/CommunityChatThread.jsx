import { useCallback } from "react";
import { usePolledData } from "../../hooks/usePolledData";
import {
  getCommunityMessages,
  sendCommunityMessage
} from "../../services/messages";
import MessageForm from "./MessageForm";
import MessageLog from "./MessageLog";
import ThreadHeader from "./ThreadHeader";

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
      className="flex min-h-0 flex-1 flex-col gap-3">
      <ThreadHeader name={name} />

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
