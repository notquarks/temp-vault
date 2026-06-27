import { useState } from "react";
import { Link, useNavigate } from "react-router";
import CustomCheckbox from "~/components/custom-checkbox";
import { authClient } from "~/lib/auth-client";

export function RegisterScreen({}) {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [passInputType, setPassInputType] = useState("password");
  const navigate = useNavigate();

  const handleRegister = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (email == "" || username == "" || password == "") {
      alert("Please enter email, username and password.");
      return;
    }

    const { data, error } = await authClient.signUp.email({
      name: username,
      username: username.toLowerCase().replace(/[^a-z0-9_]/g, ""),
      email: email,
      password: password,
      image: "https://example.com/image.png",
    });

    if (error) {
      alert(`Registration failed: ${error.message}`);
      return;
    } else {
      navigate("/login");
    }
  };

  const togglePasswordVisibility = () => {
    setPassInputType(passInputType === "password" ? "text" : "password");
  };

  return (
    <main className="flex min-h-dvh items-center justify-center">
      <div className="max-h-dvh max-w-dvw flex-col justify-center">
        <div className="py-8">
          <h1 className="font-orbitron text-6xl font-extrabold">\\ REGISTER</h1>
        </div>
        <form onSubmit={handleRegister}>
          <div className="flex flex-col py-2 font-syne">
            <label htmlFor="username" className="font-light">
              USERNAME //
            </label>
            <input
              type="text"
              name="username"
              id="username"
              placeholder="your username_"
              className="border-2 border-white px-2 py-1 focus-visible:outline-none"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
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
              className="border-2 border-white px-2 py-1 focus-visible:outline-none"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div className="flex flex-col py-2 font-syne">
            <label htmlFor="password" className="font-light">
              PASSWORD //
            </label>
            <div className="flex w-full border-2 border-white px-2 py-1">
              <input
                type={passInputType}
                name="password"
                id="password"
                placeholder="your password_"
                className="w-full focus-visible:outline-none"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <CustomCheckbox onClick={togglePasswordVisibility} />
            </div>
          </div>
          <span className="text-sm font-light">
            Already have an account?{" "}
            <Link className="underline" to="/login">
              Login
            </Link>
          </span>
          <button
            type="submit"
            className="mt-2 w-full bg-white px-2 py-1 font-rajdhani text-2xl font-extrabold text-black hover:cursor-pointer hover:bg-black hover:text-white hover:outline hover:outline-1 hover:outline-white"
          >
            REGISTER
          </button>
        </form>
      </div>
    </main>
  );
}
