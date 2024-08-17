"use client";

import { useEffect, useState } from "react";
import { useAuthContext } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import FileViewer from "./FileViewer";
import getDocument from "@/firebase/firestore/readData";

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

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;
  if (!file) return <div>File not found</div>;

  return <FileViewer data={file} />;
}
