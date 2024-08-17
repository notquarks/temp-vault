import React from "react";
import { Music } from "lucide-react";
import ReactAudioPlayer from "react-audio-player";

export default function AudioView({ data }) {
  return (
    <div className="w-full space-y-4">
      <div className="flex items-center justify-center">
        <Music className="h-16 w-16 text-primary" />
      </div>
      <ReactAudioPlayer src={data.downloadUrl} controls className="w-full" />
    </div>
  );
}
