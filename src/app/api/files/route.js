import { AuthContextProvider } from "@/context/AuthContext";
import firebase_app, { firebase_db } from "@/firebase/config";
import getDocument from "@/firebase/firestore/readData";
import { NextResponse } from "next/server";
import { cookies, headers } from "next/headers";
import { z } from "zod";
import { collection, getDocs, query, where } from "firebase/firestore";

export async function GET(req) {
  try {
    const authorization = headers().get("Authorization");
    if (authorization?.startsWith("UserID ")) {
      const userId = authorization.split("UserID ")[1];
      //   console.log(userId);
      const filesRef = query(
        collection(firebase_db, "files"),
        where("ownerUid", "==", userId)
      );
      const filesSnapshot = await getDocs(filesRef);

      const files = filesSnapshot.docs.map((file) => file.data());
      console.log(files);
      return NextResponse.json(files, { status: 200 });
    } else {
      return NextResponse.json("Unauthorized", { status: 401 });
    }
  } catch (error) {
    return new NextResponse("Cant Fetch File Data", { status: 500 });
  }
}
