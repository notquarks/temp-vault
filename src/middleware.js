import { NextResponse } from "next/server";
import { NextRequest } from "next/server";

export async function middleware(request, response) {
  const session = request.cookies.get("session");
  // console.log("session", session);
  //Return to /login if don't have a session
  if (!session) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  //Call the authentication endpoint
  const responseAPI = await fetch(process.env.NEXT_URL_LOGIN_API, {
    headers: {
      Cookie: `session=${session?.value}`,
    },
  });

  //Return to /login if token is not authorized
  if (responseAPI.status !== 200) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  return NextResponse.next();
}

//Add your protected routes
export const config = {
  matcher: ["/dashboard/:path*"],
};
