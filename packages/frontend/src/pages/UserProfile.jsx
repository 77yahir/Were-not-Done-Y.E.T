import { useEffect, useState } from "react";
import { useParams, useLocation } from "react-router-dom";
import { getUserProfile } from "../services/users";
import UserLibrary from "../components/users/UserLibrary";
import Avatar from "../components/ui/Avatar";
import { ButtonLink } from "../components/ui/Button";
import Notice from "../components/ui/Notice";
import PageHeader from "../components/ui/PageHeader";
import Panel from "../components/ui/Panel";
import {
  IconArrowLeft,
  IconUser
} from "../components/ui/icons";

export default function UserProfile() {
  const { userId } = useParams();

  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const location = useLocation();

  const backTo = location.state?.from?.startsWith(
    "/communities/"
  )
    ? location.state.from
    : "/friends";

  const backLabel =
    backTo !== "/friends"
      ? "Back to Community"
      : "Back to Friends";

  useEffect(() => {
    let ignore = false;

    async function loadProfile() {
      setLoading(true);
      setError("");
      setProfile(null);

      try {
        const data = await getUserProfile(userId);

        if (!ignore) {
          setProfile(data.profile);
        }
      } catch {
        if (!ignore) {
          setError("Failed to load user profile");
        }
      } finally {
        if (!ignore) {
          setLoading(false);
        }
      }
    }

    if (userId) {
      loadProfile();
    }

    return () => {
      ignore = true;
    };
  }, [userId]);

  // The page already sits inside the layout's <main>
  return (
    <div>
      <ButtonLink
        to={backTo}
        variant="secondary"
        size="sm"
        className="mb-4">
        <IconArrowLeft className="size-4" />
        {backLabel}
      </ButtonLink>

      <PageHeader
        title="User Profile"
        icon={<IconUser className="size-8" />}
      />

      {loading && (
        <Panel as="div">
          <Notice>Loading profile...</Notice>
        </Panel>
      )}

      {error && (
        <Panel as="div">
          <Notice tone="error" role="alert">
            {error}
          </Notice>
        </Panel>
      )}

      {!loading && !error && profile && (
        <div className="flex flex-col gap-5">
          <Panel>
            <div className="flex flex-col items-center gap-4 text-center sm:flex-row sm:gap-6 sm:text-left">
              <Avatar
                name={profile.username}
                avatarId={profile.avatar_id}
                size="xl"
                label={`${profile.username}'s avatar`}
              />

              <div className="max-w-full min-w-0">
                <h2 className="text-3xl leading-tight font-extrabold wrap-anywhere sm:text-4xl">
                  {profile.username}
                </h2>

                <p className="mt-1 text-ink-700">
                  Member since:{" "}
                  {new Date(
                    profile.created_at
                  ).toLocaleDateString()}
                </p>
              </div>
            </div>
          </Panel>

          <UserLibrary userId={userId} />
        </div>
      )}
    </div>
  );
}
