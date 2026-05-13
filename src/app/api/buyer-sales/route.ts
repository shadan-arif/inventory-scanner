import { NextRequest, NextResponse } from "next/server";
import axios from "axios";
import { XMLParser } from "fast-xml-parser";

const DEFAULT_BASE_URL = "https://25deb.catapultweboffice.com";
const DEFAULT_API_KEY = "TYKJEJ1TPY2G82C2REG1UWUE0GV2JK4F";

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

  const normalizedId = String(itemId).trim();

  const match = rowArray.find(
    (r: any) => String(r.summaryItemID ?? "").trim() === normalizedId
  );

  if (!match) return 0;

  const qty = parseFloat(String(match.summaryQtySold ?? "0"));
  return isNaN(qty) ? 0 : qty;
}

interface PeriodDebug {
  label: string;
  url: string;
  params: Record<string, string | number>;
  status: "success" | "error";
  httpStatus?: number;
  error?: string;
  rawResponsePreview?: string;
  qtySold: number;
  durationMs: number;
}

/** Fetches summary data for a single period and returns both the qtySold and debug info. */
async function fetchPeriodWithDebug(
  label: string,
  startDate: string,
  endDate: string,
  itemId: string,
  baseUrl: string,
  apiKey: string,
): Promise<PeriodDebug> {
  const url = `${baseUrl}/api/summaryItemData`;
  const params = {
    apikey: apiKey,
    startDate,
    endDate,
    Type: 1,
  };

  const start = Date.now();

  try {
    const res = await axios.get(url, {
      params,
      headers: {
        "User-Agent": "Mozilla/5.0",
        Accept: "application/xml",
        Connection: "keep-alive",
      },
      timeout: 12000,
    });

    const durationMs = Date.now() - start;
    const rawStr = typeof res.data === "string" ? res.data : JSON.stringify(res.data);
    const qtySold = extractQtySold(rawStr, itemId);

    return {
      label,
      url,
      params: { ...params },
      status: "success",
      httpStatus: res.status,
      rawResponsePreview: rawStr.length > 1500 ? rawStr.slice(0, 1500) + "…" : rawStr,
      qtySold,
      durationMs,
    };
  } catch (err: any) {
    const durationMs = Date.now() - start;
    return {
      label,
      url,
      params: { ...params },
      status: "error",
      httpStatus: err.response?.status,
      error: err.message || "Unknown error",
      rawResponsePreview: err.response?.data
        ? String(err.response.data).slice(0, 1500)
        : undefined,
      qtySold: 0,
      durationMs,
    };
  }
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const itemId = (searchParams.get("itemId") ?? "").trim();
  const debug = searchParams.get("debug") === "true";

  // Allow overrides from query params (for the debug modal "edit & replay" feature)
  const baseUrl = (searchParams.get("baseUrl") ?? "").trim() || DEFAULT_BASE_URL;
  const apiKey = (searchParams.get("apiKey") ?? "").trim() || DEFAULT_API_KEY;

  // Allow custom date overrides (for the debug modal)
  const customStart7 = (searchParams.get("start7") ?? "").trim();
  const customStart14 = (searchParams.get("start14") ?? "").trim();
  const customStart30 = (searchParams.get("start30") ?? "").trim();
  const customEndDate = (searchParams.get("endDate") ?? "").trim();

  if (!itemId) {
    return NextResponse.json(
      { success: false, message: "Missing itemId parameter" },
      { status: 400 }
    );
  }

  const yesterday = customEndDate || getYesterday();
  const start7 = customStart7 || getDateOffset(7);
  const start14 = customStart14 || getDateOffset(14);
  const start30 = customStart30 || getDateOffset(30);

  // Fire all 3 requests in parallel
  const [result7, result14, result30] = await Promise.all([
    fetchPeriodWithDebug("Last 7 Days", start7, yesterday, itemId, baseUrl, apiKey),
    fetchPeriodWithDebug("Last 14 Days", start14, yesterday, itemId, baseUrl, apiKey),
    fetchPeriodWithDebug("Last 30 Days", start30, yesterday, itemId, baseUrl, apiKey),
  ]);

  const response: any = {
    success: true,
    itemId,
    sales: {
      last7Days: {
        startDate: start7,
        endDate: yesterday,
        qtySold: result7.qtySold,
      },
      last14Days: {
        startDate: start14,
        endDate: yesterday,
        qtySold: result14.qtySold,
      },
      last30Days: {
        startDate: start30,
        endDate: yesterday,
        qtySold: result30.qtySold,
      },
    },
  };

  if (debug) {
    response.debug = [result7, result14, result30];
  }

  return NextResponse.json(response);
}
