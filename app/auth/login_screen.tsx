import { useState } from "react";
import { useNavigate } from "react-router";
import { authClient } from "~/lib/auth-client";

export function LoginScreen({}) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (username == "" || password == "") {
      alert("Please enter both username and password.");
      return;
    }

    const { data, error } = await authClient.signIn.username({
      username: username,
      password: password,
    });

    if (error) return;
    else navigate("/dashboard");
  };

  return (
    <main className="flex items-center justify-center min-h-dvh">
      <div className="flex-col justify-center bg-black max-w-dvw max-h-dvh">
        <div className="py-8">
          <h1 className="text-6xl font-extrabold font-orbitron">\\ LOGIN</h1>
        </div>
        <form onSubmit={handleLogin}>
          <div className="flex flex-col py-2 font-syne">
            <label htmlFor="username" className="font-light font-syne">
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
            <label htmlFor="password" className="font-light font-syne">
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
            className="mt-2 px-2 py-1 font-rajdhani text-2xl font-extrabold w-full bg-white text-black hover:outline hover:outline-1 hover:outline-white hover:bg-black hover:text-white hover:cursor-pointer"
          >
            LOGIN
          </button>
        </form>
      </div>
    </main>
  );
}
