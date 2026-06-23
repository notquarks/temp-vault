import { useState } from "react";
import { useNavigate } from "react-router";
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
      name: username, // required
      username: username,
      email: email, // required
      password: password, // required
      image: "https://example.com/image.png",
    });

    if (error) return;
    else navigate("/login");
  };

  const togglePasswordVisibility = () => {
    setPassInputType(passInputType === "password" ? "text" : "password");
  };

  return (
    <main className="flex items-center justify-center min-h-dvh">
      <div className="flex-col justify-center bg-black max-w-dvw max-h-dvh">
        <div className="py-8">
          <h1 className="text-6xl font-extrabold font-orbitron">\\ REGISTER</h1>
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
            <div className="flex w-full border-2 border-white px-2 py-1 ">
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
          <button
            type="submit"
            className="mt-2 px-2 py-1 font-rajdhani text-2xl font-extrabold w-full bg-white text-black hover:outline hover:outline-1 hover:outline-white hover:bg-black hover:text-white hover:cursor-pointer"
          >
            REGISTER
          </button>
        </form>
      </div>
    </main>
  );
}
