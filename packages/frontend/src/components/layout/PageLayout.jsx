import { useEffect, useState } from "react";
import { Navigate, Outlet } from "react-router-dom";
import Navbar from "./Navbar";
import { getSession, onAuthChange } from "../../services/auth";
import { getUserProfile } from "../../services/users";

// Wraps every page that requires a logged-in user
function PageLayout() {
  // undefined = still checking, null = logged out
  const [session, setSession] = useState(undefined);
  const [displayName, setDisplayName] = useState("");
  const [avatarId, setAvatarId] = useState(null);

  useEffect(() => {
    let active = true;

    getSession().then((current) => {
      if (active) {
        setSession(current);
      }
    });

    const unsubscribe = onAuthChange((current) => {
      if (active) {
        setSession(current);
      }
    });

    return () => {
      active = false;
      unsubscribe();
    };
  }, []);

  useEffect(() => {
    let active = true;

    async function loadProfile() {
      if (!session?.user?.id) {
        setDisplayName("");
        setAvatarId(null);
        return;
      }

      setDisplayName("");
      setAvatarId(null);

      try {
        const result = await getUserProfile(session.user.id);

        if (active) {
          setDisplayName(result.profile.username);
          setAvatarId(result.profile.avatar_id ?? null);
        }
      } catch (error) {
        console.error("Failed to load navbar username:", error);

        if (active) {
          setDisplayName(
            session.user.user_metadata?.username ||
              session.user.email ||
              ""
          );
          setAvatarId(null);
        }
      }
    }

    loadProfile();

    return () => {
      active = false;
    };
  }, [session?.user?.id]);

  if (session === undefined) {
    return null;
  }

  if (!session) {
    return <Navigate to="/" replace />;
  }

  return (
    <>
      <Navbar
        user={session.user}
        displayName={displayName}
        avatarId={avatarId}
      />
      <main className="mx-auto w-full max-w-[90rem] px-3 py-5 sm:px-5 lg:py-6">
        <Outlet context={{ setDisplayName, setAvatarId }} />
      </main>
    </>
  );
}

export default PageLayout;
