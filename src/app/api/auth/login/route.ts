import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { signToken } from "@/lib/auth";

export async function POST(request: Request) {
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
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
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
