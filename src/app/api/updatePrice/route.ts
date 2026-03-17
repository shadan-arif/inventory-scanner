import { NextRequest, NextResponse } from "next/server";
import axios from "axios";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const headerBaseUrl = request.headers.get("x-base-url");
    const headerApiKey = request.headers.get("x-api-key");
    const headerParams = request.headers.get("x-params");

    const baseUrl = headerBaseUrl || "https://25deb.catapultweboffice.com";
    const apiKey = headerApiKey || "TYKJEJ1TPY2G82C2REG1UWUE0GV2JK4F";

    if (!baseUrl || !apiKey) {
      return NextResponse.json(
        { error: "Server configuration error setup" },
        { status: 500 }
      );
    }

    const parsedParams = headerParams ? new URLSearchParams(headerParams) : new URLSearchParams({ batch: "1" });
    parsedParams.set("apikey", apiKey);

    const response = await axios.post(
      `${baseUrl}/api/batch/itemPricing?${parsedParams.toString()}`,
      body
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
