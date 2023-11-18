import Image from "next/image";
import React from "react";
import ReactPlayer from "react-player";
import Actions from "../../components/actions";

export default function VideoView({ data }) {
  return (
    <div className="relative flex flex-col h-fit aspect-video justify-center items-center">
      <p>{data.fileName}</p>
      <div>
        <ReactPlayer
          url={data.downloadUrl}
          controls={true}
          width="100%"
          height="100%"
        />
        <div className="flex flex-row gap-2">
          <Actions data={data} />
        </div>
      </div>
    </div>
  );
}
