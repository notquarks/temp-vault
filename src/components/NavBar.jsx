"use client";

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
import { usePathname } from "next/navigation";
import AnimatedBackground from "./core/animated-background";

export default function NavBar() {
  const { user } = useAuthContext();
  const router = useRouter();
  const pathname = usePathname();
  const TABS = [
    { name: "Upload", route: "/" },
    { name: "Files", route: "/dashboard" },
  ];

  async function signOutUser() {
    try {
      // Sign out from Firebase
      await signOut(auth);

      // Call the custom API endpoint to clear the session cookie
      const response = await fetch("/api/signout", {
        method: "POST",
        credentials: "include", // This is important for including cookies in the request
      });

      if (response.ok) {
        console.log("Signed out successfully");
        router.push("/");
      } else {
        console.error("Failed to sign out on the server");
      }
    } catch (error) {
      console.error("Error signing out:", error);
    }
  }
  const handleLogoClick = (e) => {
    e.preventDefault();
    router.push("/");
  };
  // console.log("user ", user);
  return (
    <div className="z-10 flex w-full max-w-5xl flex-col gap-6 font-mono text-sm lg:flex">
      <div className="z-10 w-full max-w-5xl items-center justify-between font-mono text-sm lg:flex">
        <div className="flex flex-col items-start justify-end">
          <section className="flex flex-row items-center">
            <Sailboat className="mr-3 h-6 w-6" />
            <Link href={"/"} onClick={handleLogoClick}>
              <h1 className="text-center text-4xl font-bold">Arkivio</h1>
            </Link>
          </section>
          <p>
            This temporary file storage lets you share or keep your files for 30
            days
          </p>
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
                      <AvatarFallback>N</AvatarFallback>
                    </Avatar>
                    <p>{user.displayName}</p>
                  </section>
                )}
              </NavigationMenuItem>
              {user && (
                <NavigationMenuItem>
                  <Button
                    onClick={signOutUser}
                    variant="link"
                    className="text-foreground"
                  >
                    Logout
                  </Button>
                </NavigationMenuItem>
              )}
            </NavigationMenuList>
          </NavigationMenu>
        </div>
      </div>
      {user && (
        <div className="flex w-fit rounded-[8px] p-[2px] dark:bg-zinc-800">
          <NavigationMenu>
            <NavigationMenuList className="gap-0">
              <AnimatedBackground
                defaultValue={router.pathname === "/" ? "Upload" : "Files"}
                className="rounded-lg dark:bg-zinc-800"
                transition={{
                  type: "spring",
                  bounce: 0.2,
                  duration: 0.3,
                }}
                enableHover
              >
                {TABS.map((tab, index) => (
                  <NavigationMenuItem key={index} data-id={tab.name}>
                    <Link href={tab.route} legacyBehavior passHref>
                      <NavigationMenuLink
                        className={`inline-flex w-20 items-center justify-center rounded-lg px-2 py-2 text-center font-normal text-zinc-800 transition-transform hover:font-bold active:scale-[0.98] dark:text-zinc-50 dark:hover:bg-zinc-50 dark:hover:text-zinc-800 ${pathname === tab.route ? "bg-zinc-700 font-bold dark:bg-zinc-200 dark:text-zinc-800" : ""}`}
                      >
                        {tab.name}
                      </NavigationMenuLink>
                    </Link>
                  </NavigationMenuItem>
                ))}
              </AnimatedBackground>
            </NavigationMenuList>
          </NavigationMenu>
        </div>
      )}
    </div>
  );
}
