import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { verifyToken } from "@/lib/auth";
import { cookies } from "next/headers";

export async function GET(request: Request) {
  try {
    const token = cookies().get("ws_session")?.value;
    if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const payload = await verifyToken(token);
    if (!payload || payload.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const employees = await prisma.user.findMany({
      select: {
        id: true,
        code: true,
        name: true,
        role: true,
        createdAt: true,
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ employees });
  } catch (error) {
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const token = cookies().get("ws_session")?.value;
    if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const payload = await verifyToken(token);
    if (!payload || payload.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { code, password, name, role } = await request.json();

    if (!code || !password || !name) {
      return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    }

    if (code.length !== 4 || password.length !== 4 || !/^\d{4}$/.test(code) || !/^\d{4}$/.test(password)) {
      return NextResponse.json({ error: "Code and password must be exactly 4 digits." }, { status: 400 });
    }

    const existingUser = await prisma.user.findUnique({ where: { code } });
    if (existingUser) {
      return NextResponse.json({ error: "User code already exists." }, { status: 400 });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const newUser = await prisma.user.create({
      data: {
        code,
        passwordHash,
        name,
        role: role === "ADMIN" ? "ADMIN" : "EMPLOYEE",
      },
    });

    return NextResponse.json({ success: true, employee: { id: newUser.id, code: newUser.code, name: newUser.name, role: newUser.role } });
  } catch (error) {
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
