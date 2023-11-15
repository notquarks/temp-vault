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
import NavBar from "@/components/NavBar";
import { Footer } from "@/components/Footer";
function Page() {
  const { user } = useAuthContext();
  const router = useRouter();

  React.useEffect(() => {
    if (user == null) router.push("/");
  }, [user, router]);

  return (
    <main className="flex min-h-screen flex-col items-center justify-between p-14">
      <NavBar />
      <div className="flex flex-col justify-center items-center w-full grow">
        <FileUpload />
      </div>
      <Footer />
    </main>
  );
}

export default Page;
