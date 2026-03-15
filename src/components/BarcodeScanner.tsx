"use client";

import React, { useEffect, useRef, useState } from "react";
import { Html5QrcodeScanner } from "html5-qrcode";
import { X, Camera, CheckCircle2 } from "lucide-react";

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
  const [scannedText, setScannedText] = useState<string | null>(null);
  const scannerRef = useRef<Html5QrcodeScanner | null>(null);
  const hasScannedRef = useRef<boolean>(false);

  useEffect(() => {
    // Only initialize if we want to scan
    if (isScanning && typeof window !== 'undefined') {
      hasScannedRef.current = false;
      setScannedText(null);
      
      if (!scannerRef.current) {
        scannerRef.current = new Html5QrcodeScanner(
          "reader",
          {
            fps: 10,
            // Removing qrbox allows scanning the entire video frame, 
            // much easier for long 1D barcodes on mobile devices.
            // Removing formatsToSupport allows scanning all supported barcode types.
            experimentalFeatures: {
              useBarCodeDetectorIfSupported: true
            }
          },
          false
        );

        scannerRef.current.render(
          (decodedText) => {
            if (scannerRef.current && !hasScannedRef.current) {
              hasScannedRef.current = true;
              setScannedText(decodedText);
              
              // Add a small delay so the user can see the success state
              setTimeout(() => {
                if (scannerRef.current) {
                  scannerRef.current.clear().then(() => {
                    onScanSuccess(decodedText);
                    setIsScanning(false);
                    setScannedText(null);
                  }).catch(console.error);
                }
              }, 800);
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
        <div className="w-full relative shadow-xl rounded-2xl overflow-hidden bg-white border border-gray-100 p-2 min-h-[300px]">
          <button
            onClick={() => {
              setIsScanning(false);
              if (onClose) onClose();
            }}
            className="absolute top-4 right-4 z-20 p-2 bg-white/80 text-gray-800 rounded-full hover:bg-white shadow-md backdrop-blur-md transition-colors border border-gray-200"
          >
            <X size={20} />
          </button>
          
          {scannedText && (
            <div className="absolute inset-0 z-10 bg-green-500/90 backdrop-blur-sm flex flex-col items-center justify-center text-white p-6 animate-in fade-in duration-200">
              <CheckCircle2 size={64} className="mb-4 text-white" />
              <h3 className="text-2xl font-bold mb-2">Barcode Scanned!</h3>
              <p className="text-lg text-center break-all opacity-90">{scannedText}</p>
            </div>
          )}

          <div 
            id="reader" 
            className="w-full overflow-hidden 
                       [&_a]:!bg-blue-600 [&_a]:!text-white [&_a]:!rounded-xl [&_a]:!py-3 [&_a]:!px-6 [&_a]:!font-medium [&_a]:!mt-4 [&_a]:!border-none [&_a]:!shadow-md [&_a]:!inline-block [&_a]:!no-underline [&_a]:!cursor-pointer [&_a]:!text-center
                       [&_button]:!bg-blue-600 [&_button]:!text-white [&_button]:!rounded-xl [&_button]:!py-3 [&_button]:!px-6 [&_button]:!font-medium [&_button]:!mt-4 [&_button]:!border-none [&_button]:!shadow-md [&_button]:!cursor-pointer
                       [&_select]:!p-3 [&_select]:!rounded-xl [&_select]:!border-gray-200 [&_select]:!mt-4 [&_select]:!bg-gray-50 [&_select]:!outline-none [&_select]:focus:!border-blue-500 [&_select]:!shadow-sm
                       [&_img]:!max-w-[150px] [&_img]:!mx-auto"
          ></div>
        </div>
      )}
    </div>
  );
};

export default BarcodeScanner;
