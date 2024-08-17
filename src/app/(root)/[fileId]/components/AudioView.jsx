import Image from "next/image";
import React from "react";
import { Music } from "lucide-react";
import ReactAudioPlayer from "react-audio-player";
import ReactPlayer from "react-player";
import Actions from "../../components/Actions";
import { Card } from "@/components/ui/card";

export default function AudioView({ data }) {
  return (
    <div className="mx-auto h-full w-full max-w-4xl space-y-4 p-6">
      <div className="flex items-center justify-center">
        <Music className="h-16 w-16 text-primary" />
      </div>
      <h2 className="truncate text-center text-lg font-semibold">
        {data.fileName}
      </h2>
      <ReactAudioPlayer src={data.downloadUrl} controls className="w-full" />
      <div className="mt-4 flex justify-start space-x-2">
        <Actions data={data} />
      </div>
    </div>
  );
}
