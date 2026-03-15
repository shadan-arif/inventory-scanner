"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import BarcodeScanner from "@/components/BarcodeScanner";
import { Search, ChevronRight, PackageSearch } from "lucide-react";

export default function ScanScreen() {
  const [manualCode, setManualCode] = useState("");
  const router = useRouter();

  const handleScanSuccess = (decodedText: string) => {
    navigateToEdit(decodedText);
  };

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (manualCode.trim() !== "") {
      toast.success("Item ID entered");
      navigateToEdit(manualCode.trim());
    } else {
      toast.error("Please enter an item ID");
    }
  };

  const navigateToEdit = (itemId: string) => {
    router.push(`/edit?itemId=${encodeURIComponent(itemId)}`);
  };

  return (
    <main className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] sm:p-8 p-6 space-y-8">
        <div className="text-center space-y-2">
          <div className="mx-auto w-16 h-16 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mb-4">
            <PackageSearch size={32} />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Scan Item</h1>
          <p className="text-gray-500 text-sm">Scan a barcode or enter the item ID manually to edit details.</p>
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
              disabled={!manualCode.trim()}
              className="w-full flex items-center justify-center space-x-2 bg-gray-900 hover:bg-gray-800 disabled:bg-gray-200 disabled:text-gray-400 text-white font-medium py-4 px-6 rounded-2xl transition-all active:scale-[0.98]"
            >
              <span>Look up item</span>
              <ChevronRight size={18} />
            </button>
          </form>
        </div>
      </div>
    </main>
  );
}
