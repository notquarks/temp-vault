import { useState } from "react";
import { Link, useNavigate } from "react-router";
import { Sailboat, ArrowUpRight, Eye, EyeOff, LogIn } from "lucide-react";
import { authClient } from "~/lib/auth-client";

function registrationErrorMessage(error: unknown): string {
  const code = (error as { code?: string })?.code;
  if (code === "USERNAME_TOO_SHORT") {
    return "Username must be at least 3 characters.";
  }
  if (code === "USERNAME_TOO_LONG") {
    return "Username must be 30 characters or fewer.";
  }
  if (code === "INVALID_USERNAME") {
    return "Username can use letters, numbers, periods, and underscores only.";
  }
  if (code === "USERNAME_IS_ALREADY_TAKEN") {
    return "That username is already taken.";
  }
  if (code === "PASSWORD_TOO_SHORT") {
    return "Password must be at least 8 characters.";
  }
  if (code === "PASSWORD_TOO_LONG") {
    return "Password is too long.";
  }
  if (code === "INVALID_PASSWORD") {
    return "Enter a valid password.";
  }
  return (error as { message?: string })?.message || "Registration failed.";
}

export function RegisterScreen({}) {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [passInputType, setPassInputType] = useState("password");
  const [errorMessage, setErrorMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();

  const handleRegister = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const normalizedUsername = username.trim().toLowerCase();
    if (!email.trim() || !normalizedUsername || !password) {
      setErrorMessage("Enter an email, username, and password.");
      return;
    }
    if (!/^[a-z0-9_.]{3,30}$/.test(normalizedUsername)) {
      setErrorMessage(
        "Username must be 3 to 30 characters and use letters, numbers, periods, or underscores only.",
      );
      return;
    }
    if (password.length < 8) {
      setErrorMessage("Password must be at least 8 characters.");
      return;
    }
    setErrorMessage("");
    setIsSubmitting(true);
    try {
      const { error } = await authClient.signUp.email({
        name: username.trim(),
        username: normalizedUsername,
        email: email.trim(),
        password,
      });
      if (error) {
        setErrorMessage(registrationErrorMessage(error));
        return;
      }
      navigate("/login", { state: { registeredUsername: normalizedUsername } });
    } catch {
      setErrorMessage("Unable to register. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const togglePasswordVisibility = () => {
    setPassInputType(passInputType === "password" ? "text" : "password");
  };

  return (
    <div className="app-shell">
      <header className="app-header">
        <Link to="/" className="app-brand" aria-label="Arkivio home">
          <Sailboat size={22} strokeWidth={2} aria-hidden="true" />
          Arkivio
        </Link>
        <Link to="/login" className="nav-pill">
          <LogIn size={16} strokeWidth={2} aria-hidden="true" />
          Sign in
        </Link>
      </header>

      <main className="app-main flex flex-1 items-center justify-center py-8 sm:py-12">
        <section
          className="vault-card w-full max-w-lg"
          aria-labelledby="register-heading"
        >
          <h1 id="register-heading" className="page-heading mb-6">
            Create account
          </h1>

          <form
            onSubmit={handleRegister}
            noValidate
            className="flex flex-col gap-5"
            aria-busy={isSubmitting}
          >
            <div className="flex flex-col gap-2">
              <label
                htmlFor="username"
                className="px-2 text-sm font-medium text-bone"
              >
                Username
              </label>
              <input
                type="text"
                name="username"
                id="username"
                placeholder="Username (3 to 30 characters)"
                className={`w-full ${
                  errorMessage ? "border-danger" : "border-line"
                }`}
                value={username}
                onChange={(e) => {
                  setUsername(e.target.value);
                  setErrorMessage("");
                }}
                aria-invalid={Boolean(errorMessage)}
                aria-describedby="username-help"
                autoComplete="username"
              />
              <p id="username-help" className="px-2 text-xs text-muted">
                3 to 30 characters. Letters, numbers, periods, and underscores.
              </p>
            </div>

            <div className="flex flex-col gap-2">
              <label
                htmlFor="email"
                className="px-2 text-sm font-medium text-bone"
              >
                Email
              </label>
              <input
                type="email"
                name="email"
                id="email"
                placeholder="you@example.com"
                className={`w-full ${
                  errorMessage ? "border-danger" : "border-line"
                }`}
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  setErrorMessage("");
                }}
                aria-invalid={Boolean(errorMessage)}
                aria-describedby={errorMessage ? "register-error" : undefined}
                autoComplete="email"
              />
            </div>

            <div className="flex flex-col gap-2">
              <label
                htmlFor="password"
                className="px-2 text-sm font-medium text-bone"
              >
                Password
              </label>
              <div className="relative flex items-center">
                <input
                  type={passInputType}
                  name="password"
                  id="password"
                  placeholder="At least 8 characters"
                  className={`w-full pr-14 ${
                    errorMessage ? "border-danger" : "border-line-strong"
                  }`}
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    setErrorMessage("");
                  }}
                  aria-invalid={Boolean(errorMessage)}
                  aria-describedby="password-help"
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  onClick={togglePasswordVisibility}
                  aria-label={
                    passInputType === "password"
                      ? "Show password"
                      : "Hide password"
                  }
                  title={
                    passInputType === "password"
                      ? "Show password"
                      : "Hide password"
                  }
                  aria-pressed={passInputType === "text"}
                  className={`absolute right-1.5 inline-flex h-11 w-11 items-center justify-center rounded-full transition-colors ${
                    passInputType === "text"
                      ? "bg-paper text-bone"
                      : "text-muted hover:bg-paper hover:text-bone"
                  }`}
                >
                  {passInputType === "password" ? (
                    <Eye size={18} strokeWidth={2} aria-hidden="true" />
                  ) : (
                    <EyeOff size={18} strokeWidth={2} aria-hidden="true" />
                  )}
                </button>
              </div>
              <p id="password-help" className="px-2 text-xs text-muted">
                Minimum 8 characters.
              </p>
            </div>

            {errorMessage && (
              <p
                id="register-error"
                role="alert"
                className="rounded-2xl border-2 border-danger bg-pure-white px-5 py-3 text-sm font-medium text-danger"
              >
                {errorMessage}
              </p>
            )}

            <button
              type="submit"
              disabled={isSubmitting}
              className="btn-hud-primary mt-2 w-full"
            >
              {isSubmitting ? "Creating account…" : "Create account"}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-muted">
            Already have an account?{" "}
            <Link
              to="/login"
              className="font-medium text-bone underline underline-offset-4"
            >
              Sign in
            </Link>
          </p>
        </section>
      </main>

      <footer className="app-footer">
        <span>© 2026 Arkivio</span>
        <a
          href="https://github.com/notquarks/temp-vault"
          target="_blank"
          rel="noopener noreferrer"
        >
          GitHub
          <ArrowUpRight size={15} strokeWidth={2} aria-hidden="true" />
        </a>
      </footer>
    </div>
  );
}
