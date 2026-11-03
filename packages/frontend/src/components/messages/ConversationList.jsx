import ConversationCard from "./ConversationCard";

function ConversationList({ conversations }) {
  if (conversations.length === 0) {
    return (
      <p className="m-0">
        No one to message yet. Add a friend or join a community to
        get started.
      </p>
    );
  }

  return (
    <ul className="m-0 flex list-none flex-col gap-1.5 p-0">
      {conversations.map((conversation) => (
        <li key={conversation.user_id}>
          <ConversationCard conversation={conversation} />
        </li>
      ))}
    </ul>
  );
}

export default ConversationList;
