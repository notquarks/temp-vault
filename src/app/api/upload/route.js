import { NextResponse } from "next/server";
import chalk from "chalk";
import { PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { r2 } from "@/lib/r2";
import addDocument from "@/firebase/firestore/addData";
import shortUUID from "short-uuid";
import { collection, getDocs, query, where } from "firebase/firestore";
import { firebase_db } from "@/firebase/config";

export async function POST(request) {
  const formData = await request.formData();
  const shortUuid = shortUUID();
  const files = [JSON.parse(formData.getAll("filename"))];
  const user = formData.get("user");

  console.log("Files:", files);
  console.log("User:", user);

  try {
    console.log(chalk.yellow(`Generating upload URL(s)!`));

    const signedUrls = await Promise.all(
      files.map(async (file) => {
        const filename = file.name.replace(/\s+/g, "-");
        const regex = /(?:\.([^.]+))?$/;
        const filetype = regex.exec(filename)[0];
        const fileId = shortUuid.generate();

        // Check for duplicate files only if the user is logged in
        if (user !== "anonymous") {
          const filesRef = query(
            collection(firebase_db, "files"),
            where("fileName", "==", filename),
            where("ownerUid", "==", user)
          );
          const filesSnapshot = await getDocs(filesRef);
          const isDuplicate = filesSnapshot.docs.length > 0;

          if (isDuplicate) {
            throw new Error("File already exists for this user");
          }
        }

        const data = {
          downloadUrl: `https://assets.arkivio.my.id/${fileId + filetype}`,
          fileId: fileId,
          fileName: filename,
          fileFormat: file.type,
          extension: filetype,
          isPublic: true,
          ownerUid: user || "anonymous",
          timestamp: Date.now(),
        };

        const { result, error } = await addDocument("files", data.fileId, data);
        if (error) {
          console.error("Error adding document:", error);
          throw new Error("Failed to add document to database");
        }

        const signedUrl = await getSignedUrl(
          r2,
          new PutObjectCommand({
            Bucket: process.env.R2_BUCKET_NAME,
            Key: data.fileId + filetype,
          }),
          { expiresIn: 3600 }
        );

        console.log(
          chalk.green(`Success generating upload URL for ${filename}`)
        );
        return { signedUrl, fileType: file.type, fileId: data.fileId };
      })
    );

    return NextResponse.json({ urls: signedUrls });
  } catch (err) {
    console.error("Error:", err);
    if (err.message === "File already exists for this user") {
      return new NextResponse("File already exists for this user", {
        status: 409,
      });
    }
    return new NextResponse(`Internal error: ${err.message}`, { status: 500 });
  }
}
