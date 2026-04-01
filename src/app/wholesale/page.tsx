"use client";

import React, { useState, useEffect } from "react";
import toast from "react-hot-toast";
import BarcodeScanner from "@/components/BarcodeScanner";
import { Search, ChevronRight, Settings, ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";
import Image from "next/image";

export default function WholesaleScannerScreen() {
  const router = useRouter();
  const [manualCode, setManualCode] = useState("");
  const [isFetching, setIsFetching] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [margin, setMargin] = useState<number | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    // Fetch margin and user role parallelly
    const fetchData = async () => {
      try {
        const [marginRes, userRes] = await Promise.all([
          fetch("/api/wholesale/settings"),
          fetch("/api/auth/me")
        ]);

        if (marginRes.ok) {
          const mData = await marginRes.json();
          if (mData.success) setMargin(mData.margin);
        }

        if (userRes.ok) {
          const uData = await userRes.json();
          if (uData.success && uData.user.role === "ADMIN") {
            setIsAdmin(true);
          }
        }
      } catch (err) {
        console.error("Error fetching data:", err);
      }
    };
    fetchData();
  }, []);

  const fetchItemDetails = async (id: string) => {
    setIsFetching(true);
    setErrorMsg("");
    try {
      const response = await fetch(`/api/item-search?itemSearch=${encodeURIComponent(id)}`);
      
      if (!response.ok) {
        if (response.status === 404) {
          throw new Error("Not Found");
        }
        throw new Error("Failed to fetch item details");
      }
      
      const json = await response.json();
      if (!json.success) {
        throw new Error(json.message === "Item not found" ? "Not Found" : (json.message || "Failed to fetch item details"));
      }

      // Success -> Navigate to Wholesale Result Screen
      router.push(`/wholesale/result?itemId=${encodeURIComponent(id)}`);

    } catch (error) {
      const err = error as Error;
      const message = err.message === "Item Not Found" ? "Not Found" : err.message;
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
    <main className="min-h-screen flex items-center justify-center p-4 bg-gray-50 flex-col relative">
      <header className="absolute top-0 w-full bg-white border-b border-gray-200 z-10 shadow-sm px-4 py-4 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <button onClick={() => router.push("/modules")} className="p-2 text-gray-400 hover:text-gray-900 bg-gray-100 hover:bg-gray-200 rounded-full transition-all">
            <ArrowLeft size={20} />
          </button>
          <h1 className="text-xl font-bold tracking-tight">Wholesale</h1>
        </div>
        <div className="flex items-center space-x-4">
          {margin !== null && (
             <div className="hidden sm:flex flex-col items-end">
               <span className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">Wholesale % Markup</span>
               <span className="text-sm font-semibold text-blue-600">{margin.toFixed(1)}%</span>
             </div>
          )}
          {isAdmin && (
            <button
              onClick={() => router.push("/wholesale/settings")}
              className="p-2 text-gray-400 hover:text-blue-600 bg-gray-100 hover:bg-blue-50 rounded-full transition-all"
              title="Wholesale Settings"
            >
              <Settings size={20} />
            </button>
          )}
        </div>
      </header>

      <div className="w-full max-w-md bg-white rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] sm:p-8 p-6 space-y-8 mt-[80px]">
        
        <div className="text-center space-y-2">
          <div className="flex justify-center mb-6">
            <Image src="/logo.jpg" alt="Brand Logo" width={120} height={120} className="object-contain rounded-xl" priority />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 tracking-tight">Scan Item</h2>
          <p className="text-gray-500 text-sm">Scan a barcode or enter the item lookup code manually.</p>
        </div>

        {margin !== null && (
          <div className="sm:hidden flex flex-col items-center p-3 bg-blue-50 border border-blue-100 rounded-xl">
             <span className="text-[10px] uppercase font-bold text-blue-400 tracking-wider mb-1">Wholesale % Markup</span>
             <span className="text-lg font-bold text-blue-700">{margin.toFixed(1)}%</span>
          </div>
        )}

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
                <Search className={`h-5 w-5 ${errorMsg ? 'text-red-400' : 'text-gray-400'}`} />
              </div>
              <input
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                value={manualCode}
                onChange={(e) => {
                  setManualCode(e.target.value.replace(/\D/g, ''));
                  setErrorMsg("");
                }}
                className={`block w-full pl-11 pr-4 py-4 border rounded-2xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 transition-all font-medium text-lg bg-gray-50/50 ${
                  errorMsg 
                    ? 'border-red-500 focus:ring-red-500/20 focus:border-red-500 text-red-900' 
                    : 'border-gray-200 focus:ring-blue-500/20 focus:border-blue-500 text-gray-900'
                }`}
                placeholder="Item Lookup Code..."
              />
            </div>
            {errorMsg && (
              <p className="text-red-500 text-sm font-medium mt-1 ml-1">{errorMsg}</p>
            )}
            
            <button
              type="submit"
              disabled={!manualCode.trim() || isFetching}
              className="w-full flex items-center justify-center space-x-2 bg-gray-900 hover:bg-gray-800 disabled:bg-gray-200 disabled:text-gray-400 text-white font-medium py-4 px-6 rounded-2xl transition-all active:scale-[0.98]"
            >
              <span>{isFetching ? "Fetching..." : "Look up item"}</span>
              {!isFetching && <ChevronRight size={18} />}
            </button>
          </form>

          {/* TEST SAMPLE BUTTON: Can be commented out in production */}
          <div className="pt-4 border-t border-gray-100">
            <button
              onClick={() => router.push('/wholesale/result?itemId=005056184632&isSample=true')}
              className="w-full flex items-center justify-center space-x-2 bg-blue-100 hover:bg-blue-200 text-blue-800 font-medium py-3 px-6 rounded-2xl transition-all active:scale-[0.98] border border-blue-200 dashed"
            >
              <span>Load Sample Data API Response</span>
            </button>
          </div>
        </div>

      </div>
    </main>
  );
}
