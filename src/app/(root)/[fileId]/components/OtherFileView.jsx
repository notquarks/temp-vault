"use client";
import Image from "next/image";
import React, { useState } from "react";
import ReactPlayer from "react-player";
import Actions from "../../components/actions";
import { File } from "lucide-react";

export default function OtherFileView({ data }) {
  return (
    <div className="relative flex flex-col h-fit justify-center items-center">
      <p className="block my-2">{data.fileName}</p>
      <div className="flex flex-col gap-4 justify-center items-center">
        <File className="h-32 w-32 row-span-1" />
        <div className="flex flex-row gap-2">
          <Actions data={data} />
        </div>
      </div>
    </div>
  );
}
