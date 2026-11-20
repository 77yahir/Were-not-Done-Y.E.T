import { useState } from "react";
import { updatePassword } from "../../services/auth";
import Button from "../ui/Button";
import Modal from "../ui/Modal";
import Notice from "../ui/Notice";

export default function PasswordModal({ onClose }) {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  function handleClose() {
    if (!saving) onClose();
  }

  async function handleSubmit(event) {
    event.preventDefault();

    setError("");
    setMessage("");

    if (newPassword.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("New passwords do not match");
      return;
    }

    if (newPassword === currentPassword) {
      setError("New password must be different");
      return;
    }

    setSaving(true);

    try {
      await updatePassword(currentPassword, newPassword);

      setMessage("Password updated successfully");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err) {
      console.error("Password update failed:", err);
      setError(
        "Could not update password. Check your current password."
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal title="Change Password" onClose={handleClose}>
      <form
        onSubmit={handleSubmit}
        className="flex flex-col gap-4">
        {error && <Notice tone="error">{error}</Notice>}
        {message && <Notice tone="success">{message}</Notice>}

        <div className="flex flex-col gap-1">
          <label
            htmlFor="current-password"
            className="font-bold">
            Current Password
          </label>
          <input
            id="current-password"
            type="password"
            autoComplete="current-password"
            value={currentPassword}
            onChange={(event) =>
              setCurrentPassword(event.target.value)
            }
            required
            disabled={saving}
            className="rounded-lg border border-parchment-400 bg-parchment-50 px-3 py-2 text-ink-900"
          />
        </div>

        <div className="flex flex-col gap-1">
          <label htmlFor="new-password" className="font-bold">
            New Password
          </label>
          <input
            id="new-password"
            type="password"
            autoComplete="new-password"
            value={newPassword}
            onChange={(event) =>
              setNewPassword(event.target.value)
            }
            minLength={6}
            required
            disabled={saving}
            className="rounded-lg border border-parchment-400 bg-parchment-50 px-3 py-2 text-ink-900"
          />
        </div>

        <div className="flex flex-col gap-1">
          <label
            htmlFor="confirm-password"
            className="font-bold">
            Confirm New Password
          </label>
          <input
            id="confirm-password"
            type="password"
            autoComplete="new-password"
            value={confirmPassword}
            onChange={(event) =>
              setConfirmPassword(event.target.value)
            }
            minLength={6}
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
          <Button type="submit" disabled={saving}>
            {saving ? "Updating..." : "Change Password"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
