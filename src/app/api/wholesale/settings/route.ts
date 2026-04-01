import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyToken } from "@/lib/auth";

export async function GET() {
  try {
    const setting = await prisma.appSetting.findUnique({
      where: { key: "idealMargin" },
    });

    return NextResponse.json({
      success: true,
      margin: setting ? parseFloat(setting.value) : 35.0,
    });
  } catch (error) {
    console.error("Settings GET Error:", error);
    return NextResponse.json(
      { success: false, message: "Internal server error." },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const token = request.cookies.get("ws_session")?.value;
    if (!token) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }

    const payload = await verifyToken(token);
    if (!payload || payload.role !== "ADMIN") {
      return NextResponse.json({ success: false, message: "Forbidden" }, { status: 403 });
    }

    const { margin } = await request.json();

    if (margin === undefined || margin === null || isNaN(Number(margin)) || Number(margin) < 0 || Number(margin) > 100) {
      return NextResponse.json(
        { success: false, message: "Margin must be a number between 0 and 100." },
        { status: 400 }
      );
    }

    const updatedSetting = await prisma.appSetting.upsert({
      where: { key: "idealMargin" },
      update: { value: Number(margin).toString() },
      create: { key: "idealMargin", value: Number(margin).toString() },
    });

    return NextResponse.json({
      success: true,
      margin: parseFloat(updatedSetting.value),
    });
  } catch (error) {
    console.error("Settings PUT Error:", error);
    return NextResponse.json(
      { success: false, message: "Internal server error." },
      { status: 500 }
    );
  }
}
