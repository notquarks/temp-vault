"use client";
import React from "react";
import { useAuthContext } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import {
  NavigationMenu,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  navigationMenuTriggerStyle,
} from "@/components/ui/navigation-menu";
import Link from "next/link";
import { Sailboat } from "lucide-react";
import FileUpload from "@/components/ui/file-upload";
function Page() {
  const { user } = useAuthContext();
  const router = useRouter();

  React.useEffect(() => {
    if (user == null) router.push("/");
  }, [user, router]);

  return (
    <main className="flex min-h-screen flex-col items-center justify-between p-14">
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
                <Link href="/login" legacyBehavior passHref>
                  <NavigationMenuLink
                    className={
                      (navigationMenuTriggerStyle(), "hover:underline")
                    }
                  >
                    Login
                  </NavigationMenuLink>
                </Link>
              </NavigationMenuItem>
              <NavigationMenuItem>
                <Link href="/signout" legacyBehavior passHref>
                  <NavigationMenuLink
                    className={
                      (navigationMenuTriggerStyle(), "hover:underline")
                    }
                  >
                    Logout
                  </NavigationMenuLink>
                </Link>
              </NavigationMenuItem>
            </NavigationMenuList>
          </NavigationMenu>
        </div>
      </div>
      <div className="flex flex-col justify-center items-center w-full grow">
        <FileUpload />
      </div>
      <div>
        <section>Footer Here</section>
      </div>
    </main>
  );
}

export default Page;