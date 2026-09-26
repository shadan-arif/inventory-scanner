import React, { useState } from "react";
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from "react-native";
import { CameraView, useCameraPermissions } from "expo-camera";
import { Camera, X } from "lucide-react-native";

export function BarcodeScanner({ color, onScan }: { color: string; onScan: (value: string) => void }) {
  const [permission, requestPermission] = useCameraPermissions(); const [open, setOpen] = useState(false); const [scanned, setScanned] = useState(false);
  const begin = async () => { if (!permission?.granted) { const result = await requestPermission(); if (!result.granted) return; } setScanned(false); setOpen(true); };
  if (!open) return <Pressable onPress={begin} style={[styles.open, { backgroundColor: color }]}><Camera color="#fff" size={22}/><Text style={styles.openText}>Open Camera to Scan</Text></Pressable>;
  return <View style={styles.cameraWrap}><CameraView style={styles.camera} facing="back" barcodeScannerSettings={{ barcodeTypes: ["qr", "ean13", "ean8", "upc_a", "upc_e", "code128", "code39"] }} onBarcodeScanned={scanned ? undefined : ({ data }) => { setScanned(true); setOpen(false); onScan(data); }} />
    <View style={styles.frame}/><Pressable onPress={() => setOpen(false)} style={styles.close}><X size={20}/></Pressable>{scanned && <ActivityIndicator color="#fff" style={styles.loading}/>}</View>;
}
const styles = StyleSheet.create({ open:{height:54,borderRadius:8,flexDirection:"row",alignItems:"center",justifyContent:"center",gap:10},openText:{color:"#fff",fontWeight:"700",fontSize:16},cameraWrap:{height:280,borderRadius:8,overflow:"hidden",backgroundColor:"#101828"},camera:{flex:1},frame:{position:"absolute",left:"10%",right:"10%",top:"30%",bottom:"30%",borderWidth:2,borderColor:"#fff",borderRadius:8},close:{position:"absolute",right:12,top:12,width:36,height:36,borderRadius:18,backgroundColor:"#fff",alignItems:"center",justifyContent:"center"},loading:{position:"absolute",alignSelf:"center",top:"48%"} });
