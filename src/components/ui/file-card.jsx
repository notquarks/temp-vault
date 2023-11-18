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
import Actions from "@/app/(root)/components/actions";
import { useRouter } from "next/navigation";

const FileCard = ({ data }) => {
  const [isMounted, setIsMounted] = useState(false);
  // const [file, setFiles] = useState();
  const router = useRouter();
  const [progressValue, setProgressValue] = useState(0);
  const inputRef = useRef();

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // const deleteFile = async () => {
  //   const fileData = await axios.get(data.downloadUrl, {
  //     responseType: "blob",
  //   });
  //   handleDelete(fileData);
  // };

  const handleDelete = async () => {
    // if (!file_data) return;
    const body = new FormData();
    const formData = new FormData();
    // body.append("file", file_data);

    formData.append(
      "filename",
      JSON.stringify({
        fileId: data.fileId,
        fileName: data.fileId,
      })
    );
    const bodyfile = body.get("file");
    console.log("body:", bodyfile);
    try {
      const response = await fetch("/api/delete", {
        method: "POST",
        body: formData,
      });
      const { urls } = await response.json();
      console.log("urls:", urls);

      // await Promise.all(
      //   urls.map(async (url, index) => {
      //     const bodyForm = body.get("file");
      //     console.log("bodyForm:", bodyForm);
      //     setFiles(file_data);
      //     const bodyBuffer = await bodyForm.arrayBuffer();
      //     await axios.put(url.signedUrl, bodyBuffer, {});
      //   })
      // );
      console.log(file_data);
    } catch (error) {
      console.error("Something went wrong, check your console.");
    }
  };

  if (!isMounted) {
    return null;
  }

  return (
    <>
      <Card
        className={`grid grid-flow-col grid-cols-6 w-full text-center items-center justify-between gap-3 py-3 hover:bg-input hover:cursor-pointer
            `}
        onClick={() => {
          router.push(`/${data.fileId}`);
        }}
      >
        <div className="col-start-1 col-span-3 justify-items-center items-center">
          <div className="flex justify-items-center items-center gap-2">
            <File className="h-10 w-10 my-1" />
            <p className="text-ellipsis">{data.fileName}</p>
          </div>
        </div>
        <div className="col-start-4 col-span-1 justify-items-center items-center">
          <p>{data.fileFormat}</p>
        </div>
        <div className="col-start-5 col-span-2 justify-items-center items-center">
          <div className="flex flex-row gap-2 px-4 justify-end">
            <Actions data={data} />
          </div>
        </div>
      </Card>
    </>
  );
};

export default FileCard;
