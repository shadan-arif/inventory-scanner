"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import toast from "react-hot-toast";
import {
  ArrowLeft,
  Save,
  Scan,
  TrendingUp,
  RefreshCw,
  Bug,
  CheckCircle2,
  XCircle,
  Search,
} from "lucide-react";
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
function ReadField({ label, value }: { label: string; value: string | undefined }) {
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

// ─── Sales tile (mobile-safe, no decimals) ────────────────────────────────────
function SalesTile({
  label,
  period,
  loading,
}: {
  label: string;
  period?: SalesPeriod;
  loading: boolean;
}) {
  const qty = period?.qtySold ?? 0;
  const display = Math.round(qty); // drop decimal

  return (
    <div className="flex flex-col items-center justify-center bg-white border border-violet-100 rounded-2xl p-3 sm:p-4 shadow-sm space-y-1 min-w-0 overflow-hidden">
      <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-widest text-violet-400 truncate w-full text-center">
        {label}
      </span>
      {loading ? (
        <div className="h-7 sm:h-8 w-12 sm:w-16 rounded-lg bg-gray-100 animate-pulse" />
      ) : (
        <span className="text-2xl sm:text-3xl font-extrabold text-gray-900 leading-none truncate w-full text-center">
          {display}
        </span>
      )}
      <span className="text-[9px] sm:text-[10px] text-gray-400 font-medium">
        units sold
      </span>
    </div>
  );
}

// ─── Main content ─────────────────────────────────────────────────────────────
function BuyerViewContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const rawItemId = searchParams.get("itemId");

  const [isLoading, setIsLoading] = useState(true);
  const [isSalesLoading, setIsSalesLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const [originalData, setOriginalData] = useState<ItemDetail | null>(null);
  const [currentData, setCurrentData] = useState<ItemDetail | null>(null);
  const [salesData, setSalesData] = useState<SalesData | null>(null);

  const [nameError, setNameError] = useState("");
  const [priceError, setPriceError] = useState("");
  const [costError, setCostError] = useState("");
  const [showSuccessOverlay, setShowSuccessOverlay] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");

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
        const item: ItemDetail = {
          itemId: d.itemId || rawItemId,
          itemName: d.itemName || "",
          pricePL1: (d.pricePL1 || d.price)
            ? parseFloat(d.pricePL1 || d.price).toFixed(2)
            : "",
          lastCost: d.lastCost ? parseFloat(d.lastCost).toFixed(2) : "",
          defaultSupplier: d.defaultSupplier || "",
          defaultSupplierUnitId: d.defaultSupplierUnitId || "",
          defaultSupplierUnitQty: d.defaultSupplierUnitQty || "",
        };

        setOriginalData(item);
        setCurrentData(item);
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

  // ── Loading / error states ─────────────────────────────────────────────────
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <p className="text-gray-500 font-medium">Loading item details…</p>
      </div>
    );
  }

  if (!originalData || !currentData) {
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

  // ── Change detection ───────────────────────────────────────────────────────
  const nameChanged = originalData.itemName !== currentData.itemName;
  const priceChanged = originalData.pricePL1 !== currentData.pricePL1;
  const costChanged = originalData.lastCost !== currentData.lastCost;
  const anyChanged = nameChanged || priceChanged || costChanged;

  // ── Save handler (mirrors v2/edit logic) ───────────────────────────────────
  const handleSaveChanges = async () => {
    if (!anyChanged) return;

    setIsSaving(true);
    setNameError("");
    setPriceError("");
    setCostError("");

    let hasError = false;

    if (nameChanged) {
      try {
        const res = await fetch("/api/updateName", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify([
            {
              action: "U",
              itemId: currentData.itemId,
              name: currentData.itemName.trim(),
              receiptAlias: currentData.itemName.trim(),
              nonReturnable: true,
            },
          ]),
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok || (data && data.success === false))
          throw new Error(data?.message || "Name update failed");
      } catch (error) {
        const err = error as Error;
        setNameError(err.message || "Name update failed");
        hasError = true;
      }
    }

    if (priceChanged || costChanged) {
      try {
        const now = new Date();
        const pad = (n: number) => n.toString().padStart(2, "0");
        const formattedDate = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())} ${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`;

        const payload = {
          zoneName: "Primary Zone",
          startDate: formattedDate,
          itemId: currentData.itemId,
          price1: currentData.pricePL1,
          cost: currentData.lastCost || "0",
        };

        const res = await fetch("/api/updatePriceV2", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok || (data && data.success === false))
          throw new Error(data?.message || "Price/Cost update failed");
      } catch (error) {
        const err = error as Error;
        if (priceChanged) setPriceError(err.message || "Price update failed");
        if (costChanged) setCostError(err.message || "Cost update failed");
        hasError = true;
      }
    }

    setIsSaving(false);

    if (!hasError) {
      const savedStr = [];
      if (nameChanged) savedStr.push("Name");
      if (priceChanged) savedStr.push("Price");
      if (costChanged) savedStr.push("Unit Cost");

      const savedStrFormatted = savedStr.join(", ");
      setSuccessMessage(
        savedStrFormatted
          ? `Successfully updated ${savedStrFormatted}.`
          : "Your updates have been applied."
      );

      setOriginalData(currentData);
      setShowSuccessOverlay(true);
      setTimeout(() => {
        router.push("/buyer");
      }, 2500);
    }
  };

  // ── Derived values ─────────────────────────────────────────────────────────
  const caseCostVal =
    parseFloat(currentData.defaultSupplierUnitQty || "0") *
    parseFloat(currentData.lastCost || "0");
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
            <p className="text-xs text-violet-500 font-semibold">Buyer</p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          {/* DEBUG BUTTON — comment out in production */}
          {/* <button
            onClick={() => setShowDebugModal(true)}
            className="flex items-center space-x-1.5 px-3 py-2 bg-amber-50 text-amber-700 hover:bg-amber-100 active:bg-amber-200 border border-amber-200 rounded-xl font-medium text-xs transition-all"
            title="Show API State"
          >
            <Bug size={14} />
            <span className="hidden sm:inline">Show API State</span>
          </button> */}
          {/* END DEBUG BUTTON */}
          <button
            onClick={() => router.push("/buyer")}
            disabled={isSaving}
            className="flex items-center space-x-1.5 px-3 py-2 bg-gray-100 text-gray-700 hover:bg-gray-200 active:bg-gray-300 rounded-xl font-medium text-sm transition-all disabled:opacity-50"
          >
            <Scan size={16} />
            <span className="hidden sm:inline">Rescan</span>
          </button>
          <button
            onClick={handleSaveChanges}
            disabled={!anyChanged || isSaving}
            className="flex items-center space-x-1.5 px-4 py-2 bg-violet-600 text-white hover:bg-violet-700 active:bg-violet-800 disabled:bg-gray-300 disabled:text-gray-500 rounded-xl font-medium text-sm transition-all"
          >
            <Save size={16} />
            <span className="hidden sm:inline">
              {isSaving ? "Saving..." : "Save Changes"}
            </span>
            <span className="sm:hidden">{isSaving ? "Saving" : "Save"}</span>
          </button>
        </div>
      </header>

      <div className="max-w-2xl mx-auto mt-6 px-4 space-y-6">
        {/* ── Sales Summary Card ── */}
        <section className="bg-violet-50 p-4 sm:p-5 rounded-3xl border border-violet-100 space-y-4">
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

          <div className="grid grid-cols-3 gap-2 sm:gap-3">
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

        {/* ── Editable Fields Card ── */}
        <section className="bg-white p-5 rounded-3xl shadow-sm border border-gray-100 space-y-6">
          <h2 className="text-sm font-bold uppercase tracking-widest text-violet-600 border-b border-gray-100 pb-3">
            Editable Fields
          </h2>

          {/* Item ID */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Item ID</label>
            <div className="relative">
              <input
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                value={currentData.itemId}
                onChange={(e) =>
                  setCurrentData({
                    ...currentData,
                    itemId: e.target.value.replace(/\D/g, ""),
                  })
                }
                className="block w-full px-4 py-3 border border-gray-300 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent transition-all font-medium text-base bg-white shadow-sm pr-12"
                placeholder="Enter Item ID..."
              />
              <button
                onClick={() => {
                  if (originalData.itemId !== currentData.itemId) {
                    router.push(
                      `/buyer/view?itemId=${encodeURIComponent(currentData.itemId.trim())}`
                    );
                  }
                }}
                disabled={originalData.itemId === currentData.itemId}
                className={`absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-lg transition-all ${
                  originalData.itemId !== currentData.itemId
                    ? "bg-violet-100 text-violet-600 hover:bg-violet-200"
                    : "text-gray-400 bg-transparent disabled:opacity-50"
                }`}
                title="Search new Item ID"
              >
                <Search size={18} />
              </button>
            </div>
            <div className="text-sm pt-1">
              {originalData.itemId !== currentData.itemId ? (
                <div className="flex items-center text-violet-600 font-medium">
                  <Search size={16} className="mr-1.5" />
                  <span>Click search to load item: {currentData.itemId}</span>
                </div>
              ) : null}
            </div>
          </div>

          {/* Description */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Description</label>
            <input
              type="text"
              value={currentData.itemName}
              onChange={(e) => {
                setCurrentData({ ...currentData, itemName: e.target.value });
                setNameError("");
              }}
              className={`block w-full px-4 py-3 border rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:border-transparent transition-all font-medium text-base bg-white shadow-sm ${
                nameError
                  ? "border-red-500 focus:ring-red-500"
                  : "border-gray-300 focus:ring-violet-500"
              }`}
              placeholder="Enter description..."
            />
            {nameError && (
              <div className="text-sm pt-1 text-red-500 font-medium flex items-center">
                <XCircle size={16} className="mr-1.5" />
                <span>{nameError}</span>
              </div>
            )}
            {!nameError && (
              <div className="text-sm pt-1">
                {nameChanged ? (
                  <div className="flex items-center text-green-600 font-medium">
                    <CheckCircle2 size={16} className="mr-1.5" />
                    <span>Will update to: {currentData.itemName}</span>
                  </div>
                ) : (
                  <div className="flex items-center text-gray-400">
                    <XCircle size={16} className="mr-1.5" />
                    <span>No changes detected</span>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Price */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Price ($)</label>
            <input
              type="text"
              inputMode="decimal"
              pattern="[0-9]*\.?[0-9]*"
              value={currentData.pricePL1}
              onChange={(e) => {
                const val = e.target.value;
                if (/^\d*\.?\d*$/.test(val)) {
                  setCurrentData({ ...currentData, pricePL1: val });
                  setPriceError("");
                }
              }}
              className={`block w-full px-4 py-3 border rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:border-transparent transition-all font-medium text-base bg-white shadow-sm ${
                priceError
                  ? "border-red-500 focus:ring-red-500"
                  : "border-gray-300 focus:ring-violet-500"
              }`}
              placeholder="0.00"
            />
            {priceError && (
              <div className="text-sm pt-1 text-red-500 font-medium flex items-center">
                <XCircle size={16} className="mr-1.5" />
                <span>{priceError}</span>
              </div>
            )}
            {!priceError && (
              <div className="text-sm pt-1">
                {priceChanged ? (
                  <div className="flex items-center text-green-600 font-medium">
                    <CheckCircle2 size={16} className="mr-1.5" />
                    <span>Will update to: ${currentData.pricePL1}</span>
                  </div>
                ) : (
                  <div className="flex items-center text-gray-400">
                    <XCircle size={16} className="mr-1.5" />
                    <span>No changes detected</span>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Unit Cost */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Unit Cost ($)</label>
            <input
              type="text"
              inputMode="decimal"
              pattern="[0-9]*\.?[0-9]*"
              value={currentData.lastCost}
              onChange={(e) => {
                const val = e.target.value;
                if (/^\d*\.?\d*$/.test(val)) {
                  setCurrentData({ ...currentData, lastCost: val });
                  setCostError("");
                }
              }}
              className={`block w-full px-4 py-3 border rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:border-transparent transition-all font-medium text-base bg-white shadow-sm ${
                costError
                  ? "border-red-500 focus:ring-red-500"
                  : "border-gray-300 focus:ring-violet-500"
              }`}
              placeholder="0.00"
            />
            {costError && (
              <div className="text-sm pt-1 text-red-500 font-medium flex items-center">
                <XCircle size={16} className="mr-1.5" />
                <span>{costError}</span>
              </div>
            )}
            {!costError && (
              <div className="text-sm pt-1">
                {costChanged ? (
                  <div className="flex items-center text-green-600 font-medium">
                    <CheckCircle2 size={16} className="mr-1.5" />
                    <span>Will update to: ${currentData.lastCost}</span>
                  </div>
                ) : (
                  <div className="flex items-center text-gray-400">
                    <XCircle size={16} className="mr-1.5" />
                    <span>No changes detected</span>
                  </div>
                )}
              </div>
            )}
          </div>
        </section>

        {/* ── Read-Only Fields Card ── */}
        <section className="bg-white p-5 rounded-3xl shadow-sm border border-gray-100 space-y-5">
          <h2 className="text-sm font-bold uppercase tracking-widest text-gray-400 border-b border-gray-100 pb-3">
            Read-Only Information
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <ReadField label="Supplier" value={currentData.defaultSupplier} />
            <ReadField label="Supplier ID" value={currentData.defaultSupplierUnitId} />
            <ReadField label="Case Qty" value={currentData.defaultSupplierUnitQty} />
            <ReadField label="Case Cost" value={`$${caseCostFormatted}`} />
          </div>
        </section>
      </div>

      {/* Success Overlay */}
      {showSuccessOverlay && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm transition-all">
          <div className="bg-white p-8 rounded-3xl shadow-xl flex flex-col items-center space-y-4 animate-in fade-in duration-300 transform scale-100">
            <div className="bg-green-100 p-4 rounded-full">
              <CheckCircle2 size={48} className="text-green-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900">
              Changes Saved Successfully!
            </h2>
            <p className="text-gray-500 text-center max-w-[250px]">
              {successMessage} Redirecting back...
            </p>
          </div>
        </div>
      )}

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
    <Suspense fallback={<div className="min-h-screen bg-gray-50" />}>
      <BuyerViewContent />
    </Suspense>
  );
}
