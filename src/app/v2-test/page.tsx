"use client";

import React, { useState } from "react";
import toast from "react-hot-toast";
import { Search, ChevronRight, PackageSearch, ArrowLeft, Save, Scan, CheckCircle2, XCircle } from "lucide-react";
import BarcodeScanner from "@/components/BarcodeScanner";

interface RequestPayload {
  url: string;
  method: string;
  headers?: Record<string, string>;
  body?: unknown;
}

interface ResponseData {
  status?: number;
  statusText?: string;
  data?: unknown;
  errorData?: unknown;
  error?: string;
}

interface ItemDetail {
  itemId: string;
  itemName: string;
  pricePL1: string;
  lastCost?: string;
  defaultSupplier?: string;
  defaultSupplierUnitId?: string;
  defaultSupplierUnitQty?: string;
}

export default function V2TestScreen() {
  const [mode, setMode] = useState<"scan" | "edit">("scan");
  
  // Scan State
  const [manualCode, setManualCode] = useState("733599125013");
  const [isFetching, setIsFetching] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  // Edit State
  const [isSaving, setIsSaving] = useState(false);
  const [originalData, setOriginalData] = useState<ItemDetail | null>(null);
  const [currentData, setCurrentData] = useState<ItemDetail | null>(null);
  const [nameError, setNameError] = useState("");
  const [priceError, setPriceError] = useState("");
  const [costError, setCostError] = useState("");
  const [showSuccessOverlay, setShowSuccessOverlay] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");

  // Inspector States
  const [baseUrlOption, setBaseUrlOption] = useState("https://25deb.catapultweboffice.com");
  const [customBaseUrl, setCustomBaseUrl] = useState("");
  const [apiKey, setApiKey] = useState("TYKJEJ1TPY2G82C2REG1UWUE0GV2JK4F");
  
  const [requestPayload, setRequestPayload] = useState<RequestPayload | null>(null);
  const [responseData, setResponseData] = useState<ResponseData | null>(null);

  // GET Item Search
  const fetchItemDetails = async (id: string, e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!id.trim()) {
      toast.error("Please enter an item ID");
      return;
    }

    setErrorMsg("");

    if (id === "005056184632" || id === "test") {
      setIsFetching(true);
      setResponseData(null);
      setRequestPayload(null);
      
      setTimeout(() => {
        const mockItem: ItemDetail = {
          itemId: "005056184632",
          itemName: "***3 CRAB FISH SAUCE CASE",
          pricePL1: "45.00",
          lastCost: "36.5000",
          defaultSupplier: "Kam Lee Yuen Trading",
          defaultSupplierUnitId: "005056184632",
          defaultSupplierUnitQty: "1.000",
        };
        setOriginalData(mockItem);
        setCurrentData(mockItem);
        setMode("edit");
        setIsFetching(false);
        setResponseData({
          status: 200,
          statusText: "OK",
          data: {
            success: true,
            message: "Mock data loaded for testing",
            data: mockItem
          }
        });
        setRequestPayload({
          url: "mock://local-test",
          method: "GET"
        });
        toast.success("Loaded mock item data");
      }, 500);
      return;
    }

    setIsFetching(true);
    setResponseData(null);
    setRequestPayload(null);

    const activeBaseUrl = baseUrlOption === "custom" ? customBaseUrl : baseUrlOption;
    const finalUrl = `/api/item-search?itemSearch=${encodeURIComponent(id)}`;

    setRequestPayload({
      url: `${activeBaseUrl}/api/itemDetail?itemSearch=${encodeURIComponent(id)}&apikey=${apiKey}`,
      method: "GET",
      headers: {
         "x-base-url": activeBaseUrl,
         "x-api-key": apiKey,
         "x-include-raw": "true"
      }
    });

    try {
      const response = await fetch(finalUrl, {
        method: "GET",
        headers: {
          "x-base-url": activeBaseUrl,
          "x-api-key": apiKey,
          "x-include-raw": "true"
        }
      });
      
      const textData = await response.text();
      let data;
      try {
         data = JSON.parse(textData);
      } catch {
         setResponseData({ status: response.status, statusText: response.statusText, data: textData });
         throw new Error("Invalid generic server response");
      }

      setResponseData({ status: response.status, statusText: response.statusText, data });

      if (!response.ok || !data.success) {
        throw new Error(data.message || "Failed to fetch item details");
      }

      const itemData: ItemDetail = {
        itemId: data.data.itemId || id,
        itemName: data.data.itemName || "",
        pricePL1: (data.data.pricePL1 || data.data.price) ? parseFloat(data.data.pricePL1 || data.data.price).toFixed(2) : "",
        lastCost: data.data.lastCost || "",
        defaultSupplier: data.data.defaultSupplier || "",
        defaultSupplierUnitId: data.data.defaultSupplierUnitId || "",
        defaultSupplierUnitQty: data.data.defaultSupplierUnitQty || "",
      };

      setOriginalData(itemData);
      setCurrentData(itemData);
      setMode("edit");

    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : "Error fetching item";
      const displayMsg = errorMessage.toLowerCase().includes("not found") ? "Not Found" : errorMessage;
      setErrorMsg(displayMsg);
      toast.error(displayMsg);
    } finally {
      setIsFetching(false);
    }
  };

  // POST Updates
  const handleSaveChanges = async () => {
    if (!originalData || !currentData) return;
    const nameChanged = originalData.itemName !== currentData.itemName;
    const priceChanged = originalData.pricePL1 !== currentData.pricePL1;
    const costChanged = originalData.lastCost !== currentData.lastCost;
    const anyChanged = nameChanged || priceChanged || costChanged;
    if (!anyChanged) return;
    
    setNameError("");
    setPriceError("");
    setCostError("");
    let hasError = false;

    if (currentData.itemId === "005056184632" || currentData.itemId === "test") {
      setIsSaving(true);
      setResponseData(null);
      setTimeout(() => {
        let savedStrArr = [];
        if (nameChanged) savedStrArr.push("Name");
        if (priceChanged) savedStrArr.push("Price");
        if (costChanged) savedStrArr.push("Unit Cost");
        
        const savedStrFormatted = savedStrArr.join(", ");
        setSuccessMessage(savedStrFormatted ? `Successfully updated ${savedStrFormatted}.` : "Your updates have been applied.");

        setOriginalData(currentData);
        setIsSaving(false);
        setResponseData({
           status: 200,
           statusText: "OK",
           data: { success: true, message: "Mock changes saved" }
        });
        setRequestPayload({
          url: "mock://local-save-test",
          method: "POST",
          body: currentData
        });
        setShowSuccessOverlay(true);
        setTimeout(() => {
          setShowSuccessOverlay(false);
          handleRescan();
        }, 2500);
      }, 500);
      return;
    }

    setIsSaving(true);
    setResponseData(null);

    const activeBaseUrl = baseUrlOption === "custom" ? customBaseUrl : baseUrlOption;

    try {
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
        
          setRequestPayload({
            url: `${activeBaseUrl}/api/batch/PermanentPriceCost?batch=4&appendExistingWorksheets=0&autoCommit=1`,
            method: "POST",
            body: payload
          });

          const res = await fetch("/api/updatePriceV2", {
            method: "POST",
            headers: { "Content-Type": "application/json", "x-base-url": activeBaseUrl, "x-api-key": apiKey },
            body: JSON.stringify(payload),
          });
        
          const data = await res.json().catch(() => ({}));
          setResponseData({ status: res.status, statusText: res.statusText, data });
          if (!res.ok || (data && data.success === false)) throw new Error(data?.message || "Price/Cost update failed");
        } catch (error) {
          const err = error as Error;
          if (priceChanged) setPriceError(err.message || "Price update failed");
          if (costChanged) setCostError(err.message || "Cost update failed");
          hasError = true;
        }
      }

      if (nameChanged) {
        try {
          const payload = [{ action: "U", itemId: currentData.itemId, name: currentData.itemName.trim(), receiptAlias: currentData.itemName.trim(), nonReturnable: true }];
        
          setRequestPayload({
            url: `${activeBaseUrl}/api/updateName?mock=true`,
            method: "POST",
            body: payload
          });

          const res = await fetch("/api/updateName", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          });
          const data = await res.json().catch(() => ({}));
        
          if (!res.ok || (data && data.success === false)) throw new Error(data?.message || "Name update failed");
        } catch (error) {
          const err = error as Error;
          setNameError(err.message || "Name update failed");
          hasError = true;
        }
      }

      setIsSaving(false);

      if (!hasError) {
        let savedStrArr = [];
        if (nameChanged) savedStrArr.push("Name");
        if (priceChanged) savedStrArr.push("Price");
        if (costChanged) savedStrArr.push("Unit Cost");
        
        const savedStrFormatted = savedStrArr.join(", ");
        setSuccessMessage(savedStrFormatted ? `Successfully updated ${savedStrFormatted}.` : "Your updates have been applied.");

        setOriginalData(currentData);
        setShowSuccessOverlay(true);
        setTimeout(() => {
          setShowSuccessOverlay(false);
          handleRescan();
        }, 2500);
      }
    } catch (error: unknown) {
       console.error(error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleRescan = () => {
    setMode("scan");
    setRequestPayload(null);
    setResponseData(null);
  };

  const renderScanScreen = () => (
    <div className="space-y-8">
      <div className="text-center space-y-2">
        <div className="mx-auto w-16 h-16 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mb-4">
          <PackageSearch size={32} />
        </div>
        <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Scan Item (V2 Test)</h1>
        <p className="text-gray-500 text-sm">Scan a barcode or enter the item ID manually to view details.</p>
      </div>

      <div className="space-y-6">
        <BarcodeScanner onScanSuccess={(code) => fetchItemDetails(code)} />

        <div className="relative flex items-center py-2">
          <div className="flex-grow border-t border-gray-100"></div>
          <span className="flex-shrink-0 mx-4 text-gray-400 text-sm font-medium">OR</span>
          <div className="flex-grow border-t border-gray-100"></div>
        </div>

        <form onSubmit={(e) => fetchItemDetails(manualCode, e)} className="space-y-4">
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
              placeholder="Enter item ID..."
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

          <button
            type="button"
            onClick={() => fetchItemDetails("005056184632")}
            className="w-full flex items-center justify-center space-x-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-medium py-4 px-6 rounded-2xl transition-all active:scale-[0.98]"
          >
            <span>Load Sample Data (No API)</span>
          </button>
        </form>
      </div>
    </div>
  );

  const renderEditScreen = () => {
    if (!currentData || !originalData) return null;
    
    const nameChanged = originalData.itemName !== currentData.itemName;
    const priceChanged = originalData.pricePL1 !== currentData.pricePL1;
    const costChanged = originalData.lastCost !== currentData.lastCost;
    const anyChanged = nameChanged || priceChanged || costChanged;

    const caseCostVal = (parseFloat(currentData.defaultSupplierUnitQty || "0") * parseFloat(currentData.lastCost || "0"));
    const caseCostFormatted = !isNaN(caseCostVal) ? caseCostVal.toFixed(2) : "0.00";

    return (
      <div className="space-y-6 flex flex-col h-full">
        {/* Header inline for inspector mode */}
        <header className="border-b border-gray-200 pb-4 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <button onClick={handleRescan} className="p-2 text-gray-400 hover:text-gray-900 bg-gray-100 hover:bg-gray-200 rounded-full transition-all">
              <ArrowLeft size={20} />
            </button>
            <h1 className="text-xl font-bold tracking-tight text-gray-900">Edit Item</h1>
          </div>
          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={() => {
                let savedStrArr = [];
                const nC = originalData.itemName !== currentData.itemName;
                const pC = originalData.pricePL1 !== currentData.pricePL1;
                const cC = originalData.lastCost !== currentData.lastCost;
                if (nC) savedStrArr.push("Name");
                if (pC) savedStrArr.push("Price");
                if (cC) savedStrArr.push("Unit Cost");
                const savedStrFormatted = savedStrArr.join(", ");
                setSuccessMessage(savedStrFormatted ? `Successfully updated ${savedStrFormatted}.` : "Your updates have been applied.");

                setIsSaving(true);
                setTimeout(() => {
                  setIsSaving(false);
                  setShowSuccessOverlay(true);
                  setTimeout(() => {
                    setShowSuccessOverlay(false);
                    handleRescan();
                  }, 2500);
                }, 500);
              }}
              disabled={isSaving}
              className="flex items-center space-x-1.5 px-3 py-2 bg-purple-100 text-purple-700 hover:bg-purple-200 rounded-xl font-medium text-sm transition-all"
              title="Simulate successful save"
            >
              <span className="inline">Test Save</span>
            </button>
            <button
              onClick={handleRescan}
              disabled={isSaving}
              className="flex items-center space-x-1.5 px-3 py-2 bg-gray-100 text-gray-700 hover:bg-gray-200 rounded-xl font-medium text-sm transition-all"
            >
              <Scan size={14} />
              <span className="inline">Rescan</span>
            </button>
            <button
              onClick={handleSaveChanges}
              disabled={!anyChanged || isSaving}
              className="flex items-center space-x-1.5 px-4 py-2 bg-blue-600 text-white hover:bg-blue-700 disabled:bg-gray-300 disabled:text-gray-500 rounded-xl font-medium text-sm transition-all"
            >
              <Save size={14} />
              <span className="inline">{isSaving ? "Saving..." : "Save Changes"}</span>
            </button>
          </div>
        </header>

        {/* Edit fields */}
        <section className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm space-y-4">
          <h2 className="text-xs font-bold uppercase tracking-widest text-blue-600 border-b border-gray-50 pb-2">Editable Fields</h2>
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Item ID</label>
            <div className="relative">
              <input
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                value={currentData.itemId}
                onChange={(e) => setCurrentData({ ...currentData, itemId: e.target.value.replace(/\D/g, "") })}
                className="block w-full px-3 py-2 border border-gray-300 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm pr-10"
              />
              <button
                onClick={() => {
                  if (originalData.itemId !== currentData.itemId) {
                    fetchItemDetails(currentData.itemId.trim());
                  }
                }}
                disabled={originalData.itemId === currentData.itemId}
                className={`absolute right-1.5 top-1/2 -translate-y-1/2 p-1.5 rounded-lg transition-all ${
                  originalData.itemId !== currentData.itemId
                    ? "bg-blue-100 text-blue-600 hover:bg-blue-200"
                    : "text-gray-400 bg-transparent disabled:opacity-50"
                }`}
                title="Search new Item ID"
              >
                <Search size={16} />
              </button>
            </div>
            <div className="text-xs pt-1">
              {originalData.itemId !== currentData.itemId ? (
                <div className="flex items-center text-blue-600 font-medium">
                  <Search size={14} className="mr-1" />
                  <span>Click search to load item: {currentData.itemId}</span>
                </div>
              ) : null}
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Description</label>
            <input
              type="text"
              value={currentData.itemName}
              onChange={(e) => {
                setCurrentData({ ...currentData, itemName: e.target.value });
                setNameError("");
              }}
              className={`block w-full px-3 py-2 border rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:border-transparent transition-all text-sm bg-white shadow-sm ${
                nameError ? "border-red-500 focus:ring-red-500" : "border-gray-300 focus:ring-blue-500"
              }`}
            />
            {nameError && (
              <div className="text-sm pt-1 text-red-500 font-medium flex items-center">
                <XCircle size={16} className="mr-1.5" />
                <span>{nameError}</span>
              </div>
            )}
            {!nameError && (
              <div className="text-xs pt-1">
                {nameChanged ? (
                  <div className="flex items-center text-green-600 font-medium">
                    <CheckCircle2 size={14} className="mr-1" />
                    <span>Will update to: {currentData.itemName}</span>
                  </div>
                ) : (
                   <div className="flex items-center text-gray-400">
                    <XCircle size={14} className="mr-1" /><span>No changes detected</span>
                  </div>
                )}
              </div>
            )}
          </div>
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
              className={`block w-full px-3 py-2 border rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:border-transparent transition-all text-sm bg-white shadow-sm ${
                priceError ? "border-red-500 focus:ring-red-500" : "border-gray-300 focus:ring-blue-500"
              }`}
            />
            {priceError && (
              <div className="text-sm pt-1 text-red-500 font-medium flex items-center">
                <XCircle size={16} className="mr-1.5" />
                <span>{priceError}</span>
              </div>
            )}
            {!priceError && (
              <div className="text-xs pt-1">
                {priceChanged ? (
                  <div className="flex items-center text-green-600 font-medium">
                    <CheckCircle2 size={14} className="mr-1" />
                    <span>Will update to: ${currentData.pricePL1}</span>
                  </div>
                ) : (
                  <div className="flex items-center text-gray-400">
                    <XCircle size={14} className="mr-1" /><span>No changes detected</span>
                  </div>
                )}
              </div>
            )}
          </div>
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
              className={`block w-full px-3 py-2 border rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:border-transparent transition-all text-sm bg-white shadow-sm ${
                costError ? "border-red-500 focus:ring-red-500" : "border-gray-300 focus:ring-blue-500"
              }`}
            />
            {costError && (
              <div className="text-sm pt-1 text-red-500 font-medium flex items-center">
                <XCircle size={16} className="mr-1.5" />
                <span>{costError}</span>
              </div>
            )}
            {!costError && (
              <div className="text-xs pt-1">
                {costChanged ? (
                  <div className="flex items-center text-green-600 font-medium">
                    <CheckCircle2 size={14} className="mr-1" />
                    <span>Will update to: ${currentData.lastCost}</span>
                  </div>
                ) : (
                  <div className="flex items-center text-gray-400">
                    <XCircle size={14} className="mr-1" /><span>No changes detected</span>
                  </div>
                )}
              </div>
            )}
          </div>
        </section>

        <section className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm space-y-4">
          <h2 className="text-xs font-bold uppercase tracking-widest text-gray-400 border-b border-gray-50 pb-2">Read-Only Info</h2>
          <div className="grid grid-cols-2 gap-3">
            {[
              { label: "Supplier", val: currentData.defaultSupplier || "-" },
              { label: "Supplier ID", val: currentData.defaultSupplierUnitId || "-" },
              { label: "Case Qty", val: currentData.defaultSupplierUnitQty || "0" },
              { label: "Case Cost", val: `$${caseCostFormatted}` },
            ].map((f, i) => (
              <div key={i} className="space-y-1">
                <label className="text-[10px] font-semibold text-gray-500 uppercase">{f.label}</label>
                <input type="text" value={f.val} disabled className="block w-full px-2 py-1.5 border border-gray-100 rounded-lg text-gray-500 text-xs bg-gray-50" />
              </div>
            ))}
          </div>
        </section>
      </div>
    );
  };

  return (
    <main className="min-h-screen flex items-center justify-center p-4 bg-gray-50 flex-col py-12">
      <div className="w-full max-w-xl mx-auto">
        
        {/* Dynamic Form Container */}
        <div className="bg-white rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] sm:p-8 p-6 flex flex-col justify-start h-fit">
          {mode === "scan" ? renderScanScreen() : renderEditScreen()}
        </div>

        {/* Success Overlay */}
        {showSuccessOverlay && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm transition-all text-center">
            <div className="bg-white px-8 py-10 rounded-3xl shadow-xl flex flex-col items-center space-y-4 animate-in fade-in zoom-in duration-300 transform scale-100 max-w-sm w-full mx-4">
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

        {/* Right Postman-style Inspector Container */}
        <div className="hidden">
          <div className="space-y-2">
            <h2 className="text-white font-bold text-lg mb-4 flex items-center justify-between">
              <div className="flex items-center">
                <div className="w-3 h-3 rounded-full bg-green-500 mr-2"></div>
                Network Inspector
              </div>
            {requestPayload && mode === "scan" && (
              <button
                type="button"
                onClick={(e) => fetchItemDetails(manualCode, e)}
                disabled={isFetching}
                className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-700 disabled:text-gray-400 text-white font-medium py-1.5 px-4 rounded-lg transition-all text-xs"
              >
                {isFetching ? "Sending..." : "GET Again"}
              </button>
            )}
            {requestPayload && mode === "edit" && (
              <button
                type="button"
                onClick={handleSaveChanges}
                disabled={isSaving}
                className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-700 disabled:text-gray-400 text-white font-medium py-1.5 px-4 rounded-lg transition-all text-xs"
              >
                {isSaving ? "Sending..." : "POST Again"}
              </button>
            )}
          </h2>

          <div className="bg-gray-800 p-4 rounded-xl border border-gray-700 space-y-4 mb-4">
             <h3 className="text-gray-400 font-semibold uppercase tracking-wider text-xs">Request Config</h3>
             <div className="grid grid-cols-1 gap-3">
               <div className="space-y-1.5">
                 <label className="text-xs text-gray-400">Base URL</label>
                 <select 
                   value={baseUrlOption}
                   onChange={(e) => setBaseUrlOption(e.target.value)}
                   className="block w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg text-gray-200 focus:outline-none focus:border-blue-500 text-xs"
                 >
                   <option value="https://25deb.catapultweboffice.com">https://25deb.catapultweboffice.com</option>
                   <option value="http://192.168.0.81">http://192.168.0.81</option>
                   <option value="custom">Custom...</option>
                 </select>
               </div>
               {baseUrlOption === "custom" && (
                 <div className="space-y-1.5">
                  <label className="text-xs text-gray-400">Custom URL</label>
                  <input
                    type="text"
                    value={customBaseUrl}
                    onChange={(e) => setCustomBaseUrl(e.target.value)}
                    placeholder="http://your-custom-url.com"
                    className="block w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg text-gray-200 focus:outline-none focus:border-blue-500 text-xs"
                  />
                 </div>
               )}
               <div className="space-y-1.5">
                 <label className="text-xs text-gray-400">API Key</label>
                 <input
                   type="text"
                   value={apiKey}
                   onChange={(e) => setApiKey(e.target.value)}
                   className="block w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg text-gray-200 focus:outline-none focus:border-blue-500 text-xs"
                 />
               </div>
             </div>
          </div>

          <h3 className="text-gray-400 font-semibold uppercase tracking-wider text-xs">Request Payload</h3>
          <div className="bg-gray-950 p-4 rounded-xl overflow-x-auto border border-gray-800">
            {requestPayload ? (
              <pre>{JSON.stringify(requestPayload, null, 2)}</pre>
            ) : (
              <span className="text-gray-600 italic">No request sent yet...</span>
            )}
          </div>
        </div>

        <div className="space-y-2">
          <h3 className="text-gray-400 font-semibold uppercase tracking-wider text-xs flex items-center space-x-2">
            <span>Response Data</span>
            {responseData?.status && (
              <span className={`px-2 py-0.5 rounded-full text-[10px] ${(responseData.status ?? 0) >= 200 && (responseData.status ?? 0) < 300 ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                {responseData.status} {responseData.statusText}
              </span>
            )}
          </h3>
          <div className="bg-gray-950 p-4 rounded-xl overflow-x-auto border border-gray-800 h-64 overflow-y-auto">
            {isFetching || isSaving ? (
              <span className="text-blue-400 animate-pulse">Waiting for response...</span>
            ) : responseData ? (
              <pre className={(responseData.status ?? 0) >= 400 || responseData.error ? "text-red-400" : "text-green-400"}>
                {JSON.stringify(responseData, null, 2)}
              </pre>
            ) : (
              <span className="text-gray-600 italic">No response yet. Send a request to see the raw API data!</span>
            )}
          </div>
        </div>
        </div>
      </div>
    </main>
  );
}
