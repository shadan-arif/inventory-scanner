import { NextRequest, NextResponse } from "next/server";
import axios from "axios";
import { XMLParser } from "fast-xml-parser";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    // ✅ SANITIZE INPUT
    const rawItemSearch = searchParams.get("itemSearch");
    const itemSearch = rawItemSearch?.trim();

    const headerBaseUrl = request.headers.get("x-base-url");
    const headerApiKey = request.headers.get("x-api-key");
    const includeRaw = request.headers.get("x-include-raw") === "true";

    const baseUrl =
      headerBaseUrl || "https://25deb.catapultweboffice.com";
    const apiKey =
      headerApiKey || "TYKJEJ1TPY2G82C2REG1UWUE0GV2JK4F";

    // ❌ EMPTY CHECK
    if (!itemSearch) {
      return NextResponse.json(
        { success: false, message: "Missing itemSearch parameter" },
        { status: 400 }
      );
    }

    console.log("Calling API with:", itemSearch);

    // ✅ FIXED PARAM NAME (apiKey)
    const response = await axios.get(`${baseUrl}/api/itemDetail`, {
      params: {
        apiKey: apiKey, // ✅ FIXED
        itemSearch: itemSearch,
      },
      timeout: 8000,
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

    // ✅ HANDLE MULTIPLE STRUCTURES
    let row =
      parsedData?.root?.row ||
      parsedData?.root?.rows?.row ||
      parsedData?.rows?.row;

    if (!row) {
      console.log("Parsed XML:", JSON.stringify(parsedData, null, 2));

      return NextResponse.json(
        { success: false, message: "Item not found" },
        { status: 404 }
      );
    }

    const item = Array.isArray(row) ? row[0] : row;

    return NextResponse.json({
      success: true,
      raw: includeRaw ? response.data : undefined,
      data: {
        itemId: item.itemId || "",
        itemName: item.itemName || "",
        price: item.pricePL1 || "",
        pricePL1: item.pricePL1 || "",
        stock: item.onHand || "",
        department: item.department || "",
        lastCost: item.lastCost || "",
        defaultSupplier: item.defaultSupplier || "",
        defaultSupplierUnitId: item.defaultSupplierUnitId || "",
        defaultSupplierUnitQty: item.defaultSupplierUnitQty || "",
      },
    });

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

    // ✅ LOG FULL ERROR FOR DEBUGGING
    console.error("Full error response:", error.response?.data);

    return NextResponse.json(
      { success: false, message: "Failed to fetch item details" },
      { status: 500 }
    );
  }
}