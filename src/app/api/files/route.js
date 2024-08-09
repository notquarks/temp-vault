import { firebase_db } from "@/firebase/config";
import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { collection, getDocs, query, where } from "firebase/firestore";

export async function GET(req) {
  try {
    const authorization = headers().get("Authorization");
    if (!authorization?.startsWith("UserID ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = authorization.split("UserID ")[1];
    if (!userId) {
      return NextResponse.json({ error: "Invalid UserID" }, { status: 400 });
    }

    const filesRef = query(
      collection(firebase_db, "files"),
      where("ownerUid", "==", userId)
    );
    const filesSnapshot = await getDocs(filesRef);

    const files = filesSnapshot.docs.map((file) => ({
      id: file.id,
      ...file.data(),
    }));

    return NextResponse.json(files, { status: 200 });
  } catch (error) {
    console.error("Error fetching file data:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
