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

const FileUpload = ({ disabled, onChange, onRemove, value }) => {
  const [isMounted, setIsMounted] = useState(false);
  const [isDragActive, setIsDragActive] = useState(false);
  const [file, setFiles] = useState();
  const [fileDB, setFilesDB] = useState({});
  const [downloadUrl, setDownloadUrl] = useState("");
  const [progressValue, setProgressValue] = useState(0);
  const inputRef = useRef();
  const { user } = useAuthContext();

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
    console.log("handle drop: ", newFiles);
  };

  const readDB = async (filename) => {
    const fileName = filename.replace(/\s+/g, "-");
    console.log(fileName);
    const filesRef = query(
      collection(firebase_db, "files"),
      where("fileName", "==", fileName),
      where("ownerUid", "==", user?.uid || "anonymous")
    );
    const filesSnapshot = await getDocs(filesRef);
    const files = filesSnapshot.docs.map((file) => file.data());
    console.log("files read:", files);
    setDownloadUrl(files[0].downloadUrl);
    return JSON.stringify(files[0]);
  };
  const handleUpload = async (file_data) => {
    if (!file_data) return;
    if (file_data.size > 50 * 1024 * 1024) {
      alert("File size exceeds 50MB limit.");
      return;
    }
    const body = new FormData();
    const formData = new FormData();
    body.append("file", file_data);
    if (user) {
      console.log("user fu:", user);
      formData.append("user", user.uid);
    } else {
      console.log("user anonymous");
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
    console.log("body:", bodyfile);
    try {
      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });
      const { urls } = await response.json();
      console.log("urls:", urls);

      await Promise.all(
        urls.map(async (url, index) => {
          const bodyForm = body.get("file");
          const fetchDB = await readDB(file_data.name);
          setFilesDB(fetchDB);
          setFiles(file_data);
          const bodyBuffer = await bodyForm.arrayBuffer();
          await axios.put(url.signedUrl, bodyBuffer, {
            headers: {
              "Content-Type": url.fileType,
            },
            onUploadProgress: (progressEvent) => {
              console.log("progress", progressEvent);
              setProgressValue(
                Math.round((progressEvent.loaded * 100) / progressEvent.total)
              );
            },
          });
        })
      );
      console.log(file_data);
    } catch (error) {
      console.error("Something went wrong, check your console.");
    }
  };

  const handleDelete = async () => {
    const formData = new FormData();
    const parseFileDB = JSON.parse(fileDB);
    console.log("fileDB:", parseFileDB);
    formData.append(
      "filename",
      JSON.stringify({
        fileId: parseFileDB.fileId,
        fileName: parseFileDB.fileName,
      })
    );

    try {
      const response = await fetch("/api/delete", {
        method: "POST",
        body: formData,
      });
      console.log("urls:", urls);

      console.log(file_data);
    } catch (error) {
      console.error("Something went wrong, check your console.");
    }
  };

  if (!isMounted) {
    return null;
  }

  return (
    <div className="flex-1 flex flex-col grow items-center justify-between my-6 md:w-7/12 w-full">
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
              console.log(newFiles);
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
                <Button className="h-14 w-14" variant="outline">
                  <Download className="h-4 w-4" />
                </Button>
                {progressValue === 100 && (
                  <Button className="h-14 w-14" variant="outline" asChild>
                    <Link href={`${downloadUrl}`}>
                      <View className="h-4 w-4" />
                    </Link>
                  </Button>
                )}

                <Button className="h-14 w-14" variant="outline">
                  <Share2 className="h-4 w-4" />
                </Button>
                <Button
                  className="h-14 w-14"
                  variant="outline"
                  onClick={() => {
                    handleDelete();
                    window.location.reload();
                  }}
                >
                  <Trash className="h-4 w-4" />
                </Button>
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
