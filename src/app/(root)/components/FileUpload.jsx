"use client";

import { useCallback, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import { File, Upload } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { useAuthContext } from "@/context/AuthContext";
import Actions from "@/app/(root)/components/Actions";
import { useToast } from "@/components/ui/use-toast";
import { useRouter } from "next/navigation";
import { uploadFile, readFileFromDB } from "@/lib/utils";

const FileUpload = () => {
  const [isDragActive, setIsDragActive] = useState(false);
  const [file, setFile] = useState(null);
  const [fileDB, setFileDB] = useState(null);
  const [downloadUrl, setDownloadUrl] = useState("");
  const [progressValue, setProgressValue] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const inputRef = useRef();
  const { user } = useAuthContext();
  const router = useRouter();
  const { toast } = useToast();

  const handleDrag = useCallback((event) => {
    event.preventDefault();
    setIsDragActive(event.type === "dragenter" || event.type === "dragover");
  }, []);

  const handleDrop = useCallback(async (event) => {
    event.preventDefault();
    setIsDragActive(false);
    const newFile = event.dataTransfer.files[0];
    await handleUpload(newFile);
  }, []);

  const handleUpload = useCallback(
    async (fileData) => {
      if (!fileData) return;
      if (fileData.size > 50 * 1024 * 1024) {
        toast({
          title: "File too large",
          description: "File size exceeds 50MB limit.",
          variant: "destructive",
        });
        return;
      }

      setIsUploading(true);
      try {
        const result = await uploadFile(fileData, user, setProgressValue);
        if (result.error) {
          throw new Error(result.error);
        }
        const dbData = await readFileFromDB(
          result.fileName,
          user?.uid || "anonymous",
        );
        setFileDB(dbData);
        setFile(fileData);
        setDownloadUrl(dbData.downloadUrl);
        toast({
          title: "Upload complete",
          description: "Your file has been successfully uploaded.",
        });

        if (dbData.fileId) {
          router.push(`/${dbData.fileId}`);
        } else {
          console.error("File ID not found in database data");
        }
      } catch (error) {
        console.error("Upload failed:", error);
        toast({
          title: "Upload failed",
          description:
            error.message || "An error occurred while uploading the file.",
          variant: "destructive",
        });
      } finally {
        setIsUploading(false);
      }
    },
    [user, toast, router],
  );

  const renderUploadArea = () => (
    <>
      <input
        id="file-upload"
        type="file"
        ref={inputRef}
        className="hidden"
        onChange={(event) => handleUpload(event.target.files[0])}
      />
      <Card
        className={`flex h-full w-full flex-1 grow flex-col items-center justify-center gap-3 text-center ${
          isDragActive ? "bg-input" : "bg-card"
        }`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        <Upload className="m-2 h-12 w-12" />
        Drag and drop your file here (max 50MB).
        <Button onClick={() => inputRef.current.click()} disabled={isUploading}>
          Choose File
        </Button>
      </Card>
    </>
  );

  const renderFilePreview = () => (
    <div className="m-2 flex w-full flex-1 grow flex-col gap-2">
      <Card className="flex grow flex-col items-center justify-center gap-4 p-4 py-3">
        {file.type.includes("image") ? (
          <div className="relative row-start-1 aspect-video h-fit w-[65%]">
            <Image
              src={progressValue === 100 ? downloadUrl : "/placeholder.svg"}
              fill
              sizes="(max-width: 768px) 100vw, 33vw"
              className="h-full w-full object-contain object-center"
              alt={file.name}
            />
          </div>
        ) : (
          <File className="row-span-1 h-8 w-8" />
        )}
        <Progress value={progressValue} className="w-[60%]" />
        <div className="row-start-6 flex justify-end gap-2">
          <Actions data={fileDB} />
        </div>
      </Card>
      <Card className="flex flex-col items-center justify-center py-3">
        <div>
          {file.name} - {file.type}
        </div>
        <div>
          {Math.round(file.size / 1024)} KB ({(file.size / 1048576).toFixed(2)}{" "}
          MB)
        </div>
      </Card>
    </div>
  );

  return (
    <div className="my-6 flex w-full max-w-5xl flex-1 grow flex-col items-center justify-between">
      {!file ? renderUploadArea() : renderFilePreview()}
    </div>
  );
};

export default FileUpload;
