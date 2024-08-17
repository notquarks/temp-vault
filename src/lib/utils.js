import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { collection, getDocs, query, where } from "firebase/firestore";
import { firebase_db } from "@/firebase/config";
import axios from "axios";

export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

export async function uploadFile(file_data, user, setProgressValue) {
  const fileName = file_data.name.replace(/\s+/g, "-");
  const formData = new FormData();
  formData.append("file", file_data);
  formData.append("user", user ? user.uid : "anonymous");
  formData.append(
    "filename",
    JSON.stringify({
      name: file_data.name,
      type: file_data.type,
    }),
  );

  const response = await fetch("/api/upload", {
    method: "POST",
    body: formData,
  });

  if (response.status === 409) {
    throw new Error("A file with this name already exists.");
  }

  const { urls } = await response.json();

  await Promise.all(
    urls.map(async (url) => {
      const bodyBuffer = await file_data.arrayBuffer();
      await axios.put(url.signedUrl, bodyBuffer, {
        headers: {
          "Content-Type": url.fileType,
        },
        onUploadProgress: (progressEvent) => {
          setProgressValue(
            Math.round((progressEvent.loaded * 100) / progressEvent.total),
          );
        },
      });
    }),
  );

  return { fileName };
}

export async function readFileFromDB(filename, userUid) {
  const filesRef = query(
    collection(firebase_db, "files"),
    where("fileName", "==", filename),
    where("ownerUid", "==", userUid),
  );
  const filesSnapshot = await getDocs(filesRef);
  const files = filesSnapshot.docs.map((file) => file.data());

  if (files.length === 0) {
    throw new Error("File not found in database");
  }

  return files[0];
}
