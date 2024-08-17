"use client";

import { useState } from "react";
import { signInWithPopup } from "firebase/auth";
import { auth, provider } from "@/firebase/config";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

export default function LoginButton() {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function signIn() {
    setLoading(true);
    try {
      const userCred = await signInWithPopup(auth, provider);
      const idToken = await userCred.user.getIdToken();
      const response = await fetch("/api/login", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${idToken}`,
        },
      });

      if (response.status === 200) {
        router.push("/dashboard");
      } else {
        console.error("Login failed:", await response.text());
      }
    } catch (error) {
      console.error("Error during sign in:", error);
    } finally {
      setLoading(false);
    }
  }

  return (
    <Button onClick={signIn} disabled={loading}>
      {loading ? "Signing In..." : "Sign In with Google"}
    </Button>
  );
}
