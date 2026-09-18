import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router";
import { authClient } from "~/lib/auth-client";
export function LoginScreen({}) {
    const location = useLocation();
    const registeredUsername = (location.state as { registeredUsername?: string } | null)?.registeredUsername;
    const [username, setUsername] = useState(registeredUsername ?? "");
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
                const code = (error as { code?: string })?.code;
                if (code === "INVALID_USERNAME") {
                    setErrorMessage("That doesn't look like a username — use the username you registered with, not your email.");
                }
                else if (error.status === 401 || error.status === 403) {
                    setErrorMessage("Invalid username or password.");
                }
                else {
                    setErrorMessage("Unable to sign in right now. Please try again.");
                }
                return;
            }
            navigate("/dashboard");
        }
        catch {
            setErrorMessage("Unable to sign in. Please try again.");
        }
        finally {
            setIsSubmitting(false);
        }
    };
    return (<main className="auth-grid flex min-h-dvh items-center justify-center px-5 py-8 sm:px-8">
      <div className="w-full max-w-md animate-brutal">
        <div className="py-6 sm:py-8 px-2">
          <h1 className="font-syne text-[clamp(2.5rem,13vw,3.75rem)] leading-none font-extrabold uppercase break-words text-bone">
            LOGIN
          </h1>
          {registeredUsername && (
            <p className="font-mono text-[11px] tracking-[0.14em] uppercase text-safe mt-3" role="status">
              [Account created — sign in to continue]
            </p>
          )}
        </div>
        <form onSubmit={handleLogin} noValidate>
          <div className="flex flex-col py-2">
            <label htmlFor="username" className="font-mono text-[11px] font-semibold tracking-[0.14em] uppercase text-muted">
              USERNAME //
            </label>
            <input type="text" name="username" id="username" placeholder="your username_" className={`mt-1 min-h-11 w-full border-2 bg-transparent px-3 py-2 font-mono text-base text-bone placeholder:text-muted/60 transition-colors ${errorMessage ? "border-danger-strong" : "border-line-strong focus:border-bone"}`} value={username} onChange={(e) => {
            setUsername(e.target.value);
            setErrorMessage("");
        }} aria-invalid={Boolean(errorMessage)} aria-describedby={errorMessage ? "login-error" : undefined} autoComplete="username"/>
          </div>
          <div className="flex flex-col py-2">
            <label htmlFor="password" className="font-mono text-[11px] font-semibold tracking-[0.14em] uppercase text-muted">
              PASSWORD //
            </label>
            <input type="password" name="password" id="password" placeholder="your password_" className={`mt-1 min-h-11 w-full border-2 bg-transparent px-3 py-2 font-mono text-base text-bone placeholder:text-muted/60 transition-colors ${errorMessage ? "border-danger-strong" : "border-line-strong focus:border-bone"}`} value={password} onChange={(e) => {
            setPassword(e.target.value);
            setErrorMessage("");
        }} aria-invalid={Boolean(errorMessage)} aria-describedby={errorMessage ? "login-error" : undefined} autoComplete="current-password"/>
          </div>
          {errorMessage && (<p id="login-error" role="alert" className="pt-1 font-mono text-sm text-danger">
              {errorMessage}
            </p>)}
          <span className="block py-2 text-sm leading-relaxed text-muted">
            Don't have an account yet?{" "}
            <Link className="text-bone underline decoration-bone/40 underline-offset-4 hover:decoration-bone" to="/register">
              Register
            </Link>
          </span>
          <button type="submit" disabled={isSubmitting} className="btn-hud-primary btn-hud-constructive mt-2 w-full">
            {isSubmitting ? "SIGNING IN..." : "LOGIN"}
          </button>
        </form>
      </div>
    </main>);
}
