"use client";

import React, { useState } from "react";
import toast from "react-hot-toast";
import BarcodeScanner from "@/components/BarcodeScanner";
import { PackageSearch, ChevronRight, CheckCircle2 } from "lucide-react";

export default function UpdatePriceScreen() {
  const [itemId, setItemId] = useState("");
  const [price, setPrice] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleScanSuccess = (decodedText: string) => {
    setItemId(decodedText);
    toast.success("Barcode scanned: " + decodedText);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!itemId.trim() || !price.trim()) {
      toast.error("Please fill in both fields");
      return;
    }

    setLoading(true);
    setSuccess(false);

    try {
      const response = await fetch("/api/updatePrice", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify([
          {
            itemId: itemId.trim(),
            zoneId: "Primary Zone",
            retail1: price.trim(),
            promptForPrice1: false,
            discount1: "",
            quantityonly1: true,
            idealMargin1: "",
            divider1: 1,
            familyLine: "1"
          },
        ]),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to update price");
      }

      setSuccess(true);
      toast.success("Successfully updated item price!");
      setItemId("");
      setPrice("");
    } catch (error: unknown) {
      console.error(error);
      const errorMessage = error instanceof Error ? error.message : "Error updating item price";
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen flex items-center justify-center p-4 bg-gray-50">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] sm:p-8 p-6 space-y-8">
        <div className="text-center space-y-2">
          <div className="mx-auto w-16 h-16 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mb-4">
            <PackageSearch size={32} />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Update Item Price</h1>
          <p className="text-gray-500 text-sm">Scan a barcode or enter the item ID to update its price.</p>
        </div>

        {success && (
          <div className="bg-green-50 text-green-800 border border-green-200 rounded-xl p-4 flex items-center space-x-3">
            <CheckCircle2 className="text-green-500 w-5 h-5 flex-shrink-0" />
            <p className="text-sm font-medium">Item price updated successfully!</p>
          </div>
        )}

        <div className="space-y-6">
          <BarcodeScanner onScanSuccess={handleScanSuccess} />

          <div className="relative flex items-center py-2">
            <div className="flex-grow border-t border-gray-100"></div>
            <span className="flex-shrink-0 mx-4 text-gray-400 text-sm font-medium">ITEM DETAILS</span>
            <div className="flex-grow border-t border-gray-100"></div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Item ID</label>
              <input
                type="text"
                value={itemId}
                onChange={(e) => {
                  setItemId(e.target.value);
                  setSuccess(false);
                }}
                className="block w-full px-4 py-3 border border-gray-200 rounded-2xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium text-lg bg-gray-50/50"
                placeholder="Scan or enter ID..."
              />
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">New Retail Price (retail1)</label>
              <input
                type="text"
                value={price}
                onChange={(e) => {
                  setPrice(e.target.value);
                  setSuccess(false);
                }}
                className="block w-full px-4 py-3 border border-gray-200 rounded-2xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium text-lg bg-gray-50/50"
                placeholder="e.g. 10.99"
              />
            </div>
            
            <button
              type="submit"
              disabled={!itemId.trim() || !price.trim() || loading}
              className="w-full flex items-center justify-center space-x-2 bg-gray-900 hover:bg-gray-800 disabled:bg-gray-200 disabled:text-gray-400 text-white font-medium py-4 px-6 rounded-2xl transition-all active:scale-[0.98] mt-6"
            >
              <span>{loading ? "Updating..." : "Update Price"}</span>
              {!loading && <ChevronRight size={18} />}
            </button>
          </form>
        </div>
      </div>
    </main>
  );
}
