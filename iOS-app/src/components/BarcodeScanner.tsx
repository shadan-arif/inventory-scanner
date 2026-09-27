import React, { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, Alert, Pressable, StyleSheet, Text, View } from "react-native";
import { CameraView, useCameraPermissions } from "expo-camera";
import { AlertCircle, Camera, Flashlight, Focus, Minus, Plus, X, Zap } from "lucide-react-native";
import { scannerLogger } from "../services/logger";

const SUPPORTED_BARCODE_TYPES = [
  "qr",
  "ean13",
  "ean8",
  "upc_a",
  "upc_e",
  "code128",
  "code39",
  "code93",
  "itf14",
  "codabar",
  "pdf417",
  "aztec",
  "datamatrix"
] as const;

export function BarcodeScanner({ color, onScan }: { color: string; onScan: (value: string) => void }) {
  const [permission, requestPermission] = useCameraPermissions();
  const [open, setOpen] = useState(false);
  const [scanned, setScanned] = useState(false);
  const [torch, setTorch] = useState(false);
  const [zoom, setZoom] = useState(0);
  const [focusLock, setFocusLock] = useState(false);
  const [cameraReady, setCameraReady] = useState(false);
  const [lastScannedRaw, setLastScannedRaw] = useState<string | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);

  const isScanningLockedRef = React.useRef(false);
  const lastScannedTimestampRef = React.useRef(0);

  useEffect(() => {
    scannerLogger.info("Camera", "BarcodeScanner initialized", {
      permissionGranted: permission?.granted,
      permissionCanAskAgain: permission?.canAskAgain,
      permissionStatus: permission?.status,
    });
  }, [permission]);

  const begin = async () => {
    scannerLogger.info("Camera", "User pressed 'Open scanner'");
    setCameraError(null);
    try {
      if (!permission?.granted) {
        scannerLogger.info("Camera", "Requesting camera permission...");
        const result = await requestPermission();
        scannerLogger.info("Camera", "Permission request result", result);
        if (!result.granted) {
          const err = "Camera permission denied by user.";
          scannerLogger.error("Camera", err, result);
          setCameraError(err);
          Alert.alert("Camera Permission Required", "Please grant camera access in Settings to use the barcode scanner.");
          return;
        }
      }
      isScanningLockedRef.current = false;
      setScanned(false);
      setCameraReady(false);
      setOpen(true);
      scannerLogger.info("Camera", "Camera view opened successfully");
    } catch (e: any) {
      const msg = e?.message || "Unknown error opening camera";
      scannerLogger.error("Camera", "Failed to start camera", { error: msg, stack: e?.stack });
      setCameraError(msg);
      Alert.alert("Scanner Error", msg);
    }
  };

  const close = () => {
    scannerLogger.info("Camera", "Scanner closed");
    isScanningLockedRef.current = false;
    setOpen(false);
    setTorch(false);
    setZoom(0);
    setFocusLock(false);
    setCameraReady(false);
  };

  const refocus = useCallback(() => {
    scannerLogger.info("Camera", "Manual focus triggered");
    setFocusLock(true);
    setTimeout(() => setFocusLock(false), 800);
  }, []);

  const adjustZoom = (amount: number) => {
    setZoom((current) => {
      const next = Math.max(0, Math.min(0.75, Number((current + amount).toFixed(2))));
      scannerLogger.info("Camera", `Zoom adjusted to ${Math.round(1 + next * 4)}x (${next})`);
      return next;
    });
  };

  const handleBarcodeScanned = ({ type, data }: { type: string; data: string }) => {
    const now = Date.now();
    // Synchronously guard against rapid sequential camera frame firings
    if (isScanningLockedRef.current || scanned || now - lastScannedTimestampRef.current < 2000) {
      return;
    }
    isScanningLockedRef.current = true;
    lastScannedTimestampRef.current = now;

    scannerLogger.success("BarcodeScanned", `Scanned format: ${type}, Value: "${data}" (Single trigger)`, {
      type,
      data,
      length: data?.length,
      timestamp: new Date().toISOString()
    });
    setLastScannedRaw(data);
    setScanned(true);
    close();
    onScan(data);
  };

  const handleCameraMountError = (error: any) => {
    const errorMsg = error?.message || JSON.stringify(error) || "Camera failed to mount";
    scannerLogger.error("Camera", "Camera mount/runtime error", { error: errorMsg });
    setCameraError(errorMsg);
  };

  if (!open) {
    return (
      <View style={styles.openWrapper}>
        <Pressable onPress={begin} style={[styles.open, { backgroundColor: color }]}>
          <Camera color="#fff" size={20} />
          <Text style={styles.openText}>Open scanner</Text>
        </Pressable>
        {cameraError && (
          <View style={styles.errorInline}>
            <AlertCircle size={14} color="#b42318" />
            <Text style={styles.errorInlineText}>{cameraError}</Text>
          </View>
        )}
      </View>
    );
  }

  return (
    <View style={styles.cameraWrap}>
      <CameraView
        style={styles.camera}
        facing="back"
        autofocus={focusLock ? "on" : "off"}
        enableTorch={torch}
        zoom={zoom}
        barcodeScannerSettings={{
          barcodeTypes: [...SUPPORTED_BARCODE_TYPES],
        }}
        onCameraReady={() => {
          scannerLogger.info("Camera", "Camera hardware ready");
          setCameraReady(true);
        }}
        onMountError={handleCameraMountError}
        onBarcodeScanned={scanned ? undefined : handleBarcodeScanned}
      />
      <View pointerEvents="none" style={styles.dimTop} />
      <View pointerEvents="none" style={styles.dimBottom} />
      <View pointerEvents="none" style={[styles.frame, { borderColor: color }]}>
        <View style={styles.laserLine} />
      </View>
      <View pointerEvents="none" style={styles.guide}>
        <Text style={styles.guideText}>
          {!cameraReady ? "Initializing camera..." : "Align barcode or QR inside frame"}
        </Text>
      </View>

      <Pressable accessibilityLabel="Close camera" onPress={close} style={styles.close}>
        <X size={20} color="#101828" />
      </Pressable>

      <View style={styles.tools}>
        <Pressable accessibilityLabel="Zoom out" onPress={() => adjustZoom(-0.1)} style={styles.tool}>
          <Minus size={19} color="#fff" />
        </Pressable>
        <View style={styles.zoomReadout}>
          <Text style={styles.zoomText}>{Math.round(1 + zoom * 4)}x</Text>
        </View>
        <Pressable accessibilityLabel="Zoom in" onPress={() => adjustZoom(0.1)} style={styles.tool}>
          <Plus size={19} color="#fff" />
        </Pressable>
        <Pressable
          accessibilityLabel="Refocus camera"
          onPress={refocus}
          style={[styles.tool, focusLock && { backgroundColor: color }]}
        >
          <Focus size={19} color="#fff" />
        </Pressable>
        <Pressable
          accessibilityLabel="Toggle torch"
          onPress={() => {
            const next = !torch;
            scannerLogger.info("Camera", `Torch toggled: ${next ? "ON" : "OFF"}`);
            setTorch(next);
          }}
          style={[styles.tool, torch && { backgroundColor: "#f59e0b" }]}
        >
          {torch ? <Zap size={19} color="#fff" fill="#fff" /> : <Flashlight size={19} color="#fff" />}
        </Pressable>
      </View>

      <Text style={styles.tip}>Tip: Try zoom 2x for small shelf barcodes, or tap torch in low light.</Text>
      {scanned && <ActivityIndicator color="#fff" size="large" style={styles.loading} />}
    </View>
  );
}

const styles = StyleSheet.create({
  openWrapper: { gap: 6 },
  open: {
    height: 52,
    borderRadius: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 9,
    shadowColor: "#101828",
    shadowOpacity: 0.16,
    shadowRadius: 10,
    elevation: 3,
  },
  openText: { color: "#fff", fontWeight: "800", fontSize: 15 },
  errorInline: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#fef2f2",
    borderWidth: 1,
    borderColor: "#fecaca",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  errorInlineText: { color: "#b42318", fontSize: 12, fontWeight: "600", flex: 1 },
  cameraWrap: { height: 340, borderRadius: 18, overflow: "hidden", backgroundColor: "#101828" },
  camera: { flex: 1 },
  dimTop: { position: "absolute", top: 0, left: 0, right: 0, height: "24%", backgroundColor: "#00000055" },
  dimBottom: { position: "absolute", bottom: 0, left: 0, right: 0, height: "34%", backgroundColor: "#00000065" },
  frame: {
    position: "absolute",
    left: "6%",
    right: "6%",
    top: "24%",
    height: "42%",
    borderWidth: 2,
    borderRadius: 12,
    backgroundColor: "#ffffff0a",
    justifyContent: "center",
  },
  laserLine: {
    height: 1.5,
    backgroundColor: "#ef4444",
    opacity: 0.8,
    marginHorizontal: 8,
    shadowColor: "#ef4444",
    shadowOpacity: 0.8,
    shadowRadius: 4,
  },
  guide: { position: "absolute", left: 0, right: 0, top: "67%", alignItems: "center" },
  guideText: { color: "#fff", fontWeight: "700", fontSize: 12, textShadowColor: "#000", textShadowRadius: 4 },
  close: {
    position: "absolute",
    right: 12,
    top: 12,
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
  },
  tools: {
    position: "absolute",
    bottom: 38,
    left: 12,
    right: 12,
    flexDirection: "row",
    justifyContent: "center",
    gap: 8,
  },
  tool: {
    height: 40,
    width: 40,
    borderRadius: 20,
    backgroundColor: "#101828cc",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#ffffff35",
  },
  zoomReadout: {
    minWidth: 44,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#101828cc",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#ffffff35",
  },
  zoomText: { color: "#fff", fontWeight: "800", fontSize: 13 },
  tip: {
    position: "absolute",
    bottom: 10,
    left: 16,
    right: 16,
    color: "#ffffffcc",
    fontSize: 11,
    textAlign: "center",
    fontWeight: "600",
  },
  loading: { position: "absolute", alignSelf: "center", top: "45%" },
});

