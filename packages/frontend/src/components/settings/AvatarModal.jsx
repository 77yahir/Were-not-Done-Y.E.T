import { useState } from "react";
import { updateMyAvatar } from "../../services/users";
import Avatar from "../ui/Avatar";
import Button from "../ui/Button";
import Modal from "../ui/Modal";
import Notice from "../ui/Notice";
import { isValidAvatar } from "../../utils/profileValidation";

const AVATARS = [
  "meeple",
  "cat",
  "fox",
  "bear",
  "robot",
  "wizard"
];

export default function AvatarModal({
  avatarId,
  onSaved,
  onClose
}) {
  const [selectedAvatar, setSelectedAvatar] = useState(
    avatarId ?? null
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  function handleClose() {
    if (!saving) {
      onClose();
    }
  }

  async function handleSave() {
    if (saving || selectedAvatar === (avatarId ?? null)) {
      return;
    }

    if (!isValidAvatar(selectedAvatar)) {
      setError("Invalid avatar selection");
      return;
    }

    setSaving(true);
    setError("");
    setMessage("");

    try {
      const result = await updateMyAvatar(selectedAvatar);

      onSaved(result.avatar_id);
      setMessage("Avatar updated successfully");
    } catch (err) {
      console.error("Avatar update failed:", err);
      setError("Failed to update avatar");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal title="Choose Your Avatar" onClose={handleClose}>
      <div className="flex flex-col gap-4">
        {error && <Notice tone="error">{error}</Notice>}

        {message && <Notice tone="success">{message}</Notice>}

        <p className="text-sm text-ink-700">
          Choose a Board Buddies character for your profile.
        </p>

        <div className="grid grid-cols-3 gap-3">
          {AVATARS.map((id) => (
            <button
              key={id}
              type="button"
              aria-label={`Choose ${id} avatar`}
              aria-pressed={selectedAvatar === id}
              onClick={() => {
                setSelectedAvatar(id);
                setMessage("");
                setError("");
              }}
              disabled={saving}
              className={`flex cursor-pointer flex-col items-center gap-2 rounded-xl p-2 transition-colors ${
                selectedAvatar === id
                  ? "bg-parchment-200 ring-2 ring-forest-600"
                  : "hover:bg-parchment-200"
              }`}>
              <Avatar name={id} avatarId={id} size="lg" />

              <span className="text-sm font-bold capitalize">
                {id}
              </span>
            </button>
          ))}
        </div>

        <div className="flex justify-between gap-2">
          <Button
            type="button"
            variant="secondary"
            disabled={saving}
            onClick={() => {
              setSelectedAvatar(null);
              setMessage("");
              setError("");
            }}>
            Use Default
          </Button>

          <div className="flex gap-2">
            <Button
              type="button"
              variant="secondary"
              disabled={saving}
              onClick={handleClose}>
              Cancel
            </Button>

            <Button
              type="button"
              onClick={handleSave}
              disabled={
                saving || selectedAvatar === (avatarId ?? null)
              }>
              {saving ? "Saving..." : "Save Avatar"}
            </Button>
          </div>
        </div>
      </div>
    </Modal>
  );
}
