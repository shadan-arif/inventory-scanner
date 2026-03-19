import { NextRequest, NextResponse } from "next/server";
import axios from "axios";
import { XMLParser } from "fast-xml-parser";

const API_BASE_URL = "https://25deb.catapultweboffice.com/api/itemDetail";
const API_KEY = "TYKJEJ1TPY2G82C2REG1UWUE0GV2JK4F";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const itemSearch = searchParams.get("itemSearch");

    if (!itemSearch) {
      return NextResponse.json(
        { success: false, message: "Missing itemSearch parameter" },
        { status: 400 }
      );
    }

    const response = await axios.get(API_BASE_URL, {
      params: {
        apikey: API_KEY,
        itemSearch: itemSearch,
      },
      timeout: 5000,
    });

    if (!response.data) {
      return NextResponse.json(
        { success: false, message: "No response from external API" },
        { status: 502 }
      );
    }

    const parser = new XMLParser({
      ignoreAttributes: false,
      attributeNamePrefix: "",
    });

    let parsedData;
    try {
      parsedData = parser.parse(response.data);
    } catch {
      return NextResponse.json(
        { success: false, message: "Invalid XML format received" },
        { status: 502 }
      );
    }

    const row = parsedData?.root?.row;

    if (!row) {
      return NextResponse.json(
        { success: false, message: "Item not found" },
        { status: 404 }
      );
    }

    const item = Array.isArray(row) ? row[0] : row;

    return NextResponse.json({
      success: true,
      data: {
        itemId: item.itemId || "",
        itemName: item.itemName || "",
        price: item.pricePL1 || "",
        stock: item.onHand || "",
        supplier: item.supplier || "",
        department: item.department || "",
      },
    });
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (error: any) {
    console.error("External API Error:", error.message);

    if (error.code === "ECONNABORTED" || error.message.includes("timeout")) {
      return NextResponse.json(
        { success: false, message: "API timeout" },
        { status: 504 }
      );
    }

    if (error.response?.status === 404) {
       return NextResponse.json(
         { success: false, message: "Item not found" },
         { status: 404 }
       );
    }

    return NextResponse.json(
      { success: false, message: "Failed to fetch item details" },
      { status: 500 }
    );
  }
}
