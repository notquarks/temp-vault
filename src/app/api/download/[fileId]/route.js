import { firebase_db } from "@/firebase/config";
import { r2 } from "@/lib/r2";
import { GetObjectCommand } from "@aws-sdk/client-s3";
import chalk from "chalk";
import { collection, getDocs, query, where } from "firebase/firestore";
import { NextResponse } from "next/server";

export async function GET(req, { params }) {
  const fileId = params.fileId;
  const filesRef = query(
    collection(firebase_db, "files"),
    where("fileId", "==", fileId)
  );
  const filesSnapshot = await getDocs(filesRef);
  const fileData = filesSnapshot.docs.map((file) => file.data());
  console.log("fileData:", fileData);
  try {
    console.log(chalk.yellow(`Retrieving pdf from R2!`));
    const fileName = fileData[0].fileName;
    const DUMMY_URL = `https://assets.arkivio.my.id/${
      fileId + fileData[0].extension
    }`;

    // use fetch to get a response
    const file = await fetch(DUMMY_URL);

    if (!file) {
      throw new Error("file not found.");
    }
    // return NextResponse.json({ pdf });
    return new NextResponse(file.body, {
      headers: {
        ...file.headers,
        "content-disposition": `attachment; filename="${fileName}"`,
        // "Content-Type": "application/pdf",
      },
    });
  } catch (err) {
    console.log("error", err);
    return new NextResponse(`Internal error : ${err}`, { status: 500 });
  }
}
