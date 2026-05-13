"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import toast from "react-hot-toast";
import { ArrowLeft, Scan, TrendingUp, RefreshCw, Bug } from "lucide-react";
import BuyerDebugModal from "@/components/BuyerDebugModal";

interface ItemDetail {
  itemId: string;
  itemName: string;
  pricePL1: string;
  lastCost?: string;
  defaultSupplier?: string;
  defaultSupplierUnitId?: string;
  defaultSupplierUnitQty?: string;
}

interface SalesPeriod {
  startDate: string;
  endDate: string;
  qtySold: number;
}

interface SalesData {
  last7Days: SalesPeriod;
  last14Days: SalesPeriod;
  last30Days: SalesPeriod;
}

// ─── Read-only field row ───────────────────────────────────────────────────────
function ReadField({
  label,
  value,
}: {
  label: string;
  value: string | undefined;
}) {
  return (
    <div className="space-y-1.5">
      <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
        {label}
      </label>
      <div className="block w-full px-4 py-3 border border-gray-100 rounded-xl text-gray-700 font-medium text-sm bg-gray-50">
        {value || "—"}
      </div>
    </div>
  );
}

// ─── Sales tile ───────────────────────────────────────────────────────────────
function SalesTile({
  label,
  period,
  loading,
}: {
  label: string;
  period?: SalesPeriod;
  loading: boolean;
}) {
  return (
    <div className="flex flex-col items-center justify-center bg-white border border-violet-100 rounded-2xl p-4 shadow-sm space-y-1.5">
      <span className="text-[11px] font-bold uppercase tracking-widest text-violet-400">
        {label}
      </span>
      {loading ? (
        <div className="h-8 w-16 rounded-lg bg-gray-100 animate-pulse" />
      ) : (
        <span className="text-3xl font-extrabold text-gray-900">
          {period?.qtySold ?? 0}
        </span>
      )}
      <span className="text-[10px] text-gray-400 font-medium">units sold</span>
    </div>
  );
}

// ─── Main content (needs Suspense for useSearchParams) ────────────────────────
function BuyerViewContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const rawItemId = searchParams.get("itemId");

  const [isLoading, setIsLoading] = useState(true);
  const [isSalesLoading, setIsSalesLoading] = useState(true);
  const [itemData, setItemData] = useState<ItemDetail | null>(null);
  const [salesData, setSalesData] = useState<SalesData | null>(null);

  // ── Debug modal state (comment out in production) ──────────────────────────
  const [showDebugModal, setShowDebugModal] = useState(false);

  // ── Fetch item details ─────────────────────────────────────────────────────
  useEffect(() => {
    if (!rawItemId) {
      toast.error("No item ID provided");
      router.push("/buyer");
      return;
    }

    const fetchItem = async () => {
      try {
        const res = await fetch(
          `/api/item-search?itemSearch=${encodeURIComponent(rawItemId)}`
        );
        if (!res.ok) throw new Error("Failed to fetch item details");
        const json = await res.json();
        if (!json.success || !json.data)
          throw new Error(json.message || "Failed to fetch item details");

        const d = json.data;
        setItemData({
          itemId: d.itemId || rawItemId,
          itemName: d.itemName || "",
          pricePL1: d.pricePL1 ? parseFloat(d.pricePL1).toFixed(2) : "",
          lastCost: d.lastCost || "",
          defaultSupplier: d.defaultSupplier || "",
          defaultSupplierUnitId: d.defaultSupplierUnitId || "",
          defaultSupplierUnitQty: d.defaultSupplierUnitQty || "",
        });
      } catch (error) {
        const err = error as Error;
        toast.error(err.message || "Could not fetch item details");
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchItem();
  }, [rawItemId, router]);

  // ── Fetch sales data ───────────────────────────────────────────────────────
  useEffect(() => {
    if (!rawItemId) return;

    const fetchSales = async () => {
      setIsSalesLoading(true);
      try {
        const res = await fetch(
          `/api/buyer-sales?itemId=${encodeURIComponent(rawItemId)}`
        );
        if (!res.ok) throw new Error("Sales fetch failed");
        const json = await res.json();
        if (json.success) setSalesData(json.sales);
      } catch (error) {
        console.error("Sales fetch error:", error);
        // Non-blocking — sales panel just shows 0
      } finally {
        setIsSalesLoading(false);
      }
    };

    fetchSales();
  }, [rawItemId]);

  const refreshSales = async () => {
    if (!rawItemId) return;
    setIsSalesLoading(true);
    try {
      const res = await fetch(
        `/api/buyer-sales?itemId=${encodeURIComponent(rawItemId)}`
      );
      const json = await res.json();
      if (json.success) setSalesData(json.sales);
    } catch {
      /* silent */
    } finally {
      setIsSalesLoading(false);
    }
  };

  // ── Loading skeleton ───────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <p className="text-gray-500 font-medium">Loading item details…</p>
      </div>
    );
  }

  if (!itemData) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-4 space-y-4">
        <p className="text-gray-500 font-medium">Item could not be loaded.</p>
        <button
          onClick={() => router.push("/buyer")}
          className="flex items-center space-x-2 bg-violet-600 text-white px-6 py-3 rounded-2xl"
        >
          <ArrowLeft size={16} />
          <span>Go Back</span>
        </button>
      </div>
    );
  }

  const caseCostVal =
    parseFloat(itemData.defaultSupplierUnitQty || "0") *
    parseFloat(itemData.lastCost || "0");
  const caseCostFormatted = !isNaN(caseCostVal) ? caseCostVal.toFixed(2) : "0.00";

  return (
    <main className="min-h-screen bg-gray-50 text-gray-900 pb-12">
      {/* ── Header ── */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10 shadow-sm px-4 py-4 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <button
            onClick={() => router.back()}
            className="p-2 text-gray-400 hover:text-gray-900 bg-gray-100 hover:bg-gray-200 rounded-full transition-all"
          >
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 className="text-xl font-bold tracking-tight">Item Details</h1>
            <p className="text-xs text-violet-500 font-semibold">
              Buyer — Read Only
            </p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          {/* DEBUG BUTTON — comment out in production */}
          <button
            onClick={() => setShowDebugModal(true)}
            className="flex items-center space-x-1.5 px-3 py-2 bg-amber-50 text-amber-700 hover:bg-amber-100 active:bg-amber-200 border border-amber-200 rounded-xl font-medium text-xs transition-all"
            title="Show API State"
          >
            <Bug size={14} />
            <span className="hidden sm:inline">Show API State</span>
          </button>
          {/* END DEBUG BUTTON */}
          <button
            onClick={() => router.push("/buyer")}
            className="flex items-center space-x-1.5 px-3 py-2 bg-gray-100 text-gray-700 hover:bg-gray-200 active:bg-gray-300 rounded-xl font-medium text-sm transition-all"
          >
            <Scan size={16} />
            <span className="hidden sm:inline">Rescan</span>
          </button>
        </div>
      </header>

      <div className="max-w-2xl mx-auto mt-6 px-4 space-y-6">

        {/* ── Sales Summary Card ── */}
        <section className="bg-violet-50 p-5 rounded-3xl border border-violet-100 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <TrendingUp size={18} className="text-violet-500" />
              <h2 className="text-sm font-bold uppercase tracking-widest text-violet-600">
                Qty Sold
              </h2>
            </div>
            <button
              onClick={refreshSales}
              disabled={isSalesLoading}
              className="p-1.5 text-violet-400 hover:text-violet-600 hover:bg-violet-100 rounded-lg transition-all disabled:opacity-50"
              title="Refresh sales data"
            >
              <RefreshCw
                size={15}
                className={isSalesLoading ? "animate-spin" : ""}
              />
            </button>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <SalesTile
              label="7 Days"
              period={salesData?.last7Days}
              loading={isSalesLoading}
            />
            <SalesTile
              label="14 Days"
              period={salesData?.last14Days}
              loading={isSalesLoading}
            />
            <SalesTile
              label="30 Days"
              period={salesData?.last30Days}
              loading={isSalesLoading}
            />
          </div>

          {!isSalesLoading && salesData && (
            <p className="text-[10px] text-violet-400 font-medium text-center">
              Period ends:{" "}
              {new Date(salesData.last7Days.endDate).toLocaleDateString(
                "en-CA",
                { year: "numeric", month: "short", day: "numeric" }
              )}{" "}
              (excl. today)
            </p>
          )}
        </section>

        {/* ── Item Info Card ── */}
        <section className="bg-white p-5 rounded-3xl shadow-sm border border-gray-100 space-y-5">
          <h2 className="text-sm font-bold uppercase tracking-widest text-gray-400 border-b border-gray-100 pb-3">
            Item Information
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <ReadField label="Item ID" value={itemData.itemId} />
            <ReadField label="Price ($)" value={`$${itemData.pricePL1 || "0.00"}`} />
          </div>

          <ReadField label="Description" value={itemData.itemName} />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <ReadField
              label="Unit Cost ($)"
              value={
                itemData.lastCost
                  ? `$${parseFloat(itemData.lastCost).toFixed(2)}`
                  : "—"
              }
            />
            <ReadField label="Case Cost ($)" value={`$${caseCostFormatted}`} />
          </div>
        </section>

        {/* ── Supplier Info Card ── */}
        <section className="bg-white p-5 rounded-3xl shadow-sm border border-gray-100 space-y-5">
          <h2 className="text-sm font-bold uppercase tracking-widest text-gray-400 border-b border-gray-100 pb-3">
            Supplier Information
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <ReadField label="Supplier" value={itemData.defaultSupplier} />
            <ReadField label="Supplier ID" value={itemData.defaultSupplierUnitId} />
            <ReadField label="Case Qty" value={itemData.defaultSupplierUnitQty} />
          </div>
        </section>

      </div>

      {/* DEBUG MODAL — comment out in production */}
      <BuyerDebugModal
        isOpen={showDebugModal}
        onClose={() => setShowDebugModal(false)}
        itemId={rawItemId || ""}
      />
      {/* END DEBUG MODAL */}
    </main>
  );
}

// ─── Page export with Suspense boundary ──────────────────────────────────────
export default function BuyerViewPage() {
  return (
    <Suspense
      fallback={<div className="min-h-screen bg-gray-50" />}
    >
      <BuyerViewContent />
    </Suspense>
  );
}
