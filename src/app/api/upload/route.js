import { NextResponse } from "next/server";
import chalk from "chalk";
import { PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { r2 } from "@/lib/r2";
import { v4 as uuidv4 } from "uuid";
import addDocument from "@/firebase/firestore/addData";
import shortUUID from "short-uuid";
import getDocument from "@/firebase/firestore/readData";
import { collection, getDocs, query, where } from "firebase/firestore";
import { firebase_db } from "@/firebase/config";

export async function POST(request) {
  const formData = await request.formData();
  const shortUuid = shortUUID();
  console.log(formData);
  const files = [JSON.parse(formData.getAll("filename"))];
  const user = formData.get("user");
  console.log(files);
  console.log("user:", user);
  const filename = files[0].name.replace(/\s+/g, "-");
  try {
    console.log(chalk.yellow(`Generating an upload URL!`));
    const signedUrls = await Promise.all(
      files.map(async (file) => {
        // const Body = await file.arrayBuffer();
        const filename = file.name.replace(/\s+/g, "-");
        const regex = /(?:\.([^.]+))?$/;
        const filetype = regex.exec(filename)[0];
        const fileId = shortUuid.generate();
        const data = {
          downloadUrl: `https://assets.arkivio.my.id/${fileId + filetype}`,
          fileId: fileId,
          fileName: filename,
          fileFormat: file.type,
          extension: filetype,
          isPublic: true,
          ownerUid: user,
          timestamp: Date.now(),
        };

        console.log("files read:", files);
        const { result, error } = await addDocument("files", data.fileId, data);
        console.log("addData result:", result, error);
        console.log(file.type);
        const signedUrl = await getSignedUrl(
          r2,
          new PutObjectCommand({
            Bucket: process.env.R2_BUCKET_NAME,
            Key: data.fileId + filetype,
          }),
          { expiresIn: 3600 }
        );
        console.log(chalk.green(`Success generating upload URL! ${filename}`));
        return { signedUrl, fileType: file.type };
      })
    );
    return NextResponse.json({ urls: signedUrls });
  } catch (err) {
    console.log("error");
    return new NextResponse(`Internal error : ${err}`, { status: 500 });
  }
}
