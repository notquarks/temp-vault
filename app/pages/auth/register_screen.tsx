import { useState } from "react";
import { Link, useNavigate } from "react-router";
import CustomCheckbox from "~/components/custom-checkbox";
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
        "Username must be 3-30 characters and use letters, numbers, periods, or underscores only.",
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
        image: "https://example.com/image.png",
      });
      if (error) {
        setErrorMessage(registrationErrorMessage(error));
        return;
      }
      navigate("/login");
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
    <main className="marathon-grid flex min-h-dvh items-center justify-center px-5 py-8 sm:px-8">
      <div className="w-full max-w-md">
        <div className="py-5 sm:py-8">
          <h1 className="font-orbitron text-[clamp(2.25rem,11vw,3.75rem)] leading-none font-extrabold break-words">
            \\ REGISTER
          </h1>
        </div>
        <form onSubmit={handleRegister} noValidate>
          <div className="flex flex-col py-2 font-syne">
            <label htmlFor="username" className="font-light">
              USERNAME //
            </label>
            <input
              type="text"
              name="username"
              id="username"
              placeholder="your username_"
              className={`min-h-11 w-full border-2 px-3 py-2 text-base focus-visible:outline-none ${
                errorMessage ? "border-red-400" : "border-white"
              }`}
              value={username}
              onChange={(e) => {
                setUsername(e.target.value);
                setErrorMessage("");
              }}
              aria-invalid={Boolean(errorMessage)}
              aria-describedby={errorMessage ? "register-error" : undefined}
              autoComplete="username"
            />
          </div>
          <div className="flex flex-col py-2 font-syne">
            <label htmlFor="email" className="font-light">
              EMAIL //
            </label>
            <input
              type="email"
              name="email"
              id="email"
              placeholder="your email_"
              className={`min-h-11 w-full border-2 px-3 py-2 text-base focus-visible:outline-none ${
                errorMessage ? "border-red-400" : "border-white"
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
          <div className="flex flex-col py-2 font-syne">
            <label htmlFor="password" className="font-light">
              PASSWORD //
            </label>
            <div
              className={`flex min-h-11 w-full items-center border-2 px-3 py-2 ${
                errorMessage ? "border-red-400" : "border-white"
              }`}
            >
              <input
                type={passInputType}
                name="password"
                id="password"
                placeholder="your password_"
                className="w-full focus-visible:outline-none"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setErrorMessage("");
                }}
                aria-invalid={Boolean(errorMessage)}
                aria-describedby={errorMessage ? "register-error" : undefined}
                autoComplete="new-password"
              />
              <CustomCheckbox onClick={togglePasswordVisibility} />
            </div>
          </div>
          {errorMessage && (
            <p
              id="register-error"
              role="alert"
              className="pt-1 font-syne text-sm text-red-400"
            >
              {errorMessage}
            </p>
          )}
          <span className="block py-1 text-sm leading-relaxed font-light">
            Already have an account?{" "}
            <Link className="underline" to="/login">
              Login
            </Link>
          </span>
          <button
            type="submit"
            disabled={isSubmitting}
            className="mt-3 min-h-12 w-full bg-white px-3 py-2 font-rajdhani text-xl font-extrabold text-black hover:cursor-pointer hover:bg-black hover:text-white hover:outline hover:outline-1 hover:outline-white sm:text-2xl"
          >
            {isSubmitting ? "REGISTERING..." : "REGISTER"}
          </button>
        </form>
      </div>
    </main>
  );
}
