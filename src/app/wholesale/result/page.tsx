"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import toast from "react-hot-toast";
import { ArrowLeft, Scan, DollarSign } from "lucide-react";

interface ItemDetail {
  itemId: string;
  itemName: string;
  pricePL1: string;
  lastCost: string;
  defaultSupplier: string;
  defaultSupplierUnitId: string;
  defaultSupplierUnitQty: string;
}

function WholesaleResultContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const rawItemId = searchParams.get("itemId");
  const isSample = searchParams.get("isSample") === "true";

  const [isLoading, setIsLoading] = useState(true);
  const [item, setItem] = useState<ItemDetail | null>(null);
  const [margin, setMargin] = useState<number>(35.0);

  useEffect(() => {
    if (!rawItemId) {
      toast.error("No item ID provided");
      router.push("/wholesale");
      return;
    }

    const fetchData = async () => {
      try {
        const fetchPromises: any[] = [
          fetch("/api/wholesale/settings")
        ];

        if (!isSample) {
           fetchPromises.unshift(fetch(`/api/item-search?itemSearch=${encodeURIComponent(rawItemId)}`));
        }

        const responses = await Promise.all(fetchPromises);
        
        // Handle Item Data
        if (isSample) {
          setItem({
            itemId: "005056184632",
            itemName: "***3 CRAB FISH SAUCE CASE",
            pricePL1: parseFloat("45.0000").toFixed(2),
            lastCost: "36.5000",
            defaultSupplier: "Kam Lee Yuen Trading",
            defaultSupplierUnitId: "005056184632",
            defaultSupplierUnitQty: "1.000",
          });
        } else {
          const itemRes = responses[0];
          
          if (!itemRes.ok) throw new Error("Failed to fetch item details");
          const json = await itemRes.json();
          if (!json.success || !json.data) throw new Error(json.message || "Failed to fetch item details");

          const data = json.data;
          setItem({
            itemId: data.itemId || rawItemId,
            itemName: data.itemName || "",
            pricePL1: (data.pricePL1 || data.price) ? parseFloat(data.pricePL1 || data.price).toFixed(2) : "",
            lastCost: data.lastCost || "0",
            defaultSupplier: data.defaultSupplier || "",
            defaultSupplierUnitId: data.defaultSupplierUnitId || "",
            defaultSupplierUnitQty: data.defaultSupplierUnitQty || "0",
          });
        }

        // Handle Margin Settings Data
        const marginResIndex = isSample ? 0 : 1;
        const marginRes = responses[marginResIndex];
        
        if (marginRes.ok) {
          const mData = await marginRes.json();
          if (mData.success) {
            setMargin(mData.margin);
          }
        }

      } catch (error) {
        const err = error as Error;
        toast.error(err.message || "Could not fetch details for this item");
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [rawItemId, router]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <p className="text-gray-500 font-medium animate-pulse">Loading item details...</p>
      </div>
    );
  }

  if (!item) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-4 space-y-4">
        <p className="text-gray-500 font-medium">Item could not be loaded.</p>
        <button
          onClick={() => router.push("/wholesale")}
          className="flex items-center space-x-2 bg-gray-900 text-white px-6 py-3 rounded-2xl"
        >
          <ArrowLeft size={16} />
          <span>Go Back</span>
        </button>
      </div>
    );
  }

  // Calculations
  const caseQty = parseFloat(item.defaultSupplierUnitQty || "0");
  const unitCost = parseFloat(item.lastCost || "0");
  const caseCost = isNaN(caseQty * unitCost) ? 0 : caseQty * unitCost;
  
  const idealMarginDecimal = margin / 100;
  const denominator = 1 - idealMarginDecimal;
  const customerPrice = denominator > 0 ? caseCost / denominator : 0;

  return (
    <main className="min-h-screen bg-gray-50 text-gray-900 pb-12">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10 shadow-sm px-4 py-4 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <button onClick={() => router.push("/wholesale")} className="p-2 text-gray-400 hover:text-gray-900 bg-gray-100 hover:bg-gray-200 rounded-full transition-all">
            <ArrowLeft size={20} />
          </button>
          <h1 className="text-xl font-bold tracking-tight">Wholesale Item</h1>
        </div>
        <div className="flex items-center space-x-3">
          <button
            onClick={() => router.push("/wholesale")}
            className="flex items-center space-x-1.5 px-3 py-2 bg-blue-600 text-white hover:bg-blue-700 active:bg-blue-800 rounded-xl font-medium text-sm transition-all shadow-sm"
          >
            <Scan size={16} />
            <span className="hidden sm:inline">Rescan</span>
          </button>
        </div>
      </header>

      <div className="max-w-2xl mx-auto mt-6 px-4 space-y-6">

        {/* Customer Price Section */}
        <section className="bg-gradient-to-br from-blue-600 to-blue-800 p-6 rounded-3xl shadow-lg border border-transparent space-y-3 relative overflow-hidden">
          <div className="absolute -right-4 -top-8 text-white/10">
            <DollarSign size={160} />
          </div>
          <h2 className="text-sm font-bold uppercase tracking-widest text-blue-200 relative z-10">Calculated Customer Price</h2>
          <div className="flex items-baseline space-x-2 relative z-10">
            <span className="text-5xl font-black text-white tracking-tight">${customerPrice.toFixed(2)}</span>
            <span className="text-lg font-medium text-blue-200">/ case</span>
          </div>
          <div className="relative z-10 inline-block bg-white/20 px-3 py-1 rounded-full text-xs font-semibold text-blue-100 backdrop-blur-sm">
            Based on {margin.toFixed(1)}% ideal margin
          </div>
        </section>

        {/* Basic Product Info */}
        <section className="bg-white p-5 rounded-3xl shadow-sm border border-gray-100 space-y-5">
          <h2 className="text-sm font-bold uppercase tracking-widest text-gray-400 border-b border-gray-100 pb-3">Basic Info</h2>
          
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-gray-500">Item Code</label>
                <div className="text-base font-semibold text-gray-900 bg-gray-50 border border-gray-100 rounded-xl p-3">{item.itemId}</div>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-semibold text-gray-500">Unit Cost</label>
                <div className="text-base font-semibold text-gray-900 bg-gray-50 border border-gray-100 rounded-xl p-3">${unitCost.toFixed(2)}</div>
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-gray-500">Description</label>
              <div className="text-base font-semibold text-gray-900 bg-gray-50 border border-gray-100 rounded-xl p-3">{item.itemName || "-"}</div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-gray-500">Retail Unit Price</label>
                <div className="text-base font-semibold text-gray-900 bg-gray-50 border border-gray-100 rounded-xl p-3">${parseFloat(item.pricePL1 || "0").toFixed(2)}</div>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-semibold text-gray-500">Case Quantity</label>
                <div className="text-base font-semibold text-gray-900 bg-gray-50 border border-gray-100 rounded-xl p-3">{caseQty}</div>
              </div>
            </div>
          </div>
        </section>

        {/* Primary Supplier Info */}
        <section className="bg-white p-5 rounded-3xl shadow-sm border border-gray-100 space-y-5">
          <h2 className="text-sm font-bold uppercase tracking-widest text-gray-400 border-b border-gray-100 pb-3">Primary Supplier</h2>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-gray-500">Supplier</label>
              <div className="text-sm font-semibold text-gray-700 bg-gray-50 border border-gray-100 rounded-xl p-3">{item.defaultSupplier || "-"}</div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-gray-500">Supplier ID (MPQ)</label>
              <div className="text-sm font-semibold text-gray-700 bg-gray-50 border border-gray-100 rounded-xl p-3">{item.defaultSupplierUnitId || "-"}</div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-gray-500">Case Cost</label>
              <div className="text-sm font-semibold text-gray-700 bg-gray-50 border border-gray-100 rounded-xl p-3">${caseCost.toFixed(2)}</div>
            </div>
            
            <div className="space-y-1">
              <label className="text-xs font-semibold text-gray-500">Calculation Method</label>
              <div className="text-xs font-medium text-gray-500 bg-gray-50 border border-gray-100 rounded-xl p-3 flex items-center h-full">
                Case Qty ({caseQty}) × Unit Cost (${unitCost.toFixed(2)})
              </div>
            </div>
          </div>
        </section>

      </div>
    </main>
  );
}

export default function WholesaleResultScreen() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-gray-50"></div>}>
      <WholesaleResultContent />
    </Suspense>
  );
}
