import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request) {
  try {
    // Remove the session cookie
    cookies().delete("session");

    return NextResponse.json(
      { message: "Signed out successfully" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error during sign-out:", error);
    return NextResponse.json({ error: "Failed to sign out" }, { status: 500 });
  }
}

export async function GET(request) {
  return NextResponse.json(
    { message: "Sign-out endpoint is working" },
    { status: 200 }
  );
}
