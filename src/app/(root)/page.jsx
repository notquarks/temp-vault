"use client";
import {
  NavigationMenu,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  navigationMenuTriggerStyle,
} from "@/components/ui/navigation-menu";
import { cva } from "class-variance-authority";
import Image from "next/image";
import Link from "next/link";
import { Sailboat } from "lucide-react";
import FileUpload from "@/components/ui/file-upload";
import NavBar from "@/components/NavBar";
import { Footer } from "@/components/Footer";
import { useAuthContext } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function Home() {
  const { user } = useAuthContext();
  const router = useRouter();

  useEffect(() => {
    if (user == null) router.push("/");
  }, [user, router]);

  return (
    <main className="flex min-h-screen flex-col items-center justify-between p-4 md:p-14">
      <NavBar />
      <div className="flex w-full grow flex-col items-center justify-center">
        <FileUpload />
      </div>
      <Footer />
    </main>
  );
}
