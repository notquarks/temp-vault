import { Sailboat } from "lucide-react";
import Link from "next/link";
import React from "react";
import {
  NavigationMenu,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  navigationMenuTriggerStyle,
} from "./ui/navigation-menu";
import { useAuthContext } from "@/context/AuthContext";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { Button } from "./ui/button";
import { signOut } from "firebase/auth";
import { auth } from "@/firebase/config";
import { useRouter } from "next/navigation";

export default function NavBar() {
  const { user } = useAuthContext();
  const router = useRouter();

  async function signOutUser() {
    await signOut(auth);

    const response = await fetch("http://localhost:3000/api/signout", {
      method: "POST",
    });

    if (response.status === 200) {
      router.push("/");
    }
  }
  console.log("user ", user);
  return (
    <div className="z-10 max-w-5xl w-full items-center justify-between font-mono text-sm lg:flex">
      <div className="flex flex-col justify-end items-start ">
        <section className="flex flex-row items-center">
          <Sailboat className="h-6 w-6 mr-3" />
          <Link href={"/"} onClick={() => window.location.reload()}>
            <h1 className="text-4xl font-bold text-center">Arkivio</h1>
          </Link>
        </section>
        <p>a place to store and share files temporarily</p>
      </div>
      <div className="flex items-center justify-between">
        <NavigationMenu>
          <NavigationMenuList className="gap-6">
            <NavigationMenuItem>
              {!user ? (
                <Link href="/login" legacyBehavior passHref>
                  <NavigationMenuLink
                    className={
                      (navigationMenuTriggerStyle(), "hover:underline")
                    }
                  >
                    Login
                  </NavigationMenuLink>
                </Link>
              ) : (
                <section className="flex items-center gap-3">
                  <Avatar>
                    <AvatarImage src={user.photoURL} />
                    <AvatarFallback>CN</AvatarFallback>
                  </Avatar>
                  <p>{user.displayName}</p>
                </section>
              )}
            </NavigationMenuItem>
            <NavigationMenuItem>
              <Button
                onClick={signOutUser}
                variant="link"
                className="text-foreground"
              >
                Logout
              </Button>
            </NavigationMenuItem>
          </NavigationMenuList>
        </NavigationMenu>
      </div>
    </div>
  );
}
