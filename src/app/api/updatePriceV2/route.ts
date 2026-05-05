import { NextRequest, NextResponse } from "next/server";
import axios from "axios";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const headerBaseUrl = request.headers.get("x-base-url");
    const headerApiKey = request.headers.get("x-api-key");

    const baseUrl = headerBaseUrl || "https://25deb.catapultweboffice.com";
    const apiKey = headerApiKey || "TYKJEJ1TPY2G82C2REG1UWUE0GV2JK4F";

    if (!baseUrl || !apiKey) {
      return NextResponse.json(
        { error: "Server configuration error setup" },
        { status: 500 }
      );
    }

    const url = `${baseUrl}/api/batch/PermanentPriceCost?batch=4&appendExistingWorksheets=0&autoCommit=1`;

    const response = await axios.post(
      url,
      body,
      {
        headers: {
          "Content-Type": "application/json",
          "Accept": "*/*",
          "Cache-Control": "no-cache",
          "Connection": "keep-alive",
          "Accept-Encoding": "gzip, deflate, br",
          "X-ECRS-APIKEY": apiKey
        }
      }
    );

    return NextResponse.json(response.data);
  } catch (error) {
    if (axios.isAxiosError(error)) {
      console.error("Error updating item pricing/cost:", error.response?.data || error.message);
      return NextResponse.json(
        { error: "Failed to update item pricing/cost", details: error.response?.data },
        { status: error.response?.status || 500 }
      );
    }
    console.error("Error updating item pricing/cost:", (error as Error).message);
    return NextResponse.json(
      { error: "Failed to update item pricing/cost" },
      { status: 500 }
    );
  }
}
