import { useState } from "react";
import { Link, useNavigate } from "react-router";
import { authClient } from "~/lib/auth-client";

export function LoginScreen({}) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();

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
        setErrorMessage("Invalid username or password.");
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
    <main className="marathon-grid flex min-h-dvh items-center justify-center px-5 py-8 sm:px-8">
      <div className="w-full max-w-md">
        <div className="py-5 sm:py-8">
          <h1 className="font-orbitron text-[clamp(2.5rem,13vw,3.75rem)] leading-none font-extrabold break-words">
            \\ LOGIN
          </h1>
        </div>
        <form onSubmit={handleLogin} noValidate>
          <div className="flex flex-col py-2 font-syne">
            <label htmlFor="username" className="font-syne font-light">
              USERNAME //
            </label>
            <input
              type="text"
              name="username"
              id="username"
              placeholder="your username_"
              className={`min-h-11 w-full border-2 px-3 py-2 text-base ${
                errorMessage ? "border-red-400" : "border-white"
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
          <div className="flex flex-col py-2 font-syne">
            <label htmlFor="password" className="font-syne font-light">
              PASSWORD //
            </label>
            <input
              type="password"
              name="password"
              id="password"
              placeholder="your password_"
              className={`min-h-11 w-full border-2 px-3 py-2 text-base ${
                errorMessage ? "border-red-400" : "border-white"
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
          </div>
          {errorMessage && (
            <p
              id="login-error"
              role="alert"
              className="pt-1 font-syne text-sm text-red-400"
            >
              {errorMessage}
            </p>
          )}
          <span className="block py-1 text-sm leading-relaxed font-light">
            Don't have an account yet?{" "}
            <Link className="underline" to="/register">
              {" "}
              Register{" "}
            </Link>
          </span>{" "}
          <button
            type="submit"
            disabled={isSubmitting}
            className="mt-3 min-h-12 w-full bg-white px-3 py-2 font-rajdhani text-xl font-extrabold text-black hover:cursor-pointer hover:bg-black hover:text-white hover:outline hover:outline-1 hover:outline-white sm:text-2xl"
          >
            {isSubmitting ? "SIGNING IN..." : "LOGIN"}
          </button>
        </form>
      </div>
    </main>
  );
}
