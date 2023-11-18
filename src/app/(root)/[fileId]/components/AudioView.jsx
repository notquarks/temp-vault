import Image from "next/image";
import React from "react";
import ReactAudioPlayer from "react-audio-player";
import ReactPlayer from "react-player";
import Actions from "../../components/actions";

export default function AudioView({ data }) {
  return (
    <div className="relative flex flex-col h-fit aspect-video justify-center items-center">
      <div className="flex flex-col gap-2">
        <p>{data.fileName}</p>
        <ReactAudioPlayer src={data.downloadUrl} controls />
        <div className="flex flex-row gap-2">
          <Actions data={data} />
        </div>
      </div>
    </div>
  );
}
