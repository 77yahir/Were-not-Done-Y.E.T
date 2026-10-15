import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { logIn } from "../../services/auth";

function LoginForm({ onSignUpClick }) {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    try {
      await logIn(email.trim(), password);
      navigate("/collection");
    } catch (error) {
      if (error.message?.includes("Email not confirmed")) {
        setMessage("Please confirm your email before logging in");
      } else {
        setMessage("Incorrect email or password");
      }
      console.error(error);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="login">
      {message && <p className="form-message">{message}</p>}

      <form className="start-form" onSubmit={handleSubmit}>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Email"
          aria-label="Email"
          autoComplete="email"
          required
        />
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Password"
          aria-label="Password"
          autoComplete="current-password"
          required
        />
        <button type="submit" disabled={loading}>
          {loading ? "Logging in..." : "Log in"}
        </button>
        <button type="button" onClick={onSignUpClick}>
          Sign up
        </button>
      </form>
    </div>
  );
}

export default LoginForm;
