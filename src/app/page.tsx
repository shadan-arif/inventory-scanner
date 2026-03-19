"use client";

import React, { useState } from "react";
import toast from "react-hot-toast";
import BarcodeScanner from "@/components/BarcodeScanner";
import { Search, ChevronRight, PackageSearch, PenLine, DollarSign, ArrowLeft, CheckCircle2 } from "lucide-react";

interface ItemDetail {
  itemId: string;
  itemName: string;
  price: string;
  stock: string;
  supplier?: string;
  department?: string;
}

export default function ScanScreen() {
  const [mode, setMode] = useState<"scan" | "detail" | "update-name" | "update-price">("scan");
  const [manualCode, setManualCode] = useState("");
  
  const [itemId, setItemId] = useState("");
  const [itemDetail, setItemDetail] = useState<ItemDetail | null>(null);
  const [isFetching, setIsFetching] = useState(false);

  // For update forms
  const [newName, setNewName] = useState("");
  const [newPrice, setNewPrice] = useState("");
  const [isUpdating, setIsUpdating] = useState(false);
  const [updateSuccess, setUpdateSuccess] = useState(false);

  const fetchItemDetails = async (id: string) => {
    setIsFetching(true);
    setItemId(id);
    try {
      const response = await fetch(`/api/item-search?itemSearch=${encodeURIComponent(id)}`);
      if (!response.ok) throw new Error("Failed to fetch item details");
      const json = await response.json();
      if (!json.success) throw new Error(json.message || "Failed to fetch item details");
      setItemDetail(json.data);
      setMode("detail");
      setUpdateSuccess(false);
    } catch (error) {
      const err = error as Error;
      toast.error(err.message || "Could not fetch details for this item");
      console.error(err);
    } finally {
      setIsFetching(false);
    }
  };

  const handleScanSuccess = (decodedText: string) => {
    toast.success("Barcode scanned: " + decodedText);
    fetchItemDetails(decodedText);
  };

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (manualCode.trim() !== "") {
      fetchItemDetails(manualCode.trim());
    } else {
      toast.error("Please enter an item ID");
    }
  };

  const handleUpdateName = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return toast.error("Please enter a new name");
    setIsUpdating(true);
    setUpdateSuccess(false);
    try {
      const response = await fetch("/api/updateName", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify([{ action: "U", itemId: itemId, name: newName.trim(), receiptAlias: newName.trim(), nonReturnable: true }]),
      });
      if (!response.ok) throw new Error("Update failed");
      setUpdateSuccess(true);
      toast.success("Name updated successfully!");
      setMode("detail");
    } catch (error) {
      const err = error as Error;
      toast.error(err.message || "Error updating name");
    } finally {
      setIsUpdating(false);
    }
  };

  const handleUpdatePrice = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPrice.trim()) return toast.error("Please enter a new price");
    setIsUpdating(true);
    setUpdateSuccess(false);
    try {
      const response = await fetch("/api/updatePrice", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify([{ itemId: itemId, zoneId: "Primary Zone", retail1: newPrice.trim(), promptForPrice1: false, discount1: "", quantityonly1: true, idealMargin1: "", divider1: 1, familyLine: "1" }]),
      });
      if (!response.ok) throw new Error("Update failed");
      setUpdateSuccess(true);
      toast.success("Price updated successfully!");
      setMode("detail");
    } catch (error) {
      const err = error as Error;
      toast.error(err.message || "Error updating price");
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <main className="min-h-screen flex items-center justify-center p-4 bg-gray-50">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] sm:p-8 p-6 space-y-8">
        
        {mode === "scan" && (
          <>
            <div className="text-center space-y-2">
              <div className="mx-auto w-16 h-16 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mb-4">
                <PackageSearch size={32} />
              </div>
              <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Scan Item</h1>
              <p className="text-gray-500 text-sm">Scan a barcode or enter the item ID manually to view details.</p>
            </div>

            <div className="space-y-6">
              <BarcodeScanner onScanSuccess={handleScanSuccess} />

              <div className="relative flex items-center py-2">
                <div className="flex-grow border-t border-gray-100"></div>
                <span className="flex-shrink-0 mx-4 text-gray-400 text-sm font-medium">OR</span>
                <div className="flex-grow border-t border-gray-100"></div>
              </div>

              <form onSubmit={handleManualSubmit} className="space-y-4">
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Search className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="text"
                    value={manualCode}
                    onChange={(e) => setManualCode(e.target.value)}
                    className="block w-full pl-11 pr-4 py-4 border border-gray-200 rounded-2xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium text-lg bg-gray-50/50"
                    placeholder="Enter item ID..."
                  />
                </div>
                
                <button
                  type="submit"
                  disabled={!manualCode.trim() || isFetching}
                  className="w-full flex items-center justify-center space-x-2 bg-gray-900 hover:bg-gray-800 disabled:bg-gray-200 disabled:text-gray-400 text-white font-medium py-4 px-6 rounded-2xl transition-all active:scale-[0.98]"
                >
                  <span>{isFetching ? "Fetching..." : "Look up item"}</span>
                  {!isFetching && <ChevronRight size={18} />}
                </button>
              </form>
            </div>
          </>
        )}

        {mode === "detail" && (
          <div className="space-y-6">
            <button
              onClick={() => { setMode("scan"); setUpdateSuccess(false); }}
              className="text-gray-500 hover:text-gray-800 flex items-center space-x-2 text-sm font-medium transition-colors"
            >
              <ArrowLeft size={16} />
              <span>Back to search</span>
            </button>
            
            <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm space-y-4">
              <h2 className="text-xl font-bold text-gray-900 border-b border-gray-100 pb-2">Item Details</h2>
              {itemDetail ? (
                <div className="space-y-3">
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-gray-500 font-medium">Item ID</span>
                    <span className="font-bold text-gray-900">{itemDetail.itemId || itemId}</span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-gray-500 font-medium">Name</span>
                    <span className="font-bold text-gray-900 break-words text-right ml-4">{itemDetail.itemName || "-"}</span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-gray-500 font-medium">Price</span>
                    <span className="font-bold text-green-600 text-lg">${Number(itemDetail.price).toFixed(2) === "NaN" ? itemDetail.price || "-" : Number(itemDetail.price).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-gray-500 font-medium">Stock</span>
                    <span className="font-bold text-blue-600">{itemDetail.stock || "0"}</span>
                  </div>
                  {(itemDetail.supplier || itemDetail.department) && (
                    <div className="flex justify-between items-center text-sm border-t border-gray-50 pt-2">
                      <span className="text-gray-500 font-medium">Supplier / Dept</span>
                      <span className="font-medium text-gray-700">{itemDetail.supplier || "-"} / {itemDetail.department || "-"}</span>
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-sm text-gray-500">No details available.</p>
              )}
            </div>

            {updateSuccess && (
              <div className="bg-green-50 text-green-800 border border-green-200 rounded-xl p-4 flex items-center space-x-3">
                <CheckCircle2 className="text-green-500 w-5 h-5 flex-shrink-0" />
                <p className="text-sm font-medium">Update successful!</p>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <button
                onClick={() => { setMode("update-name"); setNewName(""); setUpdateSuccess(false); }}
                className="flex flex-col items-center justify-center p-4 bg-white border border-gray-200 rounded-2xl hover:border-blue-500 hover:shadow-md transition-all group"
              >
                <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                  <PenLine size={20} />
                </div>
                <span className="font-semibold text-gray-900">Update Name</span>
              </button>
              <button
                onClick={() => { setMode("update-price"); setNewPrice(""); setUpdateSuccess(false); }}
                className="flex flex-col items-center justify-center p-4 bg-white border border-gray-200 rounded-2xl hover:border-green-500 hover:shadow-md transition-all group"
              >
                <div className="w-10 h-10 bg-green-50 text-green-600 rounded-full flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                  <DollarSign size={20} />
                </div>
                <span className="font-semibold text-gray-900">Update Price</span>
              </button>
            </div>
          </div>
        )}

        {(mode === "update-name" || mode === "update-price") && (
          <div className="space-y-6">
            <button
              onClick={() => setMode("detail")}
              className="text-gray-500 hover:text-gray-800 flex items-center space-x-2 text-sm font-medium transition-colors"
            >
              <ArrowLeft size={16} />
              <span>Back to details</span>
            </button>
            
            <div className="bg-gray-50 rounded-2xl p-6 border border-gray-100 mb-6 flex flex-col items-center justify-center space-y-2">
               <div className={`w-12 h-12 rounded-full flex items-center justify-center ${mode === "update-name" ? "bg-blue-50 text-blue-600" : "bg-green-50 text-green-600"}`}>
                 {mode === "update-name" ? <PenLine size={24} /> : <DollarSign size={24} />}
               </div>
              <h2 className="text-lg font-bold text-gray-900">
                {mode === "update-name" ? "Update Item Name" : "Update Item Price"}
              </h2>
              <p className="text-sm text-gray-500">ID: {itemId}</p>
            </div>

            {mode === "update-name" ? (
              <form onSubmit={handleUpdateName} className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">New Item Name</label>
                  <input
                    type="text"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    className="block w-full px-4 py-3 border border-gray-200 rounded-2xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium text-lg bg-gray-50/50"
                    placeholder="Enter new name..."
                    autoFocus
                  />
                </div>
                <button
                  type="submit"
                  disabled={!newName.trim() || isUpdating}
                  className="w-full flex items-center justify-center space-x-2 bg-gray-900 hover:bg-gray-800 disabled:bg-gray-200 disabled:text-gray-400 text-white font-medium py-4 px-6 rounded-2xl transition-all active:scale-[0.98] mt-6"
                >
                  <span>{isUpdating ? "Updating..." : "Save Name"}</span>
                  {!isUpdating && <ChevronRight size={18} />}
                </button>
              </form>
            ) : (
              <form onSubmit={handleUpdatePrice} className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">New Retail Price (retail1)</label>
                  <input
                    type="text"
                    value={newPrice}
                    onChange={(e) => setNewPrice(e.target.value)}
                    className="block w-full px-4 py-3 border border-gray-200 rounded-2xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium text-lg bg-gray-50/50"
                    placeholder="e.g. 10.99"
                    autoFocus
                  />
                </div>
                <button
                  type="submit"
                  disabled={!newPrice.trim() || isUpdating}
                  className="w-full flex items-center justify-center space-x-2 bg-gray-900 hover:bg-gray-800 disabled:bg-gray-200 disabled:text-gray-400 text-white font-medium py-4 px-6 rounded-2xl transition-all active:scale-[0.98] mt-6"
                >
                  <span>{isUpdating ? "Updating..." : "Save Price"}</span>
                  {!isUpdating && <ChevronRight size={18} />}
                </button>
              </form>
            )}
          </div>
        )}

      </div>
    </main>
  );
}
