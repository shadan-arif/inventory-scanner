import { NextRequest, NextResponse } from "next/server";
import axios from "axios";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const baseUrl = process.env.CATAPULT_API_BASE;
    const apiKey = process.env.CATAPULT_API_KEY;

    if (!baseUrl || !apiKey) {
      return NextResponse.json(
        { error: "Server configuration error setup" },
        { status: 500 }
      );
    }

    const response = await axios.post(
      `${baseUrl}/api/batch/itemPricing`,
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
      console.error("Error updating item pricing:", error.response?.data || error.message);
      return NextResponse.json(
        { error: "Failed to update item pricing" },
        { status: error.response?.status || 500 }
      );
    }
    console.error("Error updating item pricing:", (error as Error).message);
    return NextResponse.json(
      { error: "Failed to update item pricing" },
      { status: 500 }
    );
  }
}
