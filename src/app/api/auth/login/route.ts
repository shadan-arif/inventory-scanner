import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { signToken } from "@/lib/auth";

export async function POST(request: NextRequest) {
  // Determine if the connection is actually HTTPS at runtime.
  // process.env.NODE_ENV === 'production' is NOT reliable here because
  // NetBird serves the app over plain HTTP even in production mode.
  // Browsers (especially mobile Safari) will REJECT a cookie marked Secure
  // if it arrives over an HTTP connection — the cookie simply won't be stored.
  const forwardedProto = request.headers.get("x-forwarded-proto");
  const isHttps =
    forwardedProto === "https" || request.url.startsWith("https://");
  try {
    const { code, password } = await request.json();

    if (!code || !password || code.length !== 4 || password.length !== 4 || !/^\d{4}$/.test(code) || !/^\d{4}$/.test(password)) {
      return NextResponse.json(
        { success: false, message: "Code and password must be exactly 4 digits." },
        { status: 400 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { code },
    });

    if (!user) {
      return NextResponse.json(
        { success: false, message: "Invalid credentials." },
        { status: 401 }
      );
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);

    if (!isMatch) {
      return NextResponse.json(
        { success: false, message: "Invalid credentials." },
        { status: 401 }
      );
    }

    const token = await signToken({
      id: user.id,
      code: user.code,
      role: user.role,
      name: user.name,
    });

    const response = NextResponse.json({
      success: true,
      user: {
        id: user.id,
        code: user.code,
        role: user.role,
        name: user.name,
      },
    });

    response.cookies.set("ws_session", token, {
      httpOnly: true,
      secure: isHttps,       // Only true when actually served over HTTPS (Cloudflare/local HTTPS)
      sameSite: "lax",      // lax works fine; the culprit was Secure=true on an HTTP connection
      maxAge: 8 * 60 * 60, // 8 hours
      path: "/",
    });

    return response;
  } catch (error) {
    console.error("Login API Error:", error);
    return NextResponse.json(
      { success: false, message: "Internal server error." },
      { status: 500 }
    );
  }
}
