import React from "react";
import ReactPlayer from "react-player";
import Actions from "../../components/actions";

export default function VideoView({ data }) {
  return (
    <div className="max-w-4xl mx-auto p-4">
      <h2 className="text-lg font-semibold text-center">{data.fileName}</h2>
      <div className="rounded-lg shadow-md overflow-hidden m-0 p-0">
        <div className="aspect-video">
          <ReactPlayer
            url={data.downloadUrl}
            controls={true}
            width="100%"
            height="100%"
          />
        </div>
        <div className="py-2">
          <Actions data={data} />
        </div>
      </div>
    </div>
  );
}
