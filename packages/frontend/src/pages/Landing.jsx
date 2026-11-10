import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import LoginForm from "../components/auth/LoginForm";
import SignUpForm from "../components/auth/SignUpForm";
import {
  IconChat,
  IconHeart,
  IconLibrary,
  IconMeeple,
  IconUsers
} from "../components/ui/icons";
import Modal from "../components/ui/Modal";
import { getSession } from "../services/auth";

// What the app does, beside the login form
const FEATURES = [
  {
    Icon: IconLibrary,
    title: "Track your collection",
    text: "Keep every game you own in one place."
  },
  {
    Icon: IconHeart,
    title: "Build a wishlist",
    text: "Remember the games you want next."
  },
  {
    Icon: IconUsers,
    title: "See what friends own",
    text: "Browse your friends' game libraries."
  },
  {
    Icon: IconChat,
    title: "Chat with your groups",
    text: "Message friends and whole communities."
  }
];

function Landing() {
  const [showSignUp, setShowSignUp] = useState(false);
  const [checking, setChecking] = useState(true);
  const [signedIn, setSignedIn] = useState(false);

  useEffect(() => {
    let active = true;

    getSession().then((session) => {
      if (active) {
        setSignedIn(Boolean(session));
        setChecking(false);
      }
    });

    return () => {
      active = false;
    };
  }, []);

  if (checking) {
    return null;
  }

  // Already logged in, skip straight to the collection
  if (signedIn) {
    return <Navigate to="/collection" replace />;
  }

  return (
    <div className="mx-auto grid min-h-screen w-full max-w-6xl items-center gap-10 px-4 py-10 sm:px-6 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)] lg:gap-16">
      <div className="text-center lg:text-left">
        <div className="flex flex-col items-center gap-3 lg:flex-row lg:gap-5">
          <IconMeeple className="size-20 shrink-0 text-gold-400 drop-shadow-[0_4px_0_rgb(0_0_0/0.45)] sm:size-24" />

          <div>
            <h1 className="text-5xl leading-none font-extrabold tracking-wide text-gold-300 uppercase [text-shadow:0_4px_0_rgb(0_0_0/0.5)] sm:text-7xl">
              Board Buddies
            </h1>
            <p className="mt-2 font-display text-2xl font-bold text-parchment-100 italic">
              Share games. Play more.
            </p>
          </div>
        </div>

        <p className="mx-auto mt-6 max-w-xl text-lg text-parchment-200 lg:mx-0">
          Keep track of your board games, see what your friends
          own, and chat with the people you play with.
        </p>

        <ul className="mt-8 grid gap-3 text-left sm:grid-cols-2">
          {FEATURES.map(({ Icon, title, text }) => (
            <li
              key={title}
              className="flex items-start gap-3 rounded-xl bg-wood-950/45 p-3 ring-1 ring-wood-700/80">
              <span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-gold-400/15 text-gold-300 ring-1 ring-gold-400/30">
                <Icon className="size-6" />
              </span>

              <span>
                <span className="block font-display text-lg font-bold text-parchment-50">
                  {title}
                </span>
                <span className="block text-sm text-parchment-200">
                  {text}
                </span>
              </span>
            </li>
          ))}
        </ul>
      </div>

      <section
        aria-labelledby="log-in-title"
        className="bg-parchment mx-auto w-full max-w-md rounded-2xl border border-parchment-300 p-6 text-ink-900 shadow-panel [--focus-color:var(--color-ink-900)] sm:p-8">
        <h2
          id="log-in-title"
          className="text-center text-3xl font-extrabold">
          Welcome back
        </h2>
        <p className="mt-1 mb-6 text-center text-ink-700">
          Log in to see your games and friends.
        </p>

        <LoginForm onSignUpClick={() => setShowSignUp(true)} />
      </section>

      {showSignUp && (
        <Modal
          title="Sign Up"
          onClose={() => setShowSignUp(false)}>
          <SignUpForm />
        </Modal>
      )}
    </div>
  );
}

export default Landing;
