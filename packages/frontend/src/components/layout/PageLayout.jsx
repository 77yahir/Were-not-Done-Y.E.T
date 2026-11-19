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

    async function loadUsername() {
      if (!session?.user?.id) {
        setDisplayName("");
        return;
      }

      setDisplayName("");

      try {
        const result = await getUserProfile(session.user.id);

        if (active) {
          setDisplayName(result.profile.username);
        }
      } catch (error) {
        console.error("Failed to load navbar username:", error);

        if (active) {
          setDisplayName(
            session.user.user_metadata?.username ||
              session.user.email ||
              ""
          );
        }
      }
    }

    loadUsername();

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
      <Navbar user={session.user} displayName={displayName} />
      <main className="mx-auto w-full max-w-[90rem] px-3 py-5 sm:px-5 lg:py-6">
        <Outlet context={{ setDisplayName }} />
      </main>
    </>
  );
}

export default PageLayout;
