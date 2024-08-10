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
  Image as ImageIcon,
  FileText,
  FileAudio,
  FileVideo,
  FileArchive,
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

  const getFileIcon = (fileFormat) => {
    const format = fileFormat.toLowerCase();
    switch (true) {
      case /^image\//.test(format):
        return <ImageIcon className="h-10 w-10 my-1" />;
      case /^text\//.test(format) || format === "application/pdf":
        return <FileText className="h-10 w-10 my-1" />;
      case /^audio\//.test(format):
        return <FileAudio className="h-10 w-10 my-1" />;
      case /^video\//.test(format):
        return <FileVideo className="h-10 w-10 my-1" />;
      case /zip|rar|7z|tar/.test(format):
        return <FileArchive className="h-10 w-10 my-1" />;
      default:
        return <File className="h-10 w-10 my-1" />;
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
        <div className="col-start-1 col-span-3 md:justify-items-center md:items-center">
          <div className="flex md:items-center gap-2">
            {getFileIcon(data.fileFormat)}
            <p className="text-ellipsis overflow-hidden">{data.fileName}</p>
          </div>
        </div>
        <div className="md:flex hidden col-start-4 col-span-1 justify-items-center items-center">
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
