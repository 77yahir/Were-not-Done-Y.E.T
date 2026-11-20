import { useState } from "react";
import { updateEmail } from "../../services/auth";
import Button from "../ui/Button";
import Modal from "../ui/Modal";
import Notice from "../ui/Notice";

export default function EmailModal({ email, onClose }) {
  const [newEmail, setNewEmail] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  function handleClose() {
    if (!saving) onClose();
  }

  async function handleSubmit(event) {
    event.preventDefault();

    const requestedEmail = newEmail.trim();

    setError("");
    setMessage("");

    if (
      !requestedEmail ||
      requestedEmail.toLowerCase() === email.toLowerCase()
    ) {
      setError("Enter a different email address");
      return;
    }

    setSaving(true);

    try {
      await updateEmail(requestedEmail);

      setMessage(
        "Email change requested. Check your current and new email inboxes to confirm the change."
      );

      setNewEmail("");
    } catch (err) {
      console.error("Email update failed:", err);
      setError("Could not request email change");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal title="Change Email" onClose={handleClose}>
      <form
        onSubmit={handleSubmit}
        className="flex flex-col gap-4">
        {error && <Notice tone="error">{error}</Notice>}
        {message && <Notice tone="success">{message}</Notice>}

        <div className="flex flex-col gap-1">
          <span className="font-bold">Current Email</span>
          <p className="rounded-lg bg-parchment-100 px-3 py-2 text-ink-700 wrap-anywhere">
            {email}
          </p>
        </div>

        <div className="flex flex-col gap-1">
          <label htmlFor="new-email" className="font-bold">
            New Email
          </label>
          <input
            id="new-email"
            type="email"
            value={newEmail}
            onChange={(event) =>
              setNewEmail(event.target.value)
            }
            required
            disabled={saving}
            autoComplete="email"
            className="rounded-lg border border-parchment-400 bg-parchment-50 px-3 py-2 text-ink-900"
          />
        </div>

        <p className="text-sm text-ink-700">
          Confirm the change using the verification emails sent
          to your current and new addresses.
        </p>

        <div className="flex justify-end gap-2">
          <Button
            type="button"
            variant="secondary"
            disabled={saving}
            onClick={handleClose}>
            Cancel
          </Button>

          <Button type="submit" disabled={saving}>
            {saving ? "Sending..." : "Change Email"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
