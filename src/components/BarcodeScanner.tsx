"use client";

import React, { useEffect, useRef, useState } from "react";
import { Html5QrcodeScanner, Html5QrcodeSupportedFormats, Html5QrcodeScanType } from "html5-qrcode";
import { X, Camera } from "lucide-react";

interface BarcodeScannerProps {
  onScanSuccess: (decodedText: string) => void;
  onScanError?: (errorMessage: string) => void;
  onClose?: () => void;
}

const BarcodeScanner: React.FC<BarcodeScannerProps> = ({
  onScanSuccess,
  onScanError,
  onClose,
}) => {
  const [isScanning, setIsScanning] = useState(false);
  const scannerRef = useRef<Html5QrcodeScanner | null>(null);

  useEffect(() => {
    // Only initialize if we want to scan
    if (isScanning && typeof window !== 'undefined') {
      if (!scannerRef.current) {
        scannerRef.current = new Html5QrcodeScanner(
          "reader",
          {
            fps: 10,
            qrbox: { width: 250, height: 250 },
            formatsToSupport: [
              Html5QrcodeSupportedFormats.UPC_A,
              Html5QrcodeSupportedFormats.UPC_E,
              Html5QrcodeSupportedFormats.EAN_13,
              Html5QrcodeSupportedFormats.EAN_8,
              Html5QrcodeSupportedFormats.CODE_128,
              Html5QrcodeSupportedFormats.QR_CODE,
            ],
            supportedScanTypes: [Html5QrcodeScanType.SCAN_TYPE_CAMERA],
          },
          false
        );

        scannerRef.current.render(
          (decodedText) => {
            if (scannerRef.current) {
              scannerRef.current.clear().then(() => {
                onScanSuccess(decodedText);
                setIsScanning(false);
              });
            }
          },
          (errorMessage) => {
            if (onScanError) {
              onScanError(errorMessage);
            }
          }
        );
      }
    } else {
      if (scannerRef.current) {
        scannerRef.current.clear().catch(console.error);
        scannerRef.current = null;
      }
    }

    return () => {
      if (scannerRef.current) {
        scannerRef.current.clear().catch(console.error);
      }
    };
  }, [isScanning, onScanSuccess, onScanError]);

  return (
    <div className="w-full flex justify-center flex-col items-center">
      {!isScanning ? (
        <button
          onClick={() => setIsScanning(true)}
          className="flex items-center justify-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white font-medium py-4 px-6 rounded-2xl w-full transition-all shadow-[0_8px_16px_-6px_rgba(37,99,235,0.4)] active:scale-[0.98] border border-blue-500/20"
        >
          <Camera size={24} />
          <span className="text-lg">Open Camera to Scan</span>
        </button>
      ) : (
        <div className="w-full relative shadow-xl rounded-2xl overflow-hidden bg-white border border-gray-100 p-2">
          <button
            onClick={() => {
              setIsScanning(false);
              if (onClose) onClose();
            }}
            className="absolute top-4 right-4 z-10 p-2 bg-white/80 text-gray-800 rounded-full hover:bg-white shadow-md backdrop-blur-md transition-colors border border-gray-200"
          >
            <X size={20} />
          </button>
          <div id="reader" className="w-full overflow-hidden [&>button]:!bg-blue-600 [&>button]:!text-white [&>button]:!rounded-xl [&>button]:!py-3 [&>button]:!px-6 [&>button]:!font-medium [&>button]:!mt-4 [&>button]:!border-none [&>button]:!shadow-md [&>select]:!p-3 [&>select]:!rounded-xl [&>select]:!border-gray-200 [&>select]:!mt-4 [&>select]:!bg-gray-50 [&>select]:!outline-none [&>select]:focus:!border-blue-500 [&>select]:!shadow-sm"></div>
        </div>
      )}
    </div>
  );
};

export default BarcodeScanner;
