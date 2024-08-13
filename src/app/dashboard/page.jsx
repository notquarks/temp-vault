"use client";
import React, { useEffect, useState } from "react";
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
import { Card } from "@/components/ui/card";
import FileCard from "@/components/ui/file-card";
import { LoadingPlaceholder } from "@/components/Loading";
function Page() {
  const { user } = useAuthContext();
  const router = useRouter();
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (user === null) {
      router.push("/");
      return;
    }

    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await fetch("/api/files", {
          method: "GET",
          headers: {
            Authorization: `UserID ${user.uid}`,
          },
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        setFiles(data);
      } catch (error) {
        console.error("Error fetching files:", error);
        setError("Failed to fetch files. Please try again later.");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user, router]);

  if (loading) {
    return <LoadingPlaceholder />;
  }

  if (error) {
    return (
      <div className="flex h-screen items-center justify-center">
        Error: {error}
      </div>
    );
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-between p-4 md:p-14">
      <NavBar />
      <div className="flex w-full grow flex-col items-center justify-center">
        <div className="my-6 flex h-full w-full max-w-5xl flex-1 grow flex-col items-center gap-2">
          {Array.from(files).length > 0 ? (
            files.map((file, index) => <FileCard data={file} key={index} />)
          ) : (
            <>
              <div className="m-2 flex w-full flex-1 grow flex-col gap-2">
                <Card className="flex grow flex-col items-center justify-center gap-4 p-4 py-3">
                  No Files
                </Card>
              </div>
            </>
          )}
        </div>
      </div>
      <Footer />
    </main>
  );
}

export default Page;
