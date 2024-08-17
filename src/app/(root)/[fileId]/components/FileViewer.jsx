import React from "react";
import ImageView from "./ImageView";
import AudioView from "./AudioView";
import VideoView from "./VideoView";
import PdfView from "./PdfView";
import OtherFileView from "./OtherFileView";
import Actions from "../../components/Actions";

export default function FileViewer({ data, onDelete }) {
  function getFileType(filedata) {
    if (filedata.fileFormat.includes("image")) {
      return <ImageView data={filedata} />;
    } else if (filedata.fileFormat.includes("audio")) {
      return <AudioView data={filedata} />;
    } else if (filedata.fileFormat.includes("video")) {
      return <VideoView data={filedata} />;
    } else if (filedata.fileFormat.includes("pdf")) {
      return <PdfView data={filedata} />;
    } else {
      return <OtherFileView className="row-span-1 h-8 w-8" data={filedata} />;
    }
  }

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col items-center space-y-2">
      <h1 className="break-all text-center text-xl font-semibold">
        {data.fileName}
      </h1>
      {getFileType(data)}
      <div className="flex flex-row gap-2">
        <Actions data={data} onDelete={onDelete} />
      </div>
    </div>
  );
}
