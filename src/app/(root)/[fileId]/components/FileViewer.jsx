import React from "react";
import ImageView from "./ImageView";
import AudioView from "./AudioView";
import VideoView from "./VideoView";
import PdfView from "./PdfView";
import { File } from "lucide-react";
import { Card } from "@/components/ui/card";
import OtherFileView from "./OtherFileView";
import { LoadingPlaceholder } from "@/components/Loading";

export default function FileViewer({ data }) {
  function getFileType(filedata) {
    // console.log("filedata: ", filedata);
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
    <div className="m-2 flex w-full flex-1 grow flex-col gap-2">
      {data ? (
        <Card
          key={data.fileName}
          className="flex grow flex-col items-center justify-center gap-4 p-4 py-3"
        >
          {getFileType(data)}
        </Card>
      ) : (
        <LoadingPlaceholder />
        // <p>Loading</p>
      )}
    </div>
  );
}
