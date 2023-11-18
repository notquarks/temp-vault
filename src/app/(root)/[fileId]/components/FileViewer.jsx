import React from "react";
import ImageView from "./ImageView";
import AudioView from "./AudioView";
import VideoView from "./VideoView";
import { File } from "lucide-react";
import { Card } from "@/components/ui/card";
import OtherFileView from "./OtherFileView";

export default function FileViewer({ data }) {
  function getFileType(filedata) {
    // console.log("filedata: ", filedata);
    if (filedata.fileFormat.includes("image")) {
      return <ImageView data={filedata} />;
    } else if (filedata.fileFormat.includes("audio")) {
      return <AudioView data={filedata} />;
    } else if (filedata.fileFormat.includes("video")) {
      return <VideoView data={filedata} />;
    } else {
      return <OtherFileView className="h-8 w-8 row-span-1" data={filedata} />;
    }
  }
  return (
    <div className="flex flex-1 grow w-full flex-col m-2 gap-2">
      {data ? (
        <Card
          key={data.fileName}
          className="flex flex-col grow justify-center gap-4 items-center p-4 py-3"
        >
          {getFileType(data)}
        </Card>
      ) : (
        <p>Loading</p>
      )}
    </div>
  );
}
