"use client";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { useAuthContext } from "@/context/AuthContext";
import { Download, Share2, Trash, View } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import React from "react";

export default function Actions({ data, onDelete }) {
  const { user } = useAuthContext();
  const router = useRouter();
  const { toast } = useToast();

  async function copyContent(e) {
    if (e && e.stopPropagation) e.stopPropagation();

    try {
      await navigator.clipboard.writeText(
        `${window.location.origin}/${data.fileId}`,
      );
      toast({
        title: "Link copied",
        description: "The file link has been copied to your clipboard.",
      });
    } catch (err) {
      console.error("Failed to copy: ", err);
      toast({
        title: "Copy failed",
        description: "Failed to copy the link. Please try again.",
        variant: "destructive",
      });
    }
  }

  const handleDownload = async (e) => {
    if (e && e.stopPropagation) e.stopPropagation();
    router.push(`/api/download/${data.fileId}`);
  };

  const handleDelete = async (e) => {
    if (e && e.stopPropagation) e.stopPropagation();
    const formData = new FormData();

    formData.append(
      "filename",
      JSON.stringify({
        fileId: data.fileId,
        fileName: data.fileId,
      }),
    );
    try {
      const response = await fetch("/api/delete", {
        method: "POST",
        body: formData,
      });
      if (!response.ok) {
        throw new Error("Failed to delete file");
      }
      toast({
        title: "File deleted",
        description: "The file has been successfully deleted.",
      });
      // Call the onDelete callback to update the parent component's state
      if (onDelete) {
        onDelete(data.fileId);
      }
      // Optionally navigate to dashboard if this component is used in a single file view
      if (window.location.pathname !== "/dashboard") {
        router.push("/dashboard");
      }
    } catch (error) {
      console.error("Something went wrong:", error);
      toast({
        title: "Deletion failed",
        description: "Failed to delete the file. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <>
      <Button
        size="icon"
        variant="outline"
        aria-label="Download"
        onClick={handleDownload}
      >
        <Download className="h-4 w-4" />
      </Button>
      <Button size="icon" variant="outline" aria-label="View" asChild>
        <Link
          href={`/${data.fileId}`}
          onClick={(e) => {
            if (e && e.stopPropagation) e.stopPropagation();
          }}
        >
          <View className="h-4 w-4" />
        </Link>
      </Button>
      <Button
        size="icon"
        variant="outline"
        aria-label="Copy link"
        onClick={copyContent}
      >
        <Share2 className="h-4 w-4" />
      </Button>
      {user?.uid === data.ownerUid && (
        <Button
          size="icon"
          variant="outline"
          aria-label="Delete"
          onClick={handleDelete}
        >
          <Trash className="h-4 w-4" />
        </Button>
      )}
    </>
  );
}
