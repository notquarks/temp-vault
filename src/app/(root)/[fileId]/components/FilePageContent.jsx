"use client";

import { useEffect, useState } from "react";
import { useAuthContext } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import FileViewer from "./FileViewer";
import getDocument from "@/firebase/firestore/readData";
import { LoadingPlaceholder } from "@/components/Loading";
import { Card } from "@/components/ui/card";

export default function FilePageContent({ fileId }) {
  const { user } = useAuthContext();
  const router = useRouter();
  const [file, setFile] = useState();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const readDB = async () => {
      try {
        setLoading(true);
        const { result, error } = await getDocument("files", fileId);
        if (error) throw error;
        const fileData = result.data();
        setFile(fileData);
      } catch (error) {
        console.error("Error fetching file:", error);
        setError("Failed to fetch file. Please try again later.");
      } finally {
        setLoading(false);
      }
    };
    readDB();
  }, [fileId]);

  const handleDelete = () => {
    router.push("/dashboard");
  };

  if (loading) return <LoadingPlaceholder />;
  if (error) return <div>Error: {error}</div>;
  if (!file) return <div>File not found</div>;

  return (
    <div className="m-2 flex w-full flex-1 grow flex-col gap-2">
      <Card className="flex grow flex-col items-center justify-center gap-4 p-4 py-3">
        <FileViewer data={file} onDelete={handleDelete} />
      </Card>
    </div>
  );
}
