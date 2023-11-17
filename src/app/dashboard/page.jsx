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
function Page() {
  const { user } = useAuthContext();
  const router = useRouter();
  const [files, setFiles] = useState([]);

  useEffect(() => {
    if (user == null) {
      router.push("/");
    }
    const fetchData = async () => {
      const result = await getAllFiles();
      console.log(result);
      setFiles(result);
    };
    fetchData();
  }, [user, router]);

  async function getAllFiles() {
    try {
      const response = await fetch("/api/files", {
        method: "GET",
        headers: {
          Authorization: `UserID ${user.uid}`,
        },
      });

      if (response.status === 200) {
        const data = await response.json(); // Read the response data
        // console.log(data);
        return data;
      }
    } catch (error) {
      console.error("Error fetching files:", error);
    }
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-between p-14">
      <NavBar />
      <div className="flex flex-col justify-center items-center w-full grow">
        <div className="flex-1 flex flex-col h-full grow items-center gap-2 my-6 md:w-7/12 w-full">
          {Array.from(files).length > 0 ? (
            files.map((file, index) => <FileCard data={file} key={index} />)
          ) : (
            <>
              <div className="flex flex-1 grow w-full flex-col m-2 gap-2">
                <Card className="flex flex-col grow justify-center gap-4 items-center p-4 py-3">
                  No Files
                </Card>
                {/* ))} */}
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
