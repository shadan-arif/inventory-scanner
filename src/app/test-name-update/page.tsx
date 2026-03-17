"use client";

import React, { useState } from "react";
import toast from "react-hot-toast";

interface RequestPayload {
  url: string;
  method: string;
  body: unknown;
}

interface ResponseData {
  status?: number;
  statusText?: string;
  data?: unknown;
  errorData?: unknown;
  error?: string;
}

export default function TestNameUpdateScreen() {
  const [itemId, setItemId] = useState("733599125013");
  const [newName, setNewName] = useState("");
  const [loading, setLoading] = useState(false);
  
  // Customization States
  const [baseUrlOption, setBaseUrlOption] = useState("https://25deb.catapultweboffice.com");
  const [customBaseUrl, setCustomBaseUrl] = useState("");
  const [customParams, setCustomParams] = useState("batch=1");
  const [apiKey, setApiKey] = useState("TYKJEJ1TPY2G82C2REG1UWUE0GV2JK4F");
  
  const [useCustomPayload, setUseCustomPayload] = useState(false);
  const [customPayloadString, setCustomPayloadString] = useState('[\n  {\n    "action": "U",\n    "itemId": "733599125013",\n    "name": "sdf",\n    "receiptAlias": "sdf",\n    "nonReturnable": true\n  }\n]');

  // States for logging Request and Response
  const [requestPayload, setRequestPayload] = useState<RequestPayload | null>(null);
  const [responseData, setResponseData] = useState<ResponseData | null>(null);

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    
    let payload;
    
    if (useCustomPayload) {
      try {
        payload = JSON.parse(customPayloadString);
      } catch {
        toast.error("Invalid JSON format in custom payload");
        return;
      }
    } else {
      if (!itemId || !newName) {
        toast.error("Please fill in both fields");
        return;
      }
      payload = [
        {
          action: "U",
          itemId: itemId,
          name: newName,
          receiptAlias: newName,
          nonReturnable: true,
        },
      ];
    }

    setLoading(true);
    setResponseData(null); // Clear previous response

    const activeBaseUrl = baseUrlOption === "custom" ? customBaseUrl : baseUrlOption;
    
    // Parse params manually for display
    const finalUrl = `${activeBaseUrl}/api/batch/itemMaintenance?apikey=${apiKey}&${customParams}`;

    setRequestPayload({
      url: finalUrl,
      method: "POST",
      body: payload as unknown
    });

    try {
      const response = await fetch("/api/updateName", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-base-url": activeBaseUrl,
          "x-api-key": apiKey,
          "x-params": customParams
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok) {
        setResponseData({ status: response.status, statusText: response.statusText, errorData: data });
        throw new Error(data.error || "Failed to update name");
      }

      setResponseData({ status: response.status, data: data });
      toast.success("Successfully updated item name!");
    } catch (error: unknown) {
      console.error(error);
      const errorMessage = error instanceof Error ? error.message : "Error updating item name";
      toast.error(errorMessage);
      if (!responseData) {
          setResponseData({ error: errorMessage });
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen flex items-center justify-center p-4 bg-gray-50 flex-col py-12">
      <div className="w-full max-w-4xl grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Form Container */}
        <div className="bg-white rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] sm:p-8 p-6 space-y-8 h-fit">
          <div className="text-center space-y-2">
            <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Test Name Update</h1>
            <p className="text-gray-500 text-sm">Update item name and receipt alias for testing.</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Item ID</label>
              <input
                type="text"
                value={itemId}
                onChange={(e) => setItemId(e.target.value)}
                className="block w-full px-4 py-3 border border-gray-200 rounded-2xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium text-lg bg-gray-50/50"
                placeholder="e.g. 733599125013"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">New Name</label>
              <input
                type="text"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                className="block w-full px-4 py-3 border border-gray-200 rounded-2xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium text-lg bg-gray-50/50"
                placeholder="e.g. BREEEEEE 1"
              />
            </div>
            
            
            <button
              type="submit"
              disabled={(!useCustomPayload && (!itemId || !newName)) || loading}
              className="w-full flex items-center justify-center space-x-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-200 disabled:text-gray-400 text-white font-medium py-4 px-6 rounded-2xl transition-all active:scale-[0.98] mt-6"
            >
              <span>{loading ? "Sending..." : "Send Request"}</span>
            </button>
          </form>
        </div>

        {/* Postman-style Inspector Container */}
        <div className="bg-gray-900 rounded-3xl shadow-xl sm:p-8 p-6 space-y-6 text-gray-300 font-mono text-xs md:text-sm overflow-hidden flex flex-col h-fit">
          <div className="space-y-2">
            <h2 className="text-white font-bold text-lg mb-4 flex items-center justify-between">
              <div className="flex items-center">
                <div className="w-3 h-3 rounded-full bg-green-500 mr-2"></div>
                Network Inspector
              </div>
              {requestPayload && (
                <button
                  type="button"
                  onClick={() => handleSubmit()}
                  disabled={loading}
                  className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-700 disabled:text-gray-400 text-white font-medium py-1.5 px-4 rounded-lg transition-all text-xs"
                >
                  {loading ? "Sending..." : "Post Again"}
                </button>
              )}
            </h2>

            {/* Request Settings Configuration */}
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

                 <div className="space-y-1.5">
                   <label className="text-xs text-gray-400">Parameters</label>
                   <input
                     type="text"
                     value={customParams}
                     onChange={(e) => setCustomParams(e.target.value)}
                     placeholder="e.g. batch=1&other=value"
                     className="block w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg text-gray-200 focus:outline-none focus:border-blue-500 text-xs"
                   />
                 </div>
                 <div className="space-y-1.5 flex flex-col pt-2 border-t border-gray-700">
                   <div className="flex items-center justify-between">
                     <label className="text-xs text-gray-400">Custom Payload</label>
                     <input
                       type="checkbox"
                       checked={useCustomPayload}
                       onChange={(e) => setUseCustomPayload(e.target.checked)}
                       className="rounded border-gray-600 bg-gray-900"
                     />
                   </div>
                   {useCustomPayload ? (
                      <textarea
                        value={customPayloadString}
                        onChange={(e) => setCustomPayloadString(e.target.value)}
                        className="block w-full px-3 py-2 bg-gray-950 border border-gray-700 rounded-lg text-gray-200 focus:outline-none focus:border-blue-500 font-mono text-[10px] h-32"
                      />
                   ) : (
                      <div className="text-[10px] text-gray-500 italic">Using form details (Item ID & New Name). Check box to type manual JSON.</div>
                   )}
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
            <div className="bg-gray-950 p-4 rounded-xl overflow-x-auto border border-gray-800">
              {loading ? (
                <span className="text-blue-400 animate-pulse">Waiting for response...</span>
              ) : responseData ? (
                <pre className={(responseData.status ?? 0) >= 400 || responseData.error ? "text-red-400" : "text-green-400"}>
                  {JSON.stringify(responseData, null, 2)}
                </pre>
              ) : (
                <span className="text-gray-600 italic">No response yet...</span>
              )}
            </div>
          </div>
        </div>

      </div>
    </main>
  );
}
