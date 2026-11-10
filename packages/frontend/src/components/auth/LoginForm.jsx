import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { logIn } from "../../services/auth";
import Button from "../ui/Button";
import { fieldClass } from "../ui/styles";

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
        setMessage(
          "Please confirm your email before logging in"
        );
      } else {
        setMessage("Incorrect email or password");
      }
      console.error(error);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="w-full">
      {message && (
        <p
          role="alert"
          className="mb-4 rounded-lg bg-berry-100 px-3 py-2 text-center text-sm font-bold text-berry-700">
          {message}
        </p>
      )}

      <form
        className="flex flex-col gap-3"
        onSubmit={handleSubmit}>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Email"
          aria-label="Email"
          autoComplete="email"
          className={fieldClass}
          required
        />
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Password"
          aria-label="Password"
          autoComplete="current-password"
          className={fieldClass}
          required
        />
        <Button
          type="submit"
          size="lg"
          className="mt-1 w-full"
          disabled={loading}>
          {loading ? "Logging in..." : "Log in"}
        </Button>

        <div
          aria-hidden="true"
          className="flex items-center gap-3 text-xs font-bold text-ink-500 uppercase">
          <span className="h-px flex-1 bg-parchment-400" />
          or
          <span className="h-px flex-1 bg-parchment-400" />
        </div>

        <Button
          variant="secondary"
          size="lg"
          className="w-full"
          onClick={onSignUpClick}>
          Sign up
        </Button>
      </form>
    </div>
  );
}

export default LoginForm;
