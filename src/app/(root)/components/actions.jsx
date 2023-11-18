"use client";
import { Button } from "@/components/ui/button";
import { useAuthContext } from "@/context/AuthContext";
import axios from "axios";
import { Download, Share2, Trash, View } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import React from "react";

export default function Actions({ data }) {
  const { user } = useAuthContext();
  const route = useRouter();
  // console.log("data:", data);

  async function copyContent(e) {
    if (e && e.stopPropagation) e.stopPropagation();

    try {
      await navigator.clipboard.writeText(
        `${window.location.origin}/${data.fileId}`
      );
      alert("Content copied to clipboard");
      console.log("Content copied to clipboard");
      /* Resolved - text copied to clipboard successfully */
    } catch (err) {
      console.error("Failed to copy: ", err);
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
      // console.log(file_data);
    } catch (error) {
      console.error("Something went wrong, check your console.");
    }
  };

  return (
    <>
      <Button
        size="icon"
        variant="outline"
        onClick={(e) => {
          handleDownload(e);
        }}
      >
        <Download className="h-4 w-4" />
      </Button>
      <Button size="icon" variant="outline" asChild>
        <Link
          href={`${data.downloadUrl}`}
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
