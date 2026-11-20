import { useEffect, useState } from "react";
import { useOutletContext } from "react-router-dom";

import { getSession } from "../services/auth";
import { getUserProfile } from "../services/users";

import Avatar from "../components/ui/Avatar";
import Notice from "../components/ui/Notice";
import PageHeader from "../components/ui/PageHeader";
import Panel from "../components/ui/Panel";

import {
  IconUser,
  IconMail,
  IconLock
} from "../components/ui/icons";

import SettingsRow from "../components/settings/SettingsRow";
import UsernameModal from "../components/settings/UsernameModal";
import EmailModal from "../components/settings/EmailModal";
import PasswordModal from "../components/settings/PasswordModal";
import AvatarModal from "../components/settings/AvatarModal";

export default function Settings() {
  const [profile, setProfile] = useState(null);
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeModal, setActiveModal] = useState(null);

  const { setDisplayName, setAvatarId } = useOutletContext();

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

  return (
    <div>
      <PageHeader
        title="My Profile & Settings"
        subtitle="Manage your Board Buddies account"
        icon={<IconUser className="size-8" />}
      />

      <Panel title="My Account">
        {loading && <Notice>Loading account...</Notice>}

        {!loading && error && (
          <Notice tone="error">{error}</Notice>
        )}

        {!loading && !error && profile && (
          <div className="flex flex-col gap-5">
            <div className="flex items-center gap-4">
              <Avatar
                name={profile?.username}
                avatarId={profile?.avatar_id}
                size="xl"
              />

              <div className="min-w-0">
                <h2 className="font-display text-2xl font-bold">
                  {profile?.username}
                </h2>

                <p className="text-sm text-ink-700">{email}</p>
              </div>
            </div>

            <div className="flex flex-col gap-3">
              <SettingsRow
                title="Username"
                description="Change your display name"
                icon={<IconUser className="size-5" />}
                onClick={() => setActiveModal("username")}
              />

              <SettingsRow
                title="Email Address"
                description="Update your account email"
                icon={<IconMail className="size-5" />}
                onClick={() => setActiveModal("email")}
              />

              <SettingsRow
                title="Password"
                description="Manage your account security"
                icon={<IconLock className="size-5" />}
                onClick={() => setActiveModal("password")}
              />

              <SettingsRow
                title="Profile Avatar"
                description="Choose your Board Buddies character"
                icon={<IconUser className="size-5" />}
                onClick={() => setActiveModal("avatar")}
              />
            </div>
          </div>
        )}
      </Panel>

      {profile && activeModal === "username" && (
        <UsernameModal
          username={profile?.username ?? ""}
          onClose={() => setActiveModal(null)}
          onSaved={(updatedUsername) => {
            setProfile((current) => ({
              ...current,
              username: updatedUsername
            }));
            setDisplayName(updatedUsername);
          }}
        />
      )}

      {profile && activeModal === "email" && (
        <EmailModal
          email={email}
          onClose={() => setActiveModal(null)}
        />
      )}

      {profile && activeModal === "password" && (
        <PasswordModal onClose={() => setActiveModal(null)} />
      )}

      {profile && activeModal === "avatar" && (
        <AvatarModal
          avatarId={profile?.avatar_id ?? null}
          onClose={() => setActiveModal(null)}
          onSaved={(updatedAvatarId) => {
            setProfile((current) => ({
              ...current,
              avatar_id: updatedAvatarId
            }));

            setAvatarId(updatedAvatarId);
          }}
        />
      )}
    </div>
  );
}
