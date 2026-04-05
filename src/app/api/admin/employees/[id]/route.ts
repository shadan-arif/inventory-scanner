import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { verifyToken } from "@/lib/auth";
import { cookies } from "next/headers";

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  try {
    const token = cookies().get("ws_session")?.value;
    if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const payload = await verifyToken(token);
    if (!payload || payload.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { password } = await request.json();

    if (!password || password.length !== 4 || !/^\d{4}$/.test(password)) {
      return NextResponse.json({ error: "Password must be exactly 4 digits." }, { status: 400 });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const updatedUser = await prisma.user.update({
      where: { id: parseInt(params.id) },
      data: { passwordHash },
    });

    return NextResponse.json({ success: true, message: "Password updated successfully" });
  } catch (error) {
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
