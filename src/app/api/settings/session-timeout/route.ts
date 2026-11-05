import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyToken } from "@/lib/auth";
import { cookies } from "next/headers";

const SETTING_KEY = "sessionTimeoutMinutes";
const DEFAULT_TIMEOUT_MINUTES = 10;

export async function GET() {
  try {
    const setting = await prisma.appSetting.findUnique({
      where: { key: SETTING_KEY },
    });

    return NextResponse.json({
      success: true,
      timeoutMinutes: setting ? parseInt(setting.value, 10) : DEFAULT_TIMEOUT_MINUTES,
    });
  } catch (error) {
    console.error("Session timeout GET error:", error);
    return NextResponse.json(
      { success: false, message: "Internal server error." },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const token = cookies().get("ws_session")?.value
      ?? request.headers.get("Authorization")?.replace("Bearer ", "");

    if (!token) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }

    const payload = await verifyToken(token);
    if (!payload || payload.role !== "ADMIN") {
      return NextResponse.json({ success: false, message: "Forbidden" }, { status: 403 });
    }

    const { timeoutMinutes } = await request.json();
    const value = Number(timeoutMinutes);

    if (!Number.isFinite(value) || value < 1 || value > 480) {
      return NextResponse.json(
        { success: false, message: "Timeout must be between 1 and 480 minutes." },
        { status: 400 }
      );
    }

    const updated = await prisma.appSetting.upsert({
      where: { key: SETTING_KEY },
      update: { value: String(Math.round(value)) },
      create: { key: SETTING_KEY, value: String(Math.round(value)) },
    });

    return NextResponse.json({
      success: true,
      timeoutMinutes: parseInt(updated.value, 10),
    });
  } catch (error) {
    console.error("Session timeout PUT error:", error);
    return NextResponse.json(
      { success: false, message: "Internal server error." },
      { status: 500 }
    );
  }
}
