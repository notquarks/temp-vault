import { customInitApp } from "@/firebase/firebase-admin-config";
import { auth } from "firebase-admin";
import { getApps } from "firebase-admin/app";
import { cookies, headers } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

if (!customInitApp()) {
  console.error("Firebase Admin failed to initialize.");
}

export async function POST(request, response) {
  if (getApps().length === 0) {
    return NextResponse.json(
      { error: "Internal Server Error: Firebase Admin not initialized" },
      { status: 500 },
    );
  }
  const authorization = headers().get("Authorization");
  if (authorization?.startsWith("Bearer ")) {
    const idToken = authorization.split("Bearer ")[1];
    try {
      const decodedToken = await auth().verifyIdToken(idToken);

      if (decodedToken) {
        //Generate session cookie
        const expiresIn = 60 * 60 * 24 * 5 * 1000;
        const sessionCookie = await auth().createSessionCookie(idToken, {
          expiresIn,
        });
        const options = {
          name: "session",
          value: sessionCookie,
          maxAge: expiresIn,
          httpOnly: true,
          secure: true,
        };

        //Add the cookie to the browser
        cookies().set(options);
      }
    } catch (error) {
      console.error("Error creating session cookie:", error);
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  return NextResponse.json({}, { status: 200 });
}

export async function GET(request) {
  const session = cookies().get("session")?.value || "";

  //Validate if the cookie exist in the request
  if (!session) {
    return NextResponse.json({ isLogged: false }, { status: 401 });
  }

  //Use Firebase Admin to validate the session cookie
  try {
    const decodedClaims = await auth().verifySessionCookie(session, true);

    if (!decodedClaims) {
      return NextResponse.json({ isLogged: false }, { status: 401 });
    }
    return NextResponse.json({ isLogged: true }, { status: 200 });
  } catch (error) {
    console.error("Error verifying session cookie:", error);
    return NextResponse.json({ isLogged: false }, { status: 401 });
  }
}
