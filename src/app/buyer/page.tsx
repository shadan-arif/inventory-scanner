"use client";

import React, { useState } from "react";
import toast from "react-hot-toast";
import BarcodeScanner from "@/components/BarcodeScanner";
import { Search, ChevronRight, Home } from "lucide-react";
import { useRouter } from "next/navigation";
import Image from "next/image";

export default function BuyerScanScreen() {
  const router = useRouter();
  const [manualCode, setManualCode] = useState("");
  const [isFetching, setIsFetching] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const fetchItemDetails = async (id: string) => {
    setIsFetching(true);
    setErrorMsg("");
    try {
      const response = await fetch(
        `/api/item-search?itemSearch=${encodeURIComponent(id)}`
      );

      if (!response.ok) {
        if (response.status === 404) throw new Error("Not Found");
        throw new Error("Failed to fetch item details");
      }

      const json = await response.json();
      if (!json.success) {
        throw new Error(
          json.message === "Item not found"
            ? "Not Found"
            : json.message || "Failed to fetch item details"
        );
      }

      router.push(`/buyer/view?itemId=${encodeURIComponent(id)}`);
    } catch (error) {
      const err = error as Error;
      const message =
        err.message === "Item Not Found" ? "Not Found" : err.message;
      setErrorMsg(message);
      toast.error(message || "Not Found");
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

  return (
    <main className="min-h-screen flex items-center justify-center p-4 bg-gray-50 relative">
      {/* Top Left Back/Home Button */}
      <div className="absolute top-6 left-6 z-10">
        <button
          onClick={() => router.push("/modules")}
          className="p-3 text-gray-500 hover:text-gray-900 bg-white hover:bg-gray-100 border border-gray-200 rounded-2xl shadow-sm transition-all"
          title="Back to Modules"
        >
          <Home size={24} />
        </button>
      </div>

      <div className="w-full max-w-md bg-white rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] sm:p-8 p-6 space-y-8 mt-12 sm:mt-0">
        <div className="text-center space-y-2">
          <div className="flex justify-center mb-6">
            <Image
              src="/logo.jpg"
              alt="Brand Logo"
              width={120}
              height={120}
              className="object-contain rounded-xl"
              priority
            />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">
            Buyer — Scan Item
          </h1>
          <p className="text-gray-500 text-sm">
            Scan a barcode or enter the item ID to view product details & sales.
          </p>
        </div>

        <div className="space-y-6">
          <BarcodeScanner onScanSuccess={handleScanSuccess} />

          <div className="relative flex items-center py-2">
            <div className="flex-grow border-t border-gray-100"></div>
            <span className="flex-shrink-0 mx-4 text-gray-400 text-sm font-medium">
              OR
            </span>
            <div className="flex-grow border-t border-gray-100"></div>
          </div>

          <form onSubmit={handleManualSubmit} className="space-y-4">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <Search
                  className={`h-5 w-5 ${
                    errorMsg ? "text-red-400" : "text-gray-400"
                  }`}
                />
              </div>
              <input
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                value={manualCode}
                onChange={(e) => {
                  setManualCode(e.target.value.replace(/\D/g, ""));
                  setErrorMsg("");
                }}
                className={`block w-full pl-11 pr-4 py-4 border rounded-2xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 transition-all font-medium text-lg bg-gray-50/50 ${
                  errorMsg
                    ? "border-red-500 focus:ring-red-500/20 focus:border-red-500 text-red-900"
                    : "border-gray-200 focus:ring-violet-500/20 focus:border-violet-500 text-gray-900"
                }`}
                placeholder="Enter item ID..."
              />
            </div>
            {errorMsg && (
              <p className="text-red-500 text-sm font-medium mt-1 ml-1">
                {errorMsg}
              </p>
            )}

            <button
              type="submit"
              disabled={!manualCode.trim() || isFetching}
              className="w-full flex items-center justify-center space-x-2 bg-violet-600 hover:bg-violet-700 disabled:bg-gray-200 disabled:text-gray-400 text-white font-medium py-4 px-6 rounded-2xl transition-all active:scale-[0.98]"
            >
              <span>{isFetching ? "Fetching..." : "Look up item"}</span>
              {!isFetching && <ChevronRight size={18} />}
            </button>
          </form>
        </div>
      </div>
    </main>
  );
}
