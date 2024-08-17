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
import Actions from "@/app/(root)/components/Actions";
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
        return <ImageIcon className="my-1 h-10 w-10" />;
      case /^text\//.test(format) || format === "application/pdf":
        return <FileText className="my-1 h-10 w-10" />;
      case /^audio\//.test(format):
        return <FileAudio className="my-1 h-10 w-10" />;
      case /^video\//.test(format):
        return <FileVideo className="my-1 h-10 w-10" />;
      case /zip|rar|7z|tar/.test(format):
        return <FileArchive className="my-1 h-10 w-10" />;
      default:
        return <File className="my-1 h-10 w-10" />;
    }
  };

  if (!isMounted) {
    return null;
  }

  return (
    <>
      <Card
        className="grid w-full grid-cols-10 items-center gap-2 px-4 py-3 text-center hover:cursor-pointer hover:bg-input"
        onClick={() => {
          router.push(`/${data.fileId}`);
        }}
      >
        <div className="col-span-9 flex items-center gap-2 sm:col-span-5 md:col-span-6 lg:col-span-7">
          {getFileIcon(data.fileFormat)}
          <p className="flex-1 overflow-hidden text-ellipsis text-start">
            {data.fileName}
          </p>
        </div>
        <div className="col-span-1 hidden items-center justify-center sm:col-span-2 sm:flex md:col-span-2 lg:col-span-1">
          <p className="text-sm">{data.fileFormat}</p>
        </div>
        <div className="col-span-1 hidden items-center justify-end sm:col-span-3 sm:flex md:col-span-2 lg:col-span-2">
          <Actions data={data} />
        </div>
      </Card>
    </>
  );
};

export default FileCard;
