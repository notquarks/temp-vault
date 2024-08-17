"use client";
import Image from "next/image";
import React, { useState } from "react";
import ReactPlayer from "react-player";
import Actions from "../../components/Actions";
import { File } from "lucide-react";

export default function OtherFileView({ data }) {
  return (
    <div className="relative flex h-fit flex-col items-center justify-center">
      <p className="my-2 block">{data.fileName}</p>
      <div className="flex flex-col items-center justify-center gap-4">
        <File className="row-span-1 h-32 w-32" />
        <div className="flex flex-row gap-2">
          <Actions data={data} />
        </div>
      </div>
    </div>
  );
}
