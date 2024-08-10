"use client";

import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import {
  Download,
  File,
  ImagePlus,
  Share2,
  Trash,
  Upload,
  View,
} from "lucide-react";
import { Label } from "./label";
import { Card } from "./card";
import axios from "axios";
import { set } from "zod";
import { Progress } from "./progress";
import Link from "next/link";
import { useAuthContext } from "@/context/AuthContext";
import { collection, getDocs, query, where } from "firebase/firestore";
import { firebase_db } from "@/firebase/config";
import Actions from "@/app/(root)/components/actions";
import { useToast } from "./use-toast";
import { useRouter } from "next/navigation";

const FileUpload = ({ disabled, onChange, onRemove, value }) => {
  const [isMounted, setIsMounted] = useState(false);
  const [isDragActive, setIsDragActive] = useState(false);
  const [file, setFiles] = useState();
  const [fileDB, setFilesDB] = useState({});
  const [downloadUrl, setDownloadUrl] = useState("");
  const [progressValue, setProgressValue] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [isUploadComplete, setIsUploadComplete] = useState(false);
  const inputRef = useRef();
  const { user } = useAuthContext();
  const router = useRouter();
  const { toast } = useToast();

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const handleDragEnter = (event) => {
    event.preventDefault();
    setIsDragActive(true);
  };

  const handleDragLeave = (event) => {
    event.preventDefault();
    setIsDragActive(false);
  };

  const handleDragOver = (event) => {
    event.preventDefault();
  };

  const handleDrop = async (event) => {
    event.preventDefault();
    setIsDragActive(false);
    const newFiles = event.dataTransfer.files[0];
    await handleUpload(newFiles);
    // // console.log("handle drop: ", newFiles);
  };

  const readDB = async (filename) => {
    // console.log(filename);
    const filesRef = query(
      collection(firebase_db, "files"),
      where("fileName", "==", filename),
      where("ownerUid", "==", user?.uid || "anonymous")
    );
    const filesSnapshot = await getDocs(filesRef);
    const files = filesSnapshot.docs.map((file) => file.data());
    // console.log("files read:", files);
    setDownloadUrl(files[0].downloadUrl);
    return JSON.stringify(files[0]);
  };

  const handleUpload = async (file_data) => {
    if (!file_data) return;
    if (file_data.size > 50 * 1024 * 1024) {
      toast({
        title: "File too large",
        description: "File size exceeds 50MB limit.",
        variant: "destructive",
      });
      return;
    }
    setIsUploading(true);
    const fileName = file_data.name.replace(/\s+/g, "-");
    const body = new FormData();
    const formData = new FormData();
    body.append("file", file_data);
    if (user) {
      // console.log("user fu:", user);
      formData.append("user", user.uid);
    } else {
      // console.log("user anonymous");
      formData.append("user", "anonymous");
    }
    formData.append(
      "filename",
      JSON.stringify({
        name: file_data.name,
        type: file_data.type,
      })
    );
    const bodyfile = body.get("file");
    // console.log("body:", bodyfile);
    try {
      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });
      if (response.status === 409) {
        toast({
          title: "File already exists",
          description: "A file with this name already exists.",
          variant: "destructive",
        });
        setIsUploading(false);
        return;
      }
      const { urls } = await response.json();
      // console.log("urls:", urls);

      await Promise.all(
        urls.map(async (url, index) => {
          const bodyForm = body.get("file");
          const fetchDB = await readDB(fileName);
          setFilesDB(fetchDB);
          setFiles(file_data);
          const bodyBuffer = await bodyForm.arrayBuffer();
          await axios.put(url.signedUrl, bodyBuffer, {
            headers: {
              "Content-Type": url.fileType,
            },
            onUploadProgress: (progressEvent) => {
              // console.log("progress", progressEvent);
              setProgressValue(
                Math.round((progressEvent.loaded * 100) / progressEvent.total)
              );
            },
          });
        })
      );
      setIsUploadComplete(true);
      toast({
        title: "Upload complete",
        description: "Your file has been successfully uploaded.",
      });
    } catch (error) {
      console.error("Something went wrong, check your // console.");
      toast({
        title: "Upload failed",
        description: "An error occurred while uploading the file.",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };

  if (!isMounted) {
    return null;
  }

  return (
    <div className="flex-1 flex flex-col grow items-center justify-between my-6 max-w-5xl w-full">
      {!file ? (
        <>
          <input
            id="file-upload"
            type="file"
            name="fileUpload"
            // multiple
            ref={inputRef}
            className="hidden"
            onChange={(event) => {
              const newFiles = event.target.files[0];
              // console.log(newFiles);
              handleUpload(newFiles);
            }}
          />
          <Card
            className={`flex-1 flex flex-col grow w-full h-full text-center items-center justify-center gap-3 ${
              isDragActive ? "bg-input" : "bg-card"
            }`}
            onDragEnter={handleDragEnter}
            onDragLeave={handleDragLeave}
            onDragOver={handleDragOver}
            onDrop={handleDrop}
          >
            <Upload className="h-12 w-12 m-2" />
            Drag and drop your file here (max 50MB).
            <Button onClick={() => inputRef.current.click()}>
              Choose File
            </Button>
          </Card>
        </>
      ) : (
        <>
          <div className="flex flex-1 grow w-full flex-col m-2 gap-2">
            <Card
              key={file.name}
              className="flex flex-col grow justify-center gap-4 items-center p-4 py-3"
            >
              {file.type.includes("image") ? (
                <div className="row-start-1 relative w-[65%] h-fit aspect-video">
                  <Image
                    key={file.name} // Add key prop here
                    src={
                      progressValue === 100
                        ? `${downloadUrl}`
                        : "https://upload.wikimedia.org/wikipedia/commons/3/3f/Placeholder_view_vector.svg"
                    }
                    fill
                    sizes="(max-width: 768px) 100vw, 33vw"
                    loading="lazy"
                    onError={(e) => {
                      e.target.src = `${downloadUrl}`;
                    }}
                    className="object-contain w-full h-full object-center"
                    alt=""
                  />
                </div>
              ) : (
                <File className="h-8 w-8 row-span-1" />
              )}
              <Progress value={progressValue} className="w-[60%]" />
              <div className="row-start-6 flex gap-2 justify-end">
                <Actions data={JSON.parse(fileDB)} />
              </div>
            </Card>
            <Card className="flex flex-col justify-center items-center py-3">
              {" "}
              <div className="row-start-2 row-span-1">
                {file.name} - {file.type}
              </div>
              <div className="row-start-4 row-span-1 text-center">
                {Math.round(file.size / 1024)} KB (
                {(file.size / 1048576).toFixed(2)} MB)
              </div>
            </Card>
            {/* ))} */}
          </div>
        </>
      )}
    </div>
  );
};

export default FileUpload;
