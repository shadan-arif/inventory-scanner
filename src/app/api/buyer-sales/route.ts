import { NextRequest, NextResponse } from "next/server";
import axios from "axios";
import { XMLParser } from "fast-xml-parser";

const BASE_URL = "https://25deb.catapultweboffice.com";
const API_KEY = "TYKJEJ1TPY2G82C2REG1UWUE0GV2JK4F";

/** Returns "YYYY-MM-DD" for a date offset by N days before today (today excluded). */
function getDateOffset(daysBack: number): string {
  const d = new Date();
  d.setDate(d.getDate() - daysBack);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

/** Returns the end date as yesterday ("YYYY-MM-DD"). */
function getYesterday(): string {
  return getDateOffset(1);
}

/** Parses XML from the sales API and extracts qtySold for the given itemId. */
function extractQtySold(xml: string, itemId: string): number {
  const parser = new XMLParser({
    ignoreAttributes: false,
    attributeNamePrefix: "",
  });

  let parsed: any;
  try {
    parsed = parser.parse(xml);
  } catch {
    return 0;
  }

  const rows = parsed?.root?.row;
  if (!rows) return 0;

  const rowArray: any[] = Array.isArray(rows) ? rows : [rows];

  // Normalize both to strings, trimmed, for comparison
  const normalizedId = String(itemId).trim();

  const match = rowArray.find(
    (r: any) => String(r.summaryItemID ?? "").trim() === normalizedId
  );

  if (!match) return 0;

  const qty = parseFloat(String(match.summaryQtySold ?? "0"));
  return isNaN(qty) ? 0 : qty;
}

/** Fetches summary data for a date range and returns qtySold for the given itemId. */
async function fetchPeriod(
  startDate: string,
  endDate: string,
  itemId: string
): Promise<number> {
  try {
    const res = await axios.get(`${BASE_URL}/api/summaryItemData`, {
      params: {
        apikey: API_KEY,
        startDate,
        endDate,
        Type: 1,
      },
      headers: {
        "User-Agent": "Mozilla/5.0",
        Accept: "application/xml",
        Connection: "keep-alive",
      },
      timeout: 12000,
    });

    return extractQtySold(res.data, itemId);
  } catch {
    return 0;
  }
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const itemId = searchParams.get("itemId")?.trim();

  if (!itemId) {
    return NextResponse.json(
      { success: false, message: "Missing itemId parameter" },
      { status: 400 }
    );
  }

  const yesterday = getYesterday();
  const start7 = getDateOffset(7);
  const start14 = getDateOffset(14);
  const start30 = getDateOffset(30);

  // Fire all 3 requests in parallel
  const [qty7, qty14, qty30] = await Promise.all([
    fetchPeriod(start7, yesterday, itemId),
    fetchPeriod(start14, yesterday, itemId),
    fetchPeriod(start30, yesterday, itemId),
  ]);

  return NextResponse.json({
    success: true,
    itemId,
    sales: {
      last7Days: {
        startDate: start7,
        endDate: yesterday,
        qtySold: qty7,
      },
      last14Days: {
        startDate: start14,
        endDate: yesterday,
        qtySold: qty14,
      },
      last30Days: {
        startDate: start30,
        endDate: yesterday,
        qtySold: qty30,
      },
    },
  });
}
