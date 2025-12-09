import { getFirebaseAdmin } from "@/lib/firebase-admin";
import { cookies, headers } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request, response) {
  const authorization = headers().get("Authorization");
  if (authorization?.startsWith("Bearer ")) {
    const idToken = authorization.split("Bearer ")[1];
    try {
      const { auth } = getFirebaseAdmin();
      const decodedToken = await auth.verifyIdToken(idToken);

      if (decodedToken) {
        //Generate session cookie
        const expiresIn = 60 * 60 * 24 * 5 * 1000;
        const sessionCookie = await auth.createSessionCookie(idToken, {
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
    const { auth } = getFirebaseAdmin();
    const decodedClaims = await auth.verifySessionCookie(session, true);

    if (!decodedClaims) {
      return NextResponse.json({ isLogged: false }, { status: 401 });
    }
    return NextResponse.json({ isLogged: true }, { status: 200 });
  } catch (error) {
    console.error("Error verifying session cookie:", error);
    return NextResponse.json({ isLogged: false }, { status: 401 });
  }
}
