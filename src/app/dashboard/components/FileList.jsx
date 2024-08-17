"use client";

import React, { useEffect, useState } from "react";
import { useAuthContext } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/card";
import FileCard from "@/components/ui/file-card";
import { LoadingPlaceholder } from "@/components/Loading";

export default function FileList() {
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
    <>
      {Array.from(files).length > 0 ? (
        files.map((file, index) => <FileCard data={file} key={index} />)
      ) : (
        <div className="m-2 flex w-full flex-1 grow flex-col gap-2">
          <Card className="flex grow flex-col items-center justify-center gap-4 p-4 py-3">
            No Files
          </Card>
        </div>
      )}
    </>
  );
}
