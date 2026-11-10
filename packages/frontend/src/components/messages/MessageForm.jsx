import { useState } from "react";
import Button from "../ui/Button";
import Notice from "../ui/Notice";
import { fieldClass } from "../ui/styles";

// Keep in sync with MessageCreate in the backend
const MAX_MESSAGE_LENGTH = 2000;

const NOT_ALLOWED =
  "You can only message friends or community members";

// forbiddenMessage explains a refused message (a 403 from the backend)
function MessageForm({
  onSend,
  forbiddenMessage = NOT_ALLOWED
}) {
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
          ? forbiddenMessage
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
        <Notice
          role="alert"
          tone="error"
          className="mb-2 font-bold">
          {error}
        </Notice>
      )}

      <div className="flex items-end gap-2">
        <textarea
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Write a message"
          aria-label="Write a message"
          maxLength={MAX_MESSAGE_LENGTH}
          rows={2}
          className={`${fieldClass} min-w-0 flex-1 resize-none`}
        />

        <Button
          type="submit"
          disabled={sending || !draft.trim()}>
          {sending ? "Sending..." : "Send"}
        </Button>
      </div>
    </form>
  );
}

export default MessageForm;
