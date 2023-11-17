import { NextResponse } from "next/server";
import chalk from "chalk";
import { DeleteObjectCommand, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { r2 } from "@/lib/r2";
import { v4 as uuidv4 } from "uuid";
import addDocument from "@/firebase/firestore/addData";
import shortUUID from "short-uuid";
import deleteDocument from "@/firebase/firestore/deleteData";

export async function POST(request) {
  const formData = await request.formData();
  const shortUuid = shortUUID();
  console.log(formData);
  const files = formData.getAll("filename");
  const parseFile = JSON.parse(files[0]);
  console.log(parseFile.fileId);
  console.log(parseFile.fileName);

  try {
    console.log(chalk.yellow(`Generating an upload URL!`));
    const signedUrls = await Promise.all(
      files.map(async (file) => {
        // const Body = await file.arrayBuffer();
        const filename = parseFile.fileName;

        const { result, error } = await deleteDocument(
          "files",
          parseFile.fileId
        );
        console.log("deleteData result:", result, error);
        const signedUrl = await getSignedUrl(
          r2,
          new DeleteObjectCommand({
            Bucket: process.env.R2_BUCKET_NAME,
            Key: filename,
          }),
          { expiresIn: 3600 }
        );
        console.log(chalk.green(`Success generating delete URL! ${filename}`));
        return { signedUrl };
      })
    );
    return NextResponse.json({ urls: signedUrls });
  } catch (err) {
    console.log("Something went wrong: ", err);
    return new NextResponse(`Internal error : ${err}`, { status: 500 });
  }
}
