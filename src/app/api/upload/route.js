import { NextResponse } from "next/server";
import chalk from "chalk";
import { PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

import { r2 } from "@/lib/r2";

export async function POST(request) {
  const formData = await request.formData();
  console.log(formData);
  const files = formData.getAll("filename");
  console.log(files);
  try {
    console.log(chalk.yellow(`Generating an upload URL!`));
    const signedUrls = await Promise.all(
      files.map(async (file) => {
        // const Body = await file.arrayBuffer();
        console.log(file.type);
        const signedUrl = await getSignedUrl(
          r2,
          new PutObjectCommand({
            Bucket: process.env.R2_BUCKET_NAME,
            Key: file.name,
          }),
          { expiresIn: 3600 }
        );
        console.log(chalk.green(`Success generating upload URL! ${file.name}`));
        return { signedUrl, fileType: file.type };
      })
    );
    return NextResponse.json({ urls: signedUrls });
  } catch (err) {
    console.log("error");
    return new NextResponse(`Internal error : ${err}`, { status: 500 });
  }
}
