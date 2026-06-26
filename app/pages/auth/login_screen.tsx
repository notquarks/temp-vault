import { useState } from "react";
import { useNavigate } from "react-router";
import { authClient } from "~/lib/auth-client";

export function LoginScreen({}) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (username === "" || password === "") {
      alert("Please enter both username and password.");
      return;
    }

    const { data, error } = await authClient.signIn.username({
      username: username,
      password: password,
    });

    const session = await authClient
      .getSession()
      .then(() => navigate("/dashboard"));
    if (error) return;
    else navigate("/dashboard");
  };

  return (
    <main className="flex min-h-dvh items-center justify-center">
      <div className="max-h-dvh max-w-dvw flex-col justify-center">
        <div className="py-8">
          <h1 className="font-orbitron text-6xl font-extrabold">\\ LOGIN</h1>
        </div>
        <form onSubmit={handleLogin}>
          <div className="flex flex-col py-2 font-syne">
            <label htmlFor="username" className="font-syne font-light">
              USERNAME //
            </label>
            <input
              type="text"
              name="username"
              id="username"
              placeholder="your username_"
              className="border-2 border-white px-2 py-1"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
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
              className="border-2 border-white px-2 py-1"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          <button
            type="submit"
            className="mt-2 w-full bg-white px-2 py-1 font-rajdhani text-2xl font-extrabold text-black hover:cursor-pointer hover:bg-black hover:text-white hover:outline hover:outline-1 hover:outline-white"
          >
            LOGIN
          </button>
        </form>
      </div>
    </main>
  );
}
