import { NextRequest, NextResponse } from "next/server";
import axios from "axios";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const baseUrl = "https://25deb.catapultweboffice.com";
    const apiKey = "TYKJEJ1TPY2G82C2REG1UWUE0GV2JK4F";

    if (!baseUrl || !apiKey) {
      return NextResponse.json(
        { error: "Server configuration error setup" },
        { status: 500 }
      );
    }

    const response = await axios.post(
      `${baseUrl}/api/batch/itemMaintenance`,
      body,
      {
        params: {
          apikey: apiKey,
          batch: 1,
        },
      }
    );

    return NextResponse.json(response.data);
  } catch (error) {
    if (axios.isAxiosError(error)) {
      console.error("Error updating item name:", error.response?.data || error.message);
      return NextResponse.json(
        { error: "Failed to update item name" },
        { status: error.response?.status || 500 }
      );
    }
    console.error("Error updating item name:", (error as Error).message);
    return NextResponse.json(
      { error: "Failed to update item name" },
      { status: 500 }
    );
  }
}
