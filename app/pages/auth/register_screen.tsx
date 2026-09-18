import { useState } from "react";
import { Link, useNavigate } from "react-router";
import CustomCheckbox from "~/components/custom-checkbox";
import { authClient } from "~/lib/auth-client";
function registrationErrorMessage(error: unknown): string {
    const code = (error as {
        code?: string;
    })?.code;
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
    return (error as {
        message?: string;
    })?.message || "Registration failed.";
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
            setErrorMessage("Username must be 3-30 characters and use letters, numbers, periods, or underscores only.");
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
        }
        catch {
            setErrorMessage("Unable to register. Please try again.");
        }
        finally {
            setIsSubmitting(false);
        }
    };
    const togglePasswordVisibility = () => {
        setPassInputType(passInputType === "password" ? "text" : "password");
    };
    return (<main className="auth-grid flex min-h-dvh items-center justify-center px-5 py-8 sm:px-8">
      <div className="w-full max-w-lg animate-brutal">
        <div className="py-6 sm:py-8 px-2">
          <h1 className="font-syne whitespace-nowrap text-[clamp(2rem,8vw,3.5rem)] leading-none font-extrabold uppercase text-bone">
            REGISTER
          </h1>
        </div>
        <form onSubmit={handleRegister} noValidate>
          <div className="flex flex-col py-2">
            <label htmlFor="username" className="font-mono text-[11px] font-semibold tracking-[0.14em] uppercase text-muted">
              USERNAME //
            </label>
            <input type="text" name="username" id="username" placeholder="your username_" className={`mt-1 min-h-11 w-full border-2 bg-transparent px-3 py-2 font-mono text-base text-bone placeholder:text-muted/60 transition-colors ${errorMessage ? "border-danger-strong" : "border-line-strong focus:border-bone"}`} value={username} onChange={(e) => {
            setUsername(e.target.value);
            setErrorMessage("");
        }} aria-invalid={Boolean(errorMessage)} aria-describedby={errorMessage ? "register-error" : undefined} autoComplete="username"/>
          </div>
          <div className="flex flex-col py-2">
            <label htmlFor="email" className="font-mono text-[11px] font-semibold tracking-[0.14em] uppercase text-muted">
              EMAIL //
            </label>
            <input type="email" name="email" id="email" placeholder="your email_" className={`mt-1 min-h-11 w-full border-2 bg-transparent px-3 py-2 font-mono text-base text-bone placeholder:text-muted/60 transition-colors ${errorMessage ? "border-danger-strong" : "border-line-strong focus:border-bone"}`} value={email} onChange={(e) => {
            setEmail(e.target.value);
            setErrorMessage("");
        }} aria-invalid={Boolean(errorMessage)} aria-describedby={errorMessage ? "register-error" : undefined} autoComplete="email"/>
          </div>
          <div className="flex flex-col py-2">
            <label htmlFor="password" className="font-mono text-[11px] font-semibold tracking-[0.14em] uppercase text-muted">
              PASSWORD //
            </label>
            <div className={`mt-1 flex min-h-11 w-full items-center border-2 bg-transparent px-3 transition-colors ${errorMessage ? "border-danger-strong" : "border-line-strong focus-within:border-bone"}`}>
              <input type={passInputType} name="password" id="password" placeholder="your password_" className="w-full font-mono text-base text-bone placeholder:text-muted/60 bg-transparent" value={password} onChange={(e) => {
            setPassword(e.target.value);
            setErrorMessage("");
        }} aria-invalid={Boolean(errorMessage)} aria-describedby={errorMessage ? "register-error" : undefined} autoComplete="new-password"/>
              <CustomCheckbox onClick={togglePasswordVisibility}/>
            </div>
          </div>
          {errorMessage && (<p id="register-error" role="alert" className="pt-1 font-mono text-sm text-danger">
              {errorMessage}
            </p>)}
          <span className="block py-2 text-sm leading-relaxed text-muted">
            Already have an account?{" "}
            <Link className="text-bone underline decoration-bone/40 underline-offset-4 hover:decoration-bone" to="/login">
              Login
            </Link>
          </span>
          <button type="submit" disabled={isSubmitting} className="btn-hud-primary btn-hud-constructive mt-2 w-full">
            {isSubmitting ? "REGISTERING..." : "REGISTER"}
          </button>
        </form>
      </div>
    </main>);
}
