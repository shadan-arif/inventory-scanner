"use client";

import React, { useState } from "react";
import { X, Play, Loader2, CheckCircle2, XCircle, ChevronDown, ChevronUp, Pencil } from "lucide-react";

interface PeriodDebug {
  label: string;
  url: string;
  params: Record<string, string | number>;
  status: "success" | "error";
  httpStatus?: number;
  error?: string;
  rawResponsePreview?: string;
  qtySold: number;
  durationMs: number;
}

interface DebugOverrides {
  baseUrl: string;
  apiKey: string;
  itemId: string;
  start7: string;
  start14: string;
  start30: string;
  endDate: string;
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
  itemId: string;
}

function getDateOffset(daysBack: number): string {
  const d = new Date();
  d.setDate(d.getDate() - daysBack);
  return d.toISOString().split("T")[0];
}

export default function BuyerDebugModal({ isOpen, onClose, itemId }: Props) {
  const [debugData, setDebugData] = useState<PeriodDebug[] | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [fetchError, setFetchError] = useState("");
  const [expandedIdx, setExpandedIdx] = useState<number | null>(null);
  const [showEditor, setShowEditor] = useState(false);

  const [overrides, setOverrides] = useState<DebugOverrides>({
    baseUrl: "https://25deb.catapultweboffice.com",
    apiKey: "TYKJEJ1TPY2G82C2REG1UWUE0GV2JK4F",
    itemId: itemId,
    start7: getDateOffset(7),
    start14: getDateOffset(14),
    start30: getDateOffset(30),
    endDate: getDateOffset(1),
  });

  const fireDebugCall = async () => {
    setIsLoading(true);
    setFetchError("");
    setDebugData(null);
    setExpandedIdx(null);
    try {
      const p = new URLSearchParams({
        itemId: overrides.itemId,
        debug: "true",
        baseUrl: overrides.baseUrl,
        apiKey: overrides.apiKey,
        start7: overrides.start7,
        start14: overrides.start14,
        start30: overrides.start30,
        endDate: overrides.endDate,
      });
      const res = await fetch(`/api/buyer-sales?${p.toString()}`);
      const json = await res.json();
      if (json.debug) {
        setDebugData(json.debug);
      } else {
        setFetchError("No debug data returned");
      }
    } catch (err: any) {
      setFetchError(err.message || "Fetch failed");
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  const statusIcon = (s: string) =>
    s === "success" ? (
      <CheckCircle2 size={16} className="text-green-500" />
    ) : (
      <XCircle size={16} className="text-red-500" />
    );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4" onClick={onClose}>
      <div
        className="bg-white w-full max-w-2xl max-h-[90vh] rounded-2xl shadow-2xl flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <h2 className="text-lg font-bold text-gray-900">API Debug Inspector</h2>
          <button onClick={onClose} className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors">
            <X size={20} className="text-gray-500" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
          {/* Editor toggle */}
          <button
            onClick={() => setShowEditor(!showEditor)}
            className="flex items-center space-x-2 text-sm font-medium text-violet-600 hover:text-violet-800 transition-colors"
          >
            <Pencil size={14} />
            <span>{showEditor ? "Hide" : "Edit"} API Parameters</span>
          </button>

          {showEditor && (
            <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 space-y-3 text-sm">
              {([
                ["Base URL", "baseUrl"],
                ["API Key", "apiKey"],
                ["Item ID", "itemId"],
                ["Start 7d", "start7"],
                ["Start 14d", "start14"],
                ["Start 30d", "start30"],
                ["End Date", "endDate"],
              ] as [string, keyof DebugOverrides][]).map(([lbl, key]) => (
                <div key={key} className="flex items-center gap-3">
                  <label className="w-24 text-xs font-semibold text-gray-500 shrink-0">{lbl}</label>
                  <input
                    value={overrides[key]}
                    onChange={(e) => setOverrides({ ...overrides, [key]: e.target.value })}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-gray-800 font-mono text-xs focus:outline-none focus:ring-2 focus:ring-violet-400"
                  />
                </div>
              ))}
            </div>
          )}

          {/* Fire button */}
          <button
            onClick={fireDebugCall}
            disabled={isLoading}
            className="w-full flex items-center justify-center space-x-2 bg-violet-600 hover:bg-violet-700 disabled:bg-gray-300 text-white font-medium py-3 rounded-xl transition-all text-sm"
          >
            {isLoading ? <Loader2 size={16} className="animate-spin" /> : <Play size={16} />}
            <span>{isLoading ? "Fetching…" : "Fire API Calls"}</span>
          </button>

          {fetchError && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-sm text-red-700 font-medium">
              {fetchError}
            </div>
          )}

          {/* Results */}
          {debugData && (
            <div className="space-y-3">
              {debugData.map((call, idx) => (
                <div key={idx} className="border border-gray-200 rounded-xl overflow-hidden">
                  {/* Summary row */}
                  <button
                    onClick={() => setExpandedIdx(expandedIdx === idx ? null : idx)}
                    className="w-full flex items-center justify-between px-4 py-3 bg-gray-50 hover:bg-gray-100 transition-colors text-left"
                  >
                    <div className="flex items-center space-x-2">
                      {statusIcon(call.status)}
                      <span className="font-semibold text-sm text-gray-800">{call.label}</span>
                      <span className="text-xs text-gray-400">({call.durationMs}ms)</span>
                    </div>
                    <div className="flex items-center space-x-3">
                      <span className="text-sm font-bold text-gray-900">Qty: {call.qtySold}</span>
                      {expandedIdx === idx ? <ChevronUp size={16} className="text-gray-400" /> : <ChevronDown size={16} className="text-gray-400" />}
                    </div>
                  </button>

                  {/* Expanded detail */}
                  {expandedIdx === idx && (
                    <div className="px-4 py-3 space-y-3 text-xs border-t border-gray-100">
                      <div>
                        <span className="font-bold text-gray-500 uppercase tracking-wider">URL</span>
                        <p className="mt-1 font-mono text-gray-700 break-all">{call.url}</p>
                      </div>
                      <div>
                        <span className="font-bold text-gray-500 uppercase tracking-wider">Params</span>
                        <pre className="mt-1 bg-gray-50 p-2 rounded-lg font-mono text-gray-700 overflow-x-auto">
                          {JSON.stringify(call.params, null, 2)}
                        </pre>
                      </div>
                      {call.httpStatus !== undefined && (
                        <div>
                          <span className="font-bold text-gray-500 uppercase tracking-wider">HTTP Status</span>
                          <p className="mt-1 font-mono text-gray-700">{call.httpStatus}</p>
                        </div>
                      )}
                      {call.error && (
                        <div>
                          <span className="font-bold text-red-500 uppercase tracking-wider">Error</span>
                          <p className="mt-1 font-mono text-red-600">{call.error}</p>
                        </div>
                      )}
                      {call.rawResponsePreview && (
                        <div>
                          <span className="font-bold text-gray-500 uppercase tracking-wider">Raw Response (preview)</span>
                          <pre className="mt-1 bg-gray-50 p-2 rounded-lg font-mono text-[10px] text-gray-600 overflow-x-auto max-h-48 overflow-y-auto whitespace-pre-wrap">
                            {call.rawResponsePreview}
                          </pre>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
