import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { signUp } from "../../services/auth";
import Button from "../ui/Button";
import { fieldClass } from "../ui/styles";

const MIN_PASSWORD_LENGTH = 6;

function SignUpForm() {
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setMessage("");

    if (password.length < MIN_PASSWORD_LENGTH) {
      setMessage(
        `Password must be at least ${MIN_PASSWORD_LENGTH} characters`
      );
      return;
    }

    setLoading(true);

    try {
      const result = await signUp(
        username.trim(),
        email.trim(),
        password
      );

      if (result.session) {
        navigate("/collection");
      } else if (result.user?.identities?.length === 0) {
        // Supabase reports success for existing emails but sends nothing
        setMessage(
          "An account with that email already exists. Log in instead"
        );
      } else {
        // Supabase has "Confirm email" turned on
        setMessage(
          "Account created! Check your email to confirm it, then log in"
        );
      }
    } catch (error) {
      if (error.message?.includes("Database error")) {
        setMessage("That username is already taken");
      } else if (
        error.message?.includes("already registered")
      ) {
        setMessage("An account with that email already exists");
      } else {
        // Show Supabase's reason (e.g. email rate limit, invalid email)
        setMessage(error.message || "Failed to create account");
      }
      console.error(error);
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      {message && (
        <p
          role="status"
          className="mb-4 rounded-lg bg-parchment-200 px-3 py-2 text-center text-sm font-bold">
          {message}
        </p>
      )}

      <form
        className="flex flex-col gap-3"
        onSubmit={handleSubmit}>
        <input
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          placeholder="Username"
          aria-label="Username"
          autoComplete="username"
          minLength={2}
          maxLength={75}
          className={fieldClass}
          required
          autoFocus
        />
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
          autoComplete="new-password"
          className={fieldClass}
          required
        />
        <Button
          type="submit"
          size="lg"
          className="mt-1 w-full"
          disabled={loading}>
          {loading ? "Creating..." : "Submit"}
        </Button>
      </form>
    </>
  );
}

export default SignUpForm;
