"use client";

import React, { useState, useEffect } from "react";
import toast from "react-hot-toast";
import { ArrowLeft, Save, Loader2, Info } from "lucide-react";
import { useRouter } from "next/navigation";

export default function WholesaleSettingsScreen() {
  const router = useRouter();
  const [margin, setMargin] = useState<string>("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const fetchMargin = async () => {
      try {
        const response = await fetch("/api/wholesale/settings");
        if (response.ok) {
          const data = await response.json();
          if (data.success) {
            setMargin(data.margin.toString());
          }
        }
      } catch (error) {
        console.error("Failed to fetch margin:", error);
        toast.error("Failed to load settings.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchMargin();
  }, []);

  const handleSave = async () => {
    const marginNum = parseFloat(margin);
    
    if (isNaN(marginNum) || marginNum < 0 || marginNum > 100) {
      toast.error("Margin must be a valid number between 0 and 100.");
      return;
    }

    setIsSaving(true);
    try {
      const response = await fetch("/api/wholesale/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ margin: marginNum }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        toast.success("Settings saved successfully.");
        setMargin(data.margin.toString());
        router.push("/wholesale");
      } else {
        throw new Error(data.message || "Failed to save settings");
      }
    } catch (error) {
      toast.error((error as Error).message);
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader2 className="animate-spin text-gray-400" size={32} />
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-gray-50 text-gray-900 pb-12">
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10 shadow-sm px-4 py-4 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <button onClick={() => router.push("/wholesale")} className="p-2 text-gray-400 hover:text-gray-900 bg-gray-100 hover:bg-gray-200 rounded-full transition-all">
            <ArrowLeft size={20} />
          </button>
          <h1 className="text-xl font-bold tracking-tight">Wholesale Settings</h1>
        </div>
        <div className="flex items-center space-x-3">
          <button
            onClick={handleSave}
            disabled={isSaving || !margin.trim()}
            className="flex items-center space-x-1.5 px-4 py-2 bg-blue-600 text-white hover:bg-blue-700 active:bg-blue-800 disabled:bg-gray-300 disabled:text-gray-500 rounded-xl font-medium text-sm transition-all shadow-sm"
          >
            {isSaving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
            <span className="hidden sm:inline">{isSaving ? "Saving..." : "Save"}</span>
          </button>
        </div>
      </header>

      <div className="max-w-2xl mx-auto mt-6 px-4 space-y-6">
        <section className="bg-white p-5 rounded-3xl shadow-sm border border-gray-100 space-y-6">
          <h2 className="text-sm font-bold uppercase tracking-widest text-blue-600 border-b border-gray-100 pb-3">Global Pricing Configuration</h2>
          
          <div className="bg-blue-50 border border-blue-100 p-4 rounded-xl flex items-start space-x-3">
            <Info className="text-blue-500 mt-0.5" size={20} />
            <p className="text-sm text-blue-800">
              The Ideal Margin determines the calculated customer price for all wholesale items. It applies globally to all users and products. Note that it will be calculated as <strong className="font-semibold">Case Cost / (1 - Ideal Margin)</strong>.
            </p>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Ideal Margin (%)</label>
            <div className="relative">
              <input
                type="text"
                inputMode="decimal"
                pattern="[0-9]*\.?[0-9]*"
                value={margin}
                onChange={(e) => {
                  const val = e.target.value;
                  if (/^\d*\.?\d*$/.test(val)) {
                    setMargin(val);
                  }
                }}
                className="block w-full px-4 py-3 border border-gray-300 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all font-medium text-xl bg-white shadow-sm"
                placeholder="0.0"
              />
              <div className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 font-bold select-none text-xl">%</div>
            </div>
            <p className="text-xs text-gray-500 font-medium ml-1 flex justify-between">
              <span>Enter a percentage (e.g. 35.0)</span>
              {margin && !isNaN(parseFloat(margin)) && (
                <span className="text-blue-600">e.g. For $45.50 cost → ${(45.50 / (1 - parseFloat(margin)/100 || 1)).toFixed(2)} price</span>
              )}
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}
