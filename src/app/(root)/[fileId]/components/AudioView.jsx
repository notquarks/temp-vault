import Image from "next/image";
import React from "react";
import { Music } from "lucide-react";
import ReactAudioPlayer from "react-audio-player";
import ReactPlayer from "react-player";
import Actions from "../../components/actions";
import { Card } from "@/components/ui/card";

export default function AudioView({ data }) {
  return (
    <Card className="w-full max-w-4xl mx-auto h-full p-6 space-y-4">
      <div className="flex items-center justify-center">
        <Music className="h-16 w-16 text-primary" />
      </div>
      <h2 className="text-lg font-semibold text-center truncate">
        {data.fileName}
      </h2>
      <ReactAudioPlayer src={data.downloadUrl} controls className="w-full" />
      <div className="flex justify-start space-x-2 mt-4">
        <Actions data={data} />
      </div>
    </Card>
  );
}
