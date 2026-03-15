"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { getItem, updateItem, updatePrice, ItemResponse } from "@/lib/api";
import { ArrowLeft, Save, Loader2, CheckCircle2 } from "lucide-react";

function EditItemContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const itemId = searchParams.get("itemId");

  const [item, setItem] = useState<ItemResponse | null>(null);
  const [description, setDescription] = useState("");
  const [retailPrice, setRetailPrice] = useState("");
  
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (!itemId) {
      router.push("/");
      return;
    }

    const fetchItem = async () => {
      try {
        setIsLoading(true);
        setError("");
        const data = await getItem(itemId);
        setItem(data);
        setDescription(data.name || "");
        setRetailPrice(data.retail1?.toString() || "");
      } catch (err) {
        console.error("Failed to fetch item:", err);
        setError("Failed to load item information. Please try scanning again.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchItem();
  }, [itemId, router]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!item) return;

    // Validation
    if (description.trim().length < 3) {
      setError("Description must be at least 3 characters long.");
      return;
    }

    const priceNum = parseFloat(retailPrice);
    if (isNaN(priceNum) || priceNum < 0) {
      setError("Please enter a valid numeric price.");
      return;
    }

    try {
      setIsSaving(true);
      setError("");

      // Execute both updates sequentially
      await updateItem(item.itemId, description.trim());
      await updatePrice(item.itemId, priceNum);

      setSuccess(true);
      setTimeout(() => {
        router.push("/");
      }, 2000);
    } catch (err) {
      console.error("Failed to save updates:", err);
      setError("Failed to save changes. Please try again.");
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="w-full h-64 flex flex-col items-center justify-center space-y-4">
        <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
        <p className="text-gray-500 font-medium">Loading item details...</p>
      </div>
    );
  }

  if (error && !item) {
    return (
      <div className="w-full space-y-6">
        <div className="bg-red-50 text-red-700 p-4 rounded-xl border border-red-100 text-sm">
          {error}
        </div>
        <button
          onClick={() => router.push("/")}
          className="w-full flex items-center justify-center space-x-2 bg-gray-900 hover:bg-gray-800 text-white font-medium py-3 px-6 rounded-xl transition-all"
        >
          <ArrowLeft size={18} />
          <span>Back to Scanner</span>
        </button>
      </div>
    );
  }

  return (
    <div className="w-full">
      {success ? (
        <div className="bg-green-50 rounded-2xl p-8 text-center space-y-4 border border-green-100 shadow-sm">
          <div className="mx-auto w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center">
            <CheckCircle2 size={32} />
          </div>
          <h2 className="text-xl font-bold text-green-800">Save Successful</h2>
          <p className="text-green-600 text-sm">Item updated in the system. Returning to scanner...</p>
        </div>
      ) : (
        <form onSubmit={handleSave} className="space-y-6">
          {error && (
            <div className="bg-red-50 text-red-700 p-4 rounded-xl border border-red-100 text-sm font-medium">
              {error}
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1 pl-1">Item ID</label>
              <input
                type="text"
                value={item?.itemId || ""}
                disabled
                className="w-full p-4 bg-gray-100 border border-gray-200 rounded-xl text-gray-500 font-medium cursor-not-allowed"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1 pl-1">Description</label>
              <input
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                required
                className="w-full p-4 bg-white border border-gray-200 rounded-xl text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-lg shadow-sm"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1 pl-1">Retail Price ($)</label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={retailPrice}
                onChange={(e) => setRetailPrice(e.target.value)}
                required
                className="w-full p-4 bg-white border border-gray-200 rounded-xl text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-lg shadow-sm font-mono"
              />
            </div>
          </div>

          <div className="flex flex-col space-y-3 pt-4 border-t border-gray-100">
            <button
              type="submit"
              disabled={isSaving}
              className="w-full flex items-center justify-center space-x-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-medium py-4 px-6 rounded-xl transition-all shadow-[0_4px_12px_rgba(37,99,235,0.2)] active:scale-[0.98]"
            >
              {isSaving ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <Save size={20} />
                  <span className="text-lg">Save Updates</span>
                </>
              )}
            </button>
            
            <button
              type="button"
              onClick={() => router.push("/")}
              disabled={isSaving}
              className="w-full text-gray-500 hover:text-gray-900 font-medium py-3 px-6 rounded-xl transition-colors hover:bg-gray-100"
            >
              Cancel & Rescan
            </button>
          </div>
        </form>
      )}
    </div>
  );
}

export default function EditScreen() {
  return (
    <main className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] p-6 sm:p-8 space-y-6">
        <div className="border-b border-gray-100 pb-4">
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Edit Item</h1>
          <p className="text-gray-500 text-sm mt-1">Update product details below.</p>
        </div>
        
        <Suspense fallback={
          <div className="w-full h-64 flex items-center justify-center">
            <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
          </div>
        }>
          <EditItemContent />
        </Suspense>
      </div>
    </main>
  );
}
