import { useState } from "react";

// Keep in sync with MessageCreate in the backend
const MAX_MESSAGE_LENGTH = 2000;

function MessageForm({ onSend }) {
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");

  async function submit() {
    const body = draft.trim();

    if (!body || sending) {
      return;
    }

    setSending(true);
    setError("");
    setDraft("");

    try {
      await onSend(body);
    } catch (err) {
      // Bring the text back so it isn't lost
      setDraft((current) => current || body);
      setError(
        err.status === 403
          ? "You can only message friends or community members"
          : "Failed to send message"
      );
      console.error(err);
    } finally {
      setSending(false);
    }
  }

  function handleSubmit(e) {
    e.preventDefault();
    submit();
  }

  // Enter sends and Shift+Enter starts a new line. isComposing skips
  // the Enter that confirms text in keyboards like Japanese or Chinese
  function handleKeyDown(e) {
    if (
      e.key === "Enter" &&
      !e.shiftKey &&
      !e.nativeEvent.isComposing
    ) {
      e.preventDefault();
      submit();
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      {error && (
        <p role="alert" className="m-0 mb-1 text-sm">
          {error}
        </p>
      )}

      <div className="flex gap-2">
        <textarea
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Write a message"
          aria-label="Write a message"
          maxLength={MAX_MESSAGE_LENGTH}
          rows={2}
          className="min-w-0 flex-1 resize-none"
        />

        <button
          type="submit"
          disabled={sending || !draft.trim()}
          className="px-5">
          {sending ? "Sending..." : "Send"}
        </button>
      </div>
    </form>
  );
}

export default MessageForm;
