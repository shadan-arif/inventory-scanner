"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import toast from "react-hot-toast";
import { ArrowLeft, Save, Scan, CheckCircle2, XCircle, Search } from "lucide-react";

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
  const [nameError, setNameError] = useState("");
  const [priceError, setPriceError] = useState("");
  const [costError, setCostError] = useState("");
  const [showSuccessOverlay, setShowSuccessOverlay] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  
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
          pricePL1: (data.pricePL1 || data.price) ? parseFloat(data.pricePL1 || data.price).toFixed(2) : "",
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
  const costChanged = originalData.lastCost !== currentData.lastCost;
  const anyChanged = nameChanged || priceChanged || costChanged;

  const handleSaveChanges = async () => {
    if (!anyChanged) return;
    
    setIsSaving(true);
    setNameError("");
    setPriceError("");
    
    let hasError = false;

    if (nameChanged) {
      try {
        const res = await fetch("/api/updateName", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify([{ action: "U", itemId: currentData.itemId, name: currentData.itemName.trim(), receiptAlias: currentData.itemName.trim(), nonReturnable: true }]),
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok || (data && data.success === false)) throw new Error(data?.message || "Name update failed");
      } catch (error) {
        const err = error as Error;
        setNameError(err.message || "Name update failed");
        hasError = true;
      }
    }

    if (priceChanged || costChanged) {
      try {
        const now = new Date();
        const pad = (n: number) => n.toString().padStart(2, '0');
        const formattedDate = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())} ${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`;

        const payload = {
          zoneName: "Primary Zone",
          startDate: formattedDate,
          itemId: currentData.itemId,
          price1: currentData.pricePL1,
          cost: currentData.lastCost || "0"
        };

        const res = await fetch("/api/updatePriceV2", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok || (data && data.success === false)) throw new Error(data?.message || "Price/Cost update failed");
      } catch (error) {
        const err = error as Error;
        if (priceChanged) setPriceError(err.message || "Price update failed");
        if (costChanged) setCostError(err.message || "Cost update failed");
        hasError = true;
      }
    }

    setIsSaving(false);

    if (!hasError) {
      let savedStr = [];
      if (nameChanged) savedStr.push("Name");
      if (priceChanged) savedStr.push("Price");
      if (costChanged) savedStr.push("Unit Cost");
      
      const savedStrFormatted = savedStr.join(", ");
      setSuccessMessage(savedStrFormatted ? `Successfully updated ${savedStrFormatted}.` : "Your updates have been applied.");

      setOriginalData(currentData);
      setShowSuccessOverlay(true);
      setTimeout(() => {
        router.push("/v2");
      }, 2500);
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
          
          {/* Item ID */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Item ID</label>
            <div className="relative">
              <input
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                value={currentData.itemId}
                onChange={(e) => setCurrentData({ ...currentData, itemId: e.target.value.replace(/\D/g, "") })}
                className="block w-full px-4 py-3 border border-gray-300 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all font-medium text-base bg-white shadow-sm pr-12"
                placeholder="Enter Item ID..."
              />
              <button
                onClick={() => {
                  if (originalData.itemId !== currentData.itemId) {
                    router.push(`/v2/edit?itemId=${encodeURIComponent(currentData.itemId.trim())}`);
                  }
                }}
                disabled={originalData.itemId === currentData.itemId}
                className={`absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-lg transition-all ${
                  originalData.itemId !== currentData.itemId
                    ? "bg-blue-100 text-blue-600 hover:bg-blue-200"
                    : "text-gray-400 bg-transparent disabled:opacity-50"
                }`}
                title="Search new Item ID"
              >
                <Search size={18} />
              </button>
            </div>
            {/* Dynamic API Preview UI */}
            <div className="text-sm pt-1">
              {originalData.itemId !== currentData.itemId ? (
                <div className="flex items-center text-blue-600 font-medium">
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
                nameError ? "border-red-500 focus:ring-red-500" : "border-gray-300 focus:ring-blue-500"
              }`}
              placeholder="Enter description..."
            />
            {nameError && (
              <div className="text-sm pt-1 text-red-500 font-medium flex items-center">
                <XCircle size={16} className="mr-1.5" />
                <span>{nameError}</span>
              </div>
            )}
            {/* Dynamic API Preview UI */}
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
                priceError ? "border-red-500 focus:ring-red-500" : "border-gray-300 focus:ring-blue-500"
              }`}
              placeholder="0.00"
            />
            {priceError && (
              <div className="text-sm pt-1 text-red-500 font-medium flex items-center">
                <XCircle size={16} className="mr-1.5" />
                <span>{priceError}</span>
              </div>
            )}
            {/* Dynamic API Preview UI */}
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
                costError ? "border-red-500 focus:ring-red-500" : "border-gray-300 focus:ring-blue-500"
              }`}
              placeholder="0.00"
            />
            {costError && (
              <div className="text-sm pt-1 text-red-500 font-medium flex items-center">
                <XCircle size={16} className="mr-1.5" />
                <span>{costError}</span>
              </div>
            )}
            {/* Dynamic API Preview UI */}
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


        {/* Read-Only Fields Card */}
        <section className="bg-white p-5 rounded-3xl shadow-sm border border-gray-100 space-y-5">
          <h2 className="text-sm font-bold uppercase tracking-widest text-gray-400 border-b border-gray-100 pb-3">Read-Only Information</h2>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">

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

      {/* Success Overlay */}
      {showSuccessOverlay && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm transition-all">
          <div className="bg-white p-8 rounded-3xl shadow-xl flex flex-col items-center space-y-4 animate-in fade-in duration-300 transform scale-100">
            <div className="bg-green-100 p-4 rounded-full">
              <CheckCircle2 size={48} className="text-green-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900">Changes Saved Successfully!</h2>
            <p className="text-gray-500 text-center max-w-[250px]">
              {successMessage} Redirecting back...
            </p>
          </div>
        </div>
      )}
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
