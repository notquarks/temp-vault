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

const FileCard = ({ data }) => {
  const [isMounted, setIsMounted] = useState(false);
  // const [file, setFiles] = useState();
  const [progressValue, setProgressValue] = useState(0);
  const inputRef = useRef();

  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted) {
    return null;
  }

  return (
    <>
      <Card
        className={`grid grid-flow-col grid-cols-6 w-full text-center items-center justify-between gap-3 py-3 hover:bg-input hover:cursor-pointer
            `}
        onClick={() => {}}
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
            <Button size="icon" variant="outline">
              <Download className="h-4 w-4" />
            </Button>
            <Button size="icon" variant="outline">
              <View className="h-4 w-4" />
            </Button>
            <Button size="icon" variant="outline">
              <Share2 className="h-4 w-4" />
            </Button>
            <Button size="icon" variant="outline">
              <Trash className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </Card>
    </>
  );
};

export default FileCard;
