"use client";
import { useEffect, useState } from "react";
// import signIn from "@/firebase/auth/signin";
import { getRedirectResult, signInWithRedirect } from "firebase/auth";
import { auth, provider } from "@/firebase/config";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Sailboat } from "lucide-react";
import Link from "next/link";

function Page() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const router = useRouter();

  useEffect(() => {
    getRedirectResult(auth).then(async (userCred) => {
      if (!userCred) {
        return;
      }

      fetch("/api/login", {
        method: "POST",
        method: "POST",
        headers: {
          Authorization: `Bearer ${await userCred.user.getIdToken()}`,
        },
      }).then((response) => {
        if (response.status === 200) {
          router.push("/dashboard");
        }
        console.log("login api res:", response);
      });
    });
  }, []);

  function signIn() {
    signInWithRedirect(auth, provider);
  }

  return (
    <main className="flex min-h-screen w-full justify-center items-center">
      <div className="flex flex-col gap-6">
        <div className="flex flex-col justify-end items-center ">
          <section className="flex flex-row items-center">
            <Sailboat className="h-6 w-6 mr-3" />
            <Link href={"/"} onClick={() => window.location.reload()}>
              <h1 className="text-4xl font-bold text-center">Arkivio</h1>
            </Link>
          </section>
          <p>a place to store and share files temporarily</p>
        </div>
        <Button onClick={() => signIn()}>Sign In with Google</Button>
      </div>
    </main>
  );
}

export default Page;
