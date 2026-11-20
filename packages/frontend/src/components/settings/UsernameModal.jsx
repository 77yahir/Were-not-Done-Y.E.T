import { useState } from "react";
import { updateMyUsername } from "../../services/users";
import Button from "../ui/Button";
import Modal from "../ui/Modal";
import Notice from "../ui/Notice";

export default function UsernameModal({
  username,
  onSaved,
  onClose
}) {
  const [value, setValue] = useState(username ?? "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  function handleClose() {
    if (!saving) {
      onClose();
    }
  }

  async function handleSubmit(event) {
    event.preventDefault();

    const newUsername = value.trim();

    if (newUsername.length < 3 || newUsername.length > 75) {
      setError("Username must be between 3 and 75 characters");
      return;
    }

    setSaving(true);
    setError("");
    setMessage("");

    try {
      const result = await updateMyUsername(newUsername);
      onSaved(result.username);
      setValue(result.username);
      setMessage("Username updated successfully");
    } catch (err) {
      console.error(err);
      setError(
        err.status === 409
          ? "Username already taken"
          : "Failed to update username"
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal title="Change Username" onClose={handleClose}>
      <form
        onSubmit={handleSubmit}
        className="flex flex-col gap-4">
        {error && <Notice tone="error">{error}</Notice>}
        {message && <Notice tone="success">{message}</Notice>}

        <div className="flex flex-col gap-1">
          <label
            htmlFor="settings-username"
            className="font-bold">
            New Username
          </label>
          <input
            id="settings-username"
            type="text"
            value={value}
            onChange={(event) => setValue(event.target.value)}
            minLength={3}
            maxLength={75}
            required
            disabled={saving}
            className="rounded-lg border border-parchment-400 bg-parchment-50 px-3 py-2 text-ink-900"
          />
        </div>

        <div className="flex justify-end gap-2">
          <Button
            type="button"
            variant="secondary"
            disabled={saving}
            onClick={handleClose}>
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={saving || value.trim() === username}>
            {saving ? "Saving..." : "Save Changes"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
