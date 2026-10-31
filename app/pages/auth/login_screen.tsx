import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router";
import { Sailboat, ArrowUpRight, Eye, EyeOff, UserPlus } from "lucide-react";
import { authClient } from "~/lib/auth-client";

export function LoginScreen({}) {
  const location = useLocation();
  const registeredUsername = (
    location.state as { registeredUsername?: string } | null
  )?.registeredUsername;
  const [username, setUsername] = useState(registeredUsername ?? "");
  const [password, setPassword] = useState("");
  const [passInputType, setPassInputType] = useState("password");
  const [errorMessage, setErrorMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();

  const togglePasswordVisibility = () => {
    setPassInputType((prev) => (prev === "password" ? "text" : "password"));
  };

  const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!username.trim() || !password) {
      setErrorMessage("Enter your username and password.");
      return;
    }
    setErrorMessage("");
    setIsSubmitting(true);
    try {
      const { error } = await authClient.signIn.username({
        username: username.trim(),
        password,
      });
      if (error) {
        const code = (error as { code?: string })?.code;
        if (code === "INVALID_USERNAME") {
          setErrorMessage(
            "Use the username you registered with, not your email.",
          );
        } else if (error.status === 401 || error.status === 403) {
          setErrorMessage("Invalid username or password.");
        } else {
          setErrorMessage("Unable to sign in right now. Please try again.");
        }
        return;
      }
      navigate("/dashboard");
    } catch {
      setErrorMessage("Unable to sign in. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="app-shell">
      <header className="app-header">
        <Link to="/" className="app-brand" aria-label="Arkivio home">
          <Sailboat size={22} strokeWidth={2} aria-hidden="true" />
          Arkivio
        </Link>
        <Link to="/register" className="nav-pill">
          <UserPlus size={16} strokeWidth={2} aria-hidden="true" />
          Create account
        </Link>
      </header>

      <main className="app-main flex flex-1 items-center justify-center py-8 sm:py-12">
        <section
          className="vault-card w-full max-w-lg"
          aria-labelledby="login-heading"
        >
          <h1 id="login-heading" className="page-heading mb-6">
            Sign in
          </h1>

          {registeredUsername && !errorMessage && (
            <div
              role="status"
              className="mb-6 rounded-3xl bg-pixel-glare px-5 py-4 text-sm font-medium text-abyssal-ink"
            >
              Account created for{" "}
              <span className="font-mono font-semibold">
                {registeredUsername}
              </span>
              . Enter your password to continue.
            </div>
          )}

          <form
            onSubmit={handleLogin}
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
                placeholder="Username"
                className={`w-full ${
                  errorMessage ? "border-danger" : "border-line-strong"
                }`}
                value={username}
                onChange={(e) => {
                  setUsername(e.target.value);
                  setErrorMessage("");
                }}
                aria-invalid={Boolean(errorMessage)}
                aria-describedby={errorMessage ? "login-error" : undefined}
                autoComplete="username"
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
                  placeholder="Password"
                  className={`w-full pr-14 ${
                    errorMessage ? "border-danger" : "border-line-strong"
                  }`}
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    setErrorMessage("");
                  }}
                  aria-invalid={Boolean(errorMessage)}
                  aria-describedby={errorMessage ? "login-error" : undefined}
                  autoComplete="current-password"
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
            </div>

            {errorMessage && (
              <p
                id="login-error"
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
              {isSubmitting ? "Signing in…" : "Sign in"}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-muted">
            No account yet?{" "}
            <Link
              to="/register"
              className="font-medium text-bone underline underline-offset-4"
            >
              Create account
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
