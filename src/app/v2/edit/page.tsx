"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import toast from "react-hot-toast";
import { ArrowLeft, Save, Scan, CheckCircle2, XCircle } from "lucide-react";

interface ItemDetail {
  itemId: string;
  itemName: string;
  pricePL1: string;
  lastCost?: string;
  defaultSupplier?: string;
  defaultSupplierUnitId?: string;
  defaultSupplierUnitQty?: string;
}

function EditContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const rawItemId = searchParams.get("itemId");

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  
  const [originalData, setOriginalData] = useState<ItemDetail | null>(null);
  const [currentData, setCurrentData] = useState<ItemDetail | null>(null);

  useEffect(() => {
    if (!rawItemId) {
      toast.error("No item ID provided");
      router.push("/v2");
      return;
    }

    const fetchItemDetails = async (id: string) => {
      try {
        const response = await fetch(`/api/item-search?itemSearch=${encodeURIComponent(id)}`);
        
        if (!response.ok) {
          throw new Error("Failed to fetch item details");
        }
        
        const json = await response.json();
        if (!json.success || !json.data) {
          throw new Error(json.message || "Failed to fetch item details");
        }

        const data = json.data;
        // set original and current data
        const item: ItemDetail = {
          itemId: data.itemId || id,
          itemName: data.itemName || "",
          pricePL1: data.pricePL1 || data.price || "",
          lastCost: data.lastCost || "",
          defaultSupplier: data.defaultSupplier || "",
          defaultSupplierUnitId: data.defaultSupplierUnitId || "",
          defaultSupplierUnitQty: data.defaultSupplierUnitQty || "",
        };

        setOriginalData(item);
        setCurrentData(item);

      } catch (error) {
        const err = error as Error;
        toast.error(err.message || "Could not fetch details for this item");
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchItemDetails(rawItemId);
  }, [rawItemId, router]);


  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <p className="text-gray-500 font-medium">Loading item details...</p>
      </div>
    );
  }

  if (!originalData || !currentData) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-4 space-y-4">
        <p className="text-gray-500 font-medium">Item could not be loaded.</p>
        <button
          onClick={() => router.push("/v2")}
          className="flex items-center space-x-2 bg-gray-900 text-white px-6 py-3 rounded-2xl"
        >
          <ArrowLeft size={16} />
          <span>Go Back</span>
        </button>
      </div>
    );
  }

  const nameChanged = originalData.itemName !== currentData.itemName;
  const priceChanged = originalData.pricePL1 !== currentData.pricePL1;
  const anyChanged = nameChanged || priceChanged;

  const handleSaveChanges = async () => {
    if (!anyChanged) return;
    
    setIsSaving(true);
    let nameSuccess = false;
    let priceSuccess = false;

    try {
      if (nameChanged) {
        const res = await fetch("/api/updateName", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify([{ action: "U", itemId: currentData.itemId, name: currentData.itemName.trim(), receiptAlias: currentData.itemName.trim(), nonReturnable: true }]),
        });
        if (!res.ok) throw new Error("Name update failed");
        nameSuccess = true;
      }

      if (priceChanged) {
        const res = await fetch("/api/updatePrice", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify([{ itemId: currentData.itemId, zoneId: "Primary Zone", retail1: currentData.pricePL1.trim(), promptForPrice1: false, discount1: "", quantityonly1: true, idealMargin1: "", divider1: 1, familyLine: "1" }]),
        });
        if (!res.ok) throw new Error("Price update failed");
        priceSuccess = true;
      }

      if (nameSuccess) toast.success("Name updated");
      if (priceSuccess) toast.success("Price updated");

      setOriginalData(currentData);
    } catch (error) {
      const err = error as Error;
      toast.error(err.message || "Error updating item");
    } finally {
      setIsSaving(false);
    }
  };

  // derived case cost
  const caseCostVal = (parseFloat(currentData.defaultSupplierUnitQty || "0") * parseFloat(currentData.lastCost || "0"));
  const caseCostFormatted = !isNaN(caseCostVal) ? caseCostVal.toFixed(2) : "0.00";

  return (
    <main className="min-h-screen bg-gray-50 text-gray-900 pb-12">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10 shadow-sm px-4 py-4 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <button onClick={() => router.back()} className="p-2 text-gray-400 hover:text-gray-900 bg-gray-100 hover:bg-gray-200 rounded-full transition-all">
            <ArrowLeft size={20} />
          </button>
          <h1 className="text-xl font-bold tracking-tight">Edit Item</h1>
        </div>
        <div className="flex items-center space-x-3">
          <button
            onClick={() => router.push("/v2")}
            disabled={isSaving}
            className="flex items-center space-x-1.5 px-3 py-2 bg-gray-100 text-gray-700 hover:bg-gray-200 active:bg-gray-300 rounded-xl font-medium text-sm transition-all disabled:opacity-50"
          >
            <Scan size={16} />
            <span className="hidden sm:inline">Rescan</span>
          </button>
          <button
            onClick={handleSaveChanges}
            disabled={!anyChanged || isSaving}
            className="flex items-center space-x-1.5 px-4 py-2 bg-blue-600 text-white hover:bg-blue-700 active:bg-blue-800 disabled:bg-gray-300 disabled:text-gray-500 rounded-xl font-medium text-sm transition-all"
          >
            <Save size={16} />
            <span className="hidden sm:inline">{isSaving ? "Saving..." : "Save Changes"}</span>
            <span className="sm:hidden">{isSaving ? "Saving" : "Save"}</span>
          </button>
        </div>
      </header>

      <div className="max-w-2xl mx-auto mt-6 px-4 space-y-6">

        {/* Editable Fields Card */}
        <section className="bg-white p-5 rounded-3xl shadow-sm border border-gray-100 space-y-6">
          <h2 className="text-sm font-bold uppercase tracking-widest text-blue-600 border-b border-gray-100 pb-3">Editable Fields</h2>
          
          {/* Description */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Description</label>
            <input
              type="text"
              value={currentData.itemName}
              onChange={(e) => setCurrentData({ ...currentData, itemName: e.target.value })}
              className="block w-full px-4 py-3 border border-gray-300 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all font-medium text-base bg-white shadow-sm"
              placeholder="Enter description..."
            />
            {/* Dynamic API Preview UI */}
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
                }
              }}
              className="block w-full px-4 py-3 border border-gray-300 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all font-medium text-base bg-white shadow-sm"
              placeholder="0.00"
            />
            {/* Dynamic API Preview UI */}
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
          </div>
        </section>


        {/* Read-Only Fields Card */}
        <section className="bg-white p-5 rounded-3xl shadow-sm border border-gray-100 space-y-5">
          <h2 className="text-sm font-bold uppercase tracking-widest text-gray-400 border-b border-gray-100 pb-3">Read-Only Information</h2>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-gray-500 flex justify-between">
                <span>Item Lookup Code</span>
              </label>
              <input type="text" value={currentData.itemId} disabled className="block w-full px-4 py-3 border border-gray-100 rounded-xl text-gray-500 font-medium text-sm bg-gray-50 cursor-not-allowed" />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-gray-500 flex justify-between">
                <span>Unit Cost</span>
              </label>
              <input type="text" value={`$${parseFloat(currentData.lastCost || "0").toFixed(2)}`} disabled className="block w-full px-4 py-3 border border-gray-100 rounded-xl text-gray-500 font-medium text-sm bg-gray-50 cursor-not-allowed" />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-gray-500 flex justify-between">
                <span>Supplier</span>
              </label>
              <input type="text" value={currentData.defaultSupplier || "-"} disabled className="block w-full px-4 py-3 border border-gray-100 rounded-xl text-gray-500 font-medium text-sm bg-gray-50 cursor-not-allowed" />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-gray-500 flex justify-between">
                <span>Supplier ID</span>
              </label>
              <input type="text" value={currentData.defaultSupplierUnitId || "-"} disabled className="block w-full px-4 py-3 border border-gray-100 rounded-xl text-gray-500 font-medium text-sm bg-gray-50 cursor-not-allowed" />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-gray-500 flex justify-between">
                <span>Case Qty</span>
              </label>
              <input type="text" value={currentData.defaultSupplierUnitQty || "0"} disabled className="block w-full px-4 py-3 border border-gray-100 rounded-xl text-gray-500 font-medium text-sm bg-gray-50 cursor-not-allowed" />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-gray-500 flex justify-between">
                <span>Case Cost</span>
              </label>
              <input type="text" value={`$${caseCostFormatted}`} disabled className="block w-full px-4 py-3 border border-gray-100 rounded-xl text-gray-500 font-medium text-sm bg-gray-50 cursor-not-allowed" />
            </div>
          </div>
        </section>

      </div>
    </main>
  );
}

export default function EditItemScreen() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-gray-50"></div>}>
      <EditContent />
    </Suspense>
  );
}
