"use client";
import React, { useEffect } from "react";
import signIn from "@/firebase/auth/signin";
import { useRouter } from "next/navigation";
import { getRedirectResult, signInWithRedirect } from "firebase/auth";
import { auth, provider } from "@/firebase/config";

function Page() {
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const router = useRouter();

  useEffect(() => {
    getRedirectResult(auth).then(async (userCred) => {
      if (!userCred) {
        return;
      }

      fetch("/api/login", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${await userCred.user.getIdToken()}`,
        },
      }).then((response) => {
        if (response.status === 200) {
          router.push("/dashboard");
        }
      });
    });
  }, []);

  function signIn() {
    signInWithRedirect(auth, provider);
  }

  const handleForm = async (event) => {
    event.preventDefault();
    const { result, error } = await signIn(email, password);

    if (error) {
      return console.log(error);
    }

    console.log(result);
    return router.push("/admin");
  };
  return (
    <div className="wrapper">
      <div className="form-wrapper">
        <h1 className="mt-60 mb-30">Sign in</h1>
        <form onSubmit={handleForm} className="form">
          <label htmlFor="email">
            <p>Email</p>
            <input
              onChange={(e) => setEmail(e.target.value)}
              required
              type="email"
              name="email"
              id="email"
              placeholder="example@mail.com"
            />
          </label>
          <label htmlFor="password">
            <p>Password</p>
            <input
              onChange={(e) => setPassword(e.target.value)}
              required
              type="password"
              name="password"
              id="password"
              placeholder="password"
            />
          </label>
          <button onClick={() => signIn()}>Sign In</button>
        </form>
      </div>
    </div>
  );
}

export default Page;
