import { firebase_db } from "@/firebase/config";
import { collection, getDocs, query, where } from "firebase/firestore";
import { NextResponse } from "next/server";

export async function GET(req, { params }) {
  const { fileId } = params;

  try {
    const filesRef = query(
      collection(firebase_db, "files"),
      where("fileId", "==", fileId)
    );
    const filesSnapshot = await getDocs(filesRef);

    if (filesSnapshot.empty) {
      return NextResponse.json({ error: "File not found" }, { status: 404 });
    }

    const fileData = filesSnapshot.docs[0].data();
    const { fileName, extension } = fileData;

    const R2_CDN = `https://assets.arkivio.my.id/${fileId}${extension}`;

    const encodedFileName = encodeURIComponent(fileName)
      .replace(/['()]/g, escape)
      .replace(/\*/g, "%2A");

    return NextResponse.redirect(R2_CDN, {
      headers: {
        "Content-Disposition": `attachment; filename*=UTF-8''${encodedFileName}`,
        "Content-Type": "application/octet-stream",
      },
    });
  } catch (err) {
    console.error("Error processing file request:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
