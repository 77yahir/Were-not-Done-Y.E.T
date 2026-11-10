import { useEffect, useState } from "react";
import { Navigate, Outlet } from "react-router-dom";
import Navbar from "./Navbar";
import { getSession, onAuthChange } from "../../services/auth";

// Wraps every page that requires a logged-in user
function PageLayout() {
  // undefined = still checking, null = logged out
  const [session, setSession] = useState(undefined);

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

  if (session === undefined) {
    return null;
  }

  if (!session) {
    return <Navigate to="/" replace />;
  }

  return (
    <>
      <Navbar user={session.user} />
      <main className="mx-auto w-full max-w-[90rem] px-3 py-5 sm:px-5 lg:py-6">
        <Outlet />
      </main>
    </>
  );
}

export default PageLayout;
