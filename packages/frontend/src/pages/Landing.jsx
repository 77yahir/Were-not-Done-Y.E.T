import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import LoginForm from "../components/auth/LoginForm";
import SignUpForm from "../components/auth/SignUpForm";
import Modal from "../components/ui/Modal";
import { getSession } from "../services/auth";

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
    <div className="start-page">
      <h1 className="start-title">Board Buddies</h1>

      <div className="start-panel">
        <LoginForm onSignUpClick={() => setShowSignUp(true)} />
      </div>

      {showSignUp && (
        <Modal title="Sign Up" onClose={() => setShowSignUp(false)}>
          <SignUpForm />
        </Modal>
      )}
    </div>
  );
}

export default Landing;
