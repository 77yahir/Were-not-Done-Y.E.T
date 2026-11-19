import { useEffect, useState } from "react";
import {
  getSession,
  updatePassword,
  updateEmail
} from "../services/auth";
import {
  getUserProfile,
  updateMyUsername
} from "../services/users";
import Avatar from "../components/ui/Avatar";
import Button from "../components/ui/Button";
import Notice from "../components/ui/Notice";
import PageHeader from "../components/ui/PageHeader";
import Panel from "../components/ui/Panel";
import { IconUser } from "../components/ui/icons";
import { useOutletContext } from "react-router-dom";

export default function Settings() {
  const [profile, setProfile] = useState(null);
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const { setDisplayName } = useOutletContext();

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordSaving, setPasswordSaving] = useState(false);
  const [passwordError, setPasswordError] = useState("");
  const [passwordMessage, setPasswordMessage] = useState("");

  const [newEmail, setNewEmail] = useState("");
  const [emailSaving, setEmailSaving] = useState(false);
  const [emailError, setEmailError] = useState("");
  const [emailMessage, setEmailMessage] = useState("");

  useEffect(() => {
    let active = true;

    async function loadProfile() {
      try {
        const session = await getSession();

        if (!session) {
          throw new Error("Not authenticated");
        }

        const result = await getUserProfile(session.user.id);

        if (active) {
          setProfile(result.profile);
          setUsername(result.profile.username);
          setEmail(session.user.email ?? "");
        }
      } catch (err) {
        if (active) {
          console.error(err);
          setError("Failed to load account settings");
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    loadProfile();

    return () => {
      active = false;
    };
  }, []);

  async function handleSave(event) {
    event.preventDefault();

    const newUsername = username.trim();

    if (newUsername.length < 3 || newUsername.length > 75) {
      setError("Username must be between 3 and 75 characters");
      return;
    }

    setSaving(true);
    setError("");
    setMessage("");

    try {
      const result = await updateMyUsername(newUsername);

      setProfile((current) => ({
        ...current,
        username: result.username
      }));

      setUsername(result.username);
      setDisplayName(result.username);
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

  async function handlePasswordChange(event) {
    event.preventDefault();

    setPasswordError("");
    setPasswordMessage("");

    if (newPassword.length < 6) {
      setPasswordError(
        "Password must be at least 6 characters"
      );
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordError("New passwords do not match");
      return;
    }

    if (currentPassword === newPassword) {
      setPasswordError("New password must be different");
      return;
    }

    setPasswordSaving(true);

    try {
      await updatePassword(currentPassword, newPassword);

      setPasswordMessage("Password updated successfully");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (error) {
      console.error("Password update failed:", error);
      setPasswordError(
        "Could not update password. Check your current password and try again"
      );
    } finally {
      setPasswordSaving(false);
    }
  }

  async function handleEmailChange(event) {
    event.preventDefault();

    const requestedEmail = newEmail.trim();

    setEmailError("");
    setEmailMessage("");

    if (
      !requestedEmail ||
      requestedEmail.toLowerCase() === email.toLowerCase()
    ) {
      setEmailError("Enter a different email address");
      return;
    }

    setEmailSaving(true);

    try {
      await updateEmail(requestedEmail);

      setEmailMessage(
        "Email change requested. Check your current and new email inboxes to confirm the change"
      );

      setNewEmail("");
    } catch (error) {
      console.error("Email update failed:", error);
      setEmailError(
        "Could not request email change. Please check the address and try again"
      );
    } finally {
      setEmailSaving(false);
    }
  }

  return (
    <div>
      <PageHeader
        title="My Profile & Settings"
        subtitle="Manage your Board Buddies account"
        icon={<IconUser className="size-8" />}
      />

      <Panel title="Profile Information">
        {loading && <Notice>Loading account...</Notice>}

        {error && <Notice tone="error">{error}</Notice>}

        {message && <Notice tone="success">{message}</Notice>}

        {!loading && profile && (
          <div className="flex flex-col gap-5">
            <div className="flex items-center gap-4">
              <Avatar name={profile.username} size="xl" />

              <div>
                <h2 className="text-xl font-bold">
                  {profile.username}
                </h2>
                <p className="text-sm text-ink-700">{email}</p>
              </div>
            </div>

            <form
              onSubmit={handleSave}
              className="flex max-w-md flex-col gap-4">
              <div className="flex flex-col gap-1">
                <label htmlFor="settings-username">
                  Username
                </label>

                <input
                  id="settings-username"
                  type="text"
                  value={username}
                  onChange={(event) =>
                    setUsername(event.target.value)
                  }
                  minLength={3}
                  maxLength={75}
                  required
                  disabled={saving}
                  className="rounded-lg border border-parchment-400 bg-parchment-50 px-3 py-2 text-ink-900"
                />
              </div>

              <div className="flex flex-col gap-1">
                <label>Email address</label>
                <p className="rounded-lg bg-parchment-100 px-3 py-2 text-ink-700">
                  {email}
                </p>
              </div>

              <div>
                <Button
                  type="submit"
                  disabled={
                    saving ||
                    username.trim() === profile.username
                  }>
                  {saving ? "Saving..." : "Save Changes"}
                </Button>
              </div>
            </form>
          </div>
        )}
      </Panel>

      <Panel title="Security">
        <form
          onSubmit={handlePasswordChange}
          className="flex max-w-md flex-col gap-4">
          {passwordError && (
            <Notice tone="error">{passwordError}</Notice>
          )}

          {passwordMessage && (
            <Notice tone="success">{passwordMessage}</Notice>
          )}

          <div className="flex flex-col gap-1">
            <label htmlFor="current-password">
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
              disabled={passwordSaving}
              className="rounded-lg border border-parchment-400 bg-parchment-50 px-3 py-2 text-ink-900"
            />
          </div>

          <div className="flex flex-col gap-1">
            <label htmlFor="new-password">New Password</label>
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
              disabled={passwordSaving}
              className="rounded-lg border border-parchment-400 bg-parchment-50 px-3 py-2 text-ink-900"
            />
          </div>

          <div className="flex flex-col gap-1">
            <label htmlFor="confirm-password">
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
              disabled={passwordSaving}
              className="rounded-lg border border-parchment-400 bg-parchment-50 px-3 py-2 text-ink-900"
            />
          </div>

          <div>
            <Button type="submit" disabled={passwordSaving}>
              {passwordSaving
                ? "Updating..."
                : "Change Password"}
            </Button>
          </div>
        </form>
      </Panel>

      <Panel title="Email Settings">
        <form
          onSubmit={handleEmailChange}
          className="flex max-w-md flex-col gap-4">
          {emailError && (
            <Notice tone="error">{emailError}</Notice>
          )}

          {emailMessage && (
            <Notice tone="success">{emailMessage}</Notice>
          )}

          <div className="flex flex-col gap-1">
            <label htmlFor="current-email">Current Email</label>

            <input
              id="current-email"
              type="email"
              value={email}
              readOnly
              className="rounded-lg border border-parchment-400 bg-parchment-100 px-3 py-2 text-ink-700"
            />
          </div>

          <div className="flex flex-col gap-1">
            <label htmlFor="new-email">New Email</label>

            <input
              id="new-email"
              type="email"
              value={newEmail}
              onChange={(event) =>
                setNewEmail(event.target.value)
              }
              required
              disabled={emailSaving}
              autoComplete="email"
              className="rounded-lg border border-parchment-400 bg-parchment-50 px-3 py-2 text-ink-900"
            />
          </div>

          <div>
            <Button type="submit" disabled={emailSaving}>
              {emailSaving ? "Sending..." : "Change Email"}
            </Button>
          </div>
        </form>
      </Panel>
    </div>
  );
}
