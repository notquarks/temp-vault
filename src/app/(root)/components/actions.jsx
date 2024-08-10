"use client";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { useAuthContext } from "@/context/AuthContext";
import axios from "axios";
import { Download, Share2, Trash, View } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import React from "react";

export default function Actions({ data }) {
  const { user } = useAuthContext();
  const route = useRouter();
  const { toast } = useToast();
  // console.log("data:", data);

  async function copyContent(e) {
    if (e && e.stopPropagation) e.stopPropagation();

    try {
      await navigator.clipboard.writeText(
        `${window.location.origin}/${data.fileId}`
      );
      toast({
        title: "Link copied",
        description: "The file link has been copied to your clipboard.",
      });
      // alert("Content copied to clipboard");
      console.log("Content copied to clipboard");
      /* Resolved - text copied to clipboard successfully */
    } catch (err) {
      console.error("Failed to copy: ", err);
      toast({
        title: "Copy failed",
        description: "Failed to copy the link. Please try again.",
        variant: "destructive",
      });
      /* Rejected - text failed to copy to the clipboard */
    }
  }

  const handleDownload = async (e) => {
    if (e && e.stopPropagation) e.stopPropagation();
    route.push(`/api/download/${data.fileId}`);
  };

  const handleDelete = async (e) => {
    if (e && e.stopPropagation) e.stopPropagation();
    const formData = new FormData();

    formData.append(
      "filename",
      JSON.stringify({
        fileId: data.fileId,
        fileName: data.fileId,
      })
    );
    try {
      const response = await fetch("/api/delete", {
        method: "POST",
        body: formData,
      });
      if (!response.ok) {
        throw new Error("Failed to delete file");
      }
      router.push("/dashboard");
      toast({
        title: "File deleted",
        description: "The file has been successfully deleted.",
      });
      // RouterContext.push("/dashboard");
      // console.log(file_data);
    } catch (error) {
      console.error("Something went wrong, check your console.");
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
        onClick={(e) => {
          handleDownload(e);
        }}
      >
        <Download className="h-4 w-4" />
      </Button>
      <Button size="icon" variant="outline" aria-label="View" asChild>
        <Link
          href={`${window.location.origin}/${data.fileId}`}
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
        onClick={(e) => {
          copyContent(e);
        }}
      >
        <Share2 className="h-4 w-4" />
      </Button>
      {user?.uid === data.ownerUid && (
        <Button
          size="icon"
          variant="outline"
          aria-label="Delete"
          onClick={(e) => {
            handleDelete(e);
            window.location.reload();
          }}
        >
          <Trash className="h-4 w-4" />
        </Button>
      )}
    </>
  );
}
