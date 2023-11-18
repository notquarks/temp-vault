"use client";
import { cva } from "class-variance-authority";
import Image from "next/image";
import Link from "next/link";
import { Sailboat, File } from "lucide-react";
import FileUpload from "@/components/ui/file-upload";
import NavBar from "@/components/NavBar";
import { Footer } from "@/components/Footer";
import { useAuthContext } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import FileViewer from "./components/FileViewer";
import getDocument from "@/firebase/firestore/readData";

export default function FilePage({ params }) {
  const fileId = params.fileId;
  console.log("fileId: ", fileId);
  const { user } = useAuthContext();
  const router = useRouter();
  const [file, setFile] = useState();

  useEffect(() => {
    const readDB = async () => {
      try {
        const { result, error } = await getDocument("files", fileId);
        const fileData = result.data();
        setFile(fileData);
        console.log("files read:", fileData);
      } catch (error) {
        console.log(error);
      }
    };
    readDB(fileId);
  }, [fileId]);

  return (
    <main className="flex min-h-screen flex-col items-center justify-between p-14">
      <NavBar />
      <div className="flex-1 flex flex-col grow items-center justify-between my-6 md:w-7/12 w-full">
        <FileViewer data={file} />
      </div>
      <Footer />
    </main>
  );
}
