import Image from "next/image";
import React, { useState } from "react";
import { Skeleton } from "@/components/ui/skeleton";

export default function ImageView({ data }) {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  return (
    <div className="relative aspect-video w-full">
      {isLoading && <Skeleton className="absolute h-full w-full" />}
      {!hasError ? (
        <Image
          key={data.fileName}
          src={data.downloadUrl}
          alt={data.fileName}
          fill
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          className={`object-contain transition-opacity duration-300 ${
            isLoading ? "opacity-0" : "opacity-100"
          }`}
          onLoadingComplete={() => setIsLoading(false)}
          onError={() => {
            setHasError(true);
            setIsLoading(false);
          }}
          priority
        />
      ) : (
        <div className="flex h-full w-full items-center justify-center bg-gray-200 text-gray-500">
          Failed to load image
        </div>
      )}
    </div>
  );
}
