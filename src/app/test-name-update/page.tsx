"use client";

import React, { useState } from "react";
import toast from "react-hot-toast";

export default function TestNameUpdateScreen() {
  const [itemId, setItemId] = useState("");
  const [newName, setNewName] = useState("");
  const [loading, setLoading] = useState(false);
  
  // States for logging Request and Response
  const [requestPayload, setRequestPayload] = useState<any>(null);
  const [responseData, setResponseData] = useState<any>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!itemId || !newName) {
      toast.error("Please fill in both fields");
      return;
    }

    setLoading(true);
    setResponseData(null); // Clear previous response

    const payload = [
      {
        action: "U",
        itemId: itemId,
        name: newName,
        receiptAlias: newName,
        nonReturnable: true,
      },
    ];

    setRequestPayload({
      url: "https://25deb.catapultweboffice.com/api/batch/itemMaintenance?batch=1&apikey=...",
      method: "POST",
      body: payload
    });

    try {
      const response = await fetch("/api/updateName", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
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
    } catch (error: any) {
      console.error(error);
      toast.error(error.message || "Error updating item name");
      if (!responseData) {
          setResponseData({ error: error.message });
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
              disabled={!itemId || !newName || loading}
              className="w-full flex items-center justify-center space-x-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-200 disabled:text-gray-400 text-white font-medium py-4 px-6 rounded-2xl transition-all active:scale-[0.98] mt-6"
            >
              <span>{loading ? "Sending..." : "Send Request"}</span>
            </button>
          </form>
        </div>

        {/* Postman-style Inspector Container */}
        <div className="bg-gray-900 rounded-3xl shadow-xl sm:p-8 p-6 space-y-6 text-gray-300 font-mono text-xs md:text-sm overflow-hidden flex flex-col h-fit">
          <div className="space-y-2">
            <h2 className="text-white font-bold text-lg mb-4 flex items-center">
              <div className="w-3 h-3 rounded-full bg-green-500 mr-2"></div>
              Network Inspector
            </h2>

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
                <span className={`px-2 py-0.5 rounded-full text-[10px] ${responseData.status >= 200 && responseData.status < 300 ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                  {responseData.status} {responseData.statusText}
                </span>
              )}
            </h3>
            <div className="bg-gray-950 p-4 rounded-xl overflow-x-auto border border-gray-800">
              {loading ? (
                <span className="text-blue-400 animate-pulse">Waiting for response...</span>
              ) : responseData ? (
                <pre className={responseData.status >= 400 || responseData.error ? "text-red-400" : "text-green-400"}>
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
