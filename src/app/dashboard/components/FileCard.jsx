"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { useRouter } from "next/navigation";
import {
  ImageIcon,
  FileText,
  FileAudio,
  FileVideo,
  FileArchive,
  File,
} from "lucide-react";
import Actions from "@/app/(root)/components/Actions";

const FileCard = ({ data, onDelete }) => {
  const [isMounted, setIsMounted] = useState(false);
  const router = useRouter();

  useEffect(() => {
    setIsMounted(true);
  }, []);

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

  const formatFileType = (mimeType) => {
    if (!mimeType) return "Unknown";
    const typeMap = {
      "application/pdf": "PDF",
      "application/zip": "ZIP",
      "application/x-zip-compressed": "ZIP",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document":
        "DOCX",
      "application/msword": "DOC",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet":
        "XLSX",
      "application/vnd.ms-excel": "XLS",
      "text/plain": "TXT",
    };
    if (typeMap[mimeType]) return typeMap[mimeType];
    if (mimeType.startsWith("image/"))
      return mimeType.split("/")[1].toUpperCase();
    if (mimeType.startsWith("video/"))
      return mimeType.split("/")[1].toUpperCase();
    if (mimeType.startsWith("audio/"))
      return mimeType.split("/")[1].toUpperCase();
    return mimeType.split("/")[1]?.toUpperCase() || mimeType;
  };

  const handleCardClick = (e) => {
    // Prevent navigation if the click was on an action button
    if (e.target.closest(".action-buttons")) return;
    router.push(`/${data.fileId}`);
  };

  if (!isMounted) {
    return null;
  }

  return (
    <Card
      className="group grid w-full grid-cols-10 items-center gap-2 px-4 py-3 text-center transition-colors duration-200 hover:cursor-pointer hover:bg-accent/50"
      onClick={handleCardClick}
    >
      <div className="col-span-8 flex items-center gap-2 sm:col-span-5 md:col-span-6 lg:col-span-7">
        {getFileIcon(data.fileFormat)}
        <p className="flex-1 overflow-hidden text-ellipsis text-start">
          {data.fileName}
        </p>
      </div>
      <div className="col-span-1 hidden items-center justify-center sm:col-span-2 sm:flex md:col-span-2 lg:col-span-1">
        <p className="text-sm">{formatFileType(data.fileFormat)}</p>
      </div>
      <div className="action-buttons col-span-2 flex items-center justify-end sm:col-span-3 sm:flex md:col-span-2 lg:col-span-2">
        <Actions data={data} onDelete={() => onDelete(data.fileId)} />
      </div>
    </Card>
  );
};

export default FileCard;
