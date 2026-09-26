import "react-native-gesture-handler";
import React from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { StatusBar } from "expo-status-bar";
import Toast from "react-native-toast-message";
import { AuthProvider, useAuth } from "./src/state/AuthContext";
import { LoginScreen, ModulesScreen, ScannerScreen, WholesaleResultScreen, EditorScreen, WholesaleSettingsScreen, AdminScreen } from "./src/screens/Screens";

export type RootStackParams = {
  Login: undefined;
  Modules: undefined;
  Wholesale: undefined;
  WholesaleResult: { itemId: string };
  WholesaleSettings: undefined;
  V2: undefined;
  V2Edit: { itemId: string };
  Buyer: undefined;
  BuyerView: { itemId: string };
  Admin: undefined;
};

const Stack = createNativeStackNavigator<RootStackParams>();

function Navigator() {
  const { user, loading } = useAuth();
  if (loading) return null;
  return <NavigationContainer><StatusBar style="dark" />
    <Stack.Navigator screenOptions={{ headerShown: false, animation: "slide_from_right" }} initialRouteName={user ? "Modules" : "Login"}>
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="Modules" component={ModulesScreen} />
      <Stack.Screen name="Wholesale">{(props) => <ScannerScreen {...props} mode="wholesale" />}</Stack.Screen>
      <Stack.Screen name="WholesaleResult" component={WholesaleResultScreen} />
      <Stack.Screen name="WholesaleSettings" component={WholesaleSettingsScreen} />
      <Stack.Screen name="V2">{(props) => <ScannerScreen {...props} mode="v2" />}</Stack.Screen>
      <Stack.Screen name="V2Edit">{(props) => <EditorScreen {...props} buyer={false} />}</Stack.Screen>
      <Stack.Screen name="Buyer">{(props) => <ScannerScreen {...props} mode="buyer" />}</Stack.Screen>
      <Stack.Screen name="BuyerView">{(props) => <EditorScreen {...props} buyer />}</Stack.Screen>
      <Stack.Screen name="Admin" component={AdminScreen} />
    </Stack.Navigator>
  </NavigationContainer>;
}

export default function App() { return <AuthProvider><Navigator /><Toast /></AuthProvider>; }
