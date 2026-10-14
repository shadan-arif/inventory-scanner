import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyToken } from "@/lib/auth";

export async function GET() {
  try {
    const setting = await prisma.appSetting.findUnique({
      where: { key: "apiBaseUrl" },
    });

    return NextResponse.json({
      success: true,
      url: setting ? setting.value : null,
    });
  } catch (error) {
    console.error("API Base URL GET Error:", error);
    return NextResponse.json(
      { success: false, message: "Internal server error." },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    let token = request.cookies.get("ws_session")?.value;
    if (!token) {
      const authHeader = request.headers.get("authorization");
      if (authHeader?.startsWith("Bearer ")) {
        token = authHeader.substring(7);
      }
    }

    if (!token) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }

    const payload = await verifyToken(token);
    if (!payload || payload.role !== "ADMIN") {
      return NextResponse.json({ success: false, message: "Forbidden: Admin access required." }, { status: 403 });
    }

    const body = await request.json();
    const rawUrl = body.url;

    if (!rawUrl || typeof rawUrl !== "string") {
      return NextResponse.json({ success: false, message: "A valid URL string is required." }, { status: 400 });
    }

    const trimmedUrl = rawUrl.trim().replace(/\/+$/, "");

    if (!trimmedUrl.startsWith("http://") && !trimmedUrl.startsWith("https://")) {
      return NextResponse.json({ success: false, message: "URL must begin with http:// or https://" }, { status: 400 });
    }

    const updatedSetting = await prisma.appSetting.upsert({
      where: { key: "apiBaseUrl" },
      update: { value: trimmedUrl },
      create: { key: "apiBaseUrl", value: trimmedUrl },
    });

    return NextResponse.json({
      success: true,
      url: updatedSetting.value,
    });
  } catch (error) {
    console.error("API Base URL PUT Error:", error);
    return NextResponse.json(
      { success: false, message: "Internal server error." },
      { status: 500 }
    );
  }
}
