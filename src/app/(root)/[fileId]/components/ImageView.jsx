import Image from "next/image";
import React from "react";
import Actions from "../../components/actions";

export default function ImageView({ data }) {
  return (
    <div className="flex flex-col h-fit aspect-video justify-center items-center">
      <p>{data.fileName}</p>
      <div className="flex flex-col grow justify-center gap-4 items-center p-4 py-3">
        <div className="relative w-[65%] h-[50svh] aspect-video">
          <Image
            key={data.fileName} // Add key prop here
            src={`${data.downloadUrl}`}
            fill
            sizes="(max-width: 768px) 100vw, 33vw"
            loading="lazy"
            onError={(e) => {
              e.target.src = `${data.downloadUrl}`;
            }}
            className="object-contain w-full h-full object-center"
            alt=""
          />
        </div>
        <div className="flex flex-row gap-2">
          <Actions data={data} />
        </div>
      </div>
    </div>
  );
}
