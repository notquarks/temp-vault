import { NextResponse } from "next/server";
import chalk from "chalk";
import { PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { r2 } from "@/lib/r2";
import { v4 as uuidv4 } from "uuid";
import addDocument from "@/firebase/firestore/addData";
import shortUUID from "short-uuid";

export async function POST(request) {
  const formData = await request.formData();
  const shortUuid = shortUUID();
  console.log(formData);
  const files = formData.getAll("filename");
  const user = formData.get("user");
  console.log(files);
  console.log("user:", user);

  try {
    console.log(chalk.yellow(`Generating an upload URL!`));
    const signedUrls = await Promise.all(
      files.map(async (file) => {
        // const Body = await file.arrayBuffer();
        const filename = file.name.replace(/\s+/g, "-");
        const data = {
          downloadUrl: `https://assets.arkivio.my.id/${filename}`,
          fileId: shortUuid.generate(),
          fileName: filename,
          fileFormat: file.type,
          isPublic: true,
          ownerUid: user,
          timestamp: Date.now(),
        };
        const { result, error } = await addDocument("files", data.fileId, data);
        console.log("addData result:", result, error);
        console.log(file.type);
        const signedUrl = await getSignedUrl(
          r2,
          new PutObjectCommand({
            Bucket: process.env.R2_BUCKET_NAME,
            Key: filename,
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
