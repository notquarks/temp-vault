import { NextResponse } from "next/server";
import { NextRequest } from "next/server";

export async function middleware(request) {
  const session = request.cookies.get("session");

  if (!session) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  const responseAPI = await fetch(process.env.NEXT_URL_LOGIN_API, {
    headers: {
      Cookie: `session=${session?.value}`,
    },
    cache: "no-store",
  });

  if (responseAPI.status !== 200) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*"],
};
