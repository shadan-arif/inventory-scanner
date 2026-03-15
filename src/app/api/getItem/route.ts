import { NextRequest, NextResponse } from "next/server";
import axios from "axios";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const itemId = searchParams.get("itemId");

  if (!itemId) {
    return NextResponse.json({ error: "Item ID is required" }, { status: 400 });
  }

  try {
    const baseUrl = process.env.CATAPULT_API_BASE;
    const apiKey = process.env.CATAPULT_API_KEY;

    if (!baseUrl || !apiKey) {
      return NextResponse.json(
        { error: "Server configuration error setup" },
        { status: 500 }
      );
    }

    const response = await axios.get(`${baseUrl}/api/itemLookup`, {
      params: {
        apikey: apiKey,
        itemId: itemId,
      },
    });

    return NextResponse.json(response.data);
  } catch (error) {
    if (axios.isAxiosError(error)) {
      console.error("Error fetching item info:", error.response?.data || error.message);
      return NextResponse.json(
        { error: "Failed to fetch item information" },
        { status: error.response?.status || 500 }
      );
    }
    console.error("Error fetching item info:", (error as Error).message);
    return NextResponse.json(
      { error: "Failed to fetch item information" },
      { status: 500 }
    );
  }
}
