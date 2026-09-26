import axios from "axios";
import * as SecureStore from "expo-secure-store";
import { Platform } from "react-native";

// Set EXPO_PUBLIC_API_BASE_URL in .env to point at the shared Next.js API.
// Expo exposes EXPO_PUBLIC_* values in both iOS and Android bundles.
export const BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL || "http://localhost:9000";
const TOKEN_KEY = "lams_session_jwt";
let sessionToken: string | null = null;

async function readStoredToken() {
  if (Platform.OS === "web") return typeof localStorage === "undefined" ? null : localStorage.getItem(TOKEN_KEY);
  return SecureStore.getItemAsync(TOKEN_KEY);
}

async function writeStoredToken(token: string) {
  if (Platform.OS === "web") { localStorage.setItem(TOKEN_KEY, token); return; }
  await SecureStore.setItemAsync(TOKEN_KEY, token);
}

async function removeStoredToken() {
  if (Platform.OS === "web") { localStorage.removeItem(TOKEN_KEY); return; }
  await SecureStore.deleteItemAsync(TOKEN_KEY);
}

export const api = axios.create({ baseURL: BASE_URL, timeout: 15000, withCredentials: true, headers: { "Content-Type": "application/json" } });
api.interceptors.request.use(async (config) => {
  if (Platform.OS === "web") return config;
  const token = sessionToken ?? await readStoredToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
    config.headers.Cookie = `ws_session=${token}`;
  }
  return config;
});

function cookieToken(value: unknown): string | null {
  const raw = Array.isArray(value) ? value.join(";") : String(value || "");
  return raw.match(/ws_session=([^;]+)/)?.[1] ?? null;
}

export function apiErrorMessage(error: unknown) {
  if (!axios.isAxiosError(error)) return error instanceof Error ? error.message : "An unexpected error occurred.";
  const serverMessage = error.response?.data?.message || error.response?.data?.error;
  if (serverMessage) return `HTTP ${error.response?.status}: ${serverMessage}`;
  if (error.response) return `HTTP ${error.response.status}: The server rejected the request.`;
  if (error.request) return `Could not reach ${BASE_URL}. Check that the API server is running and the configured URL is reachable.`;
  return error.message || "Unable to create the request.";
}

export async function login(code: string, password: string) {
  const response = await api.post("/api/auth/login", { code, password });
  // The existing web server sets ws_session as an HttpOnly cookie rather than returning a token body.
  const token = cookieToken(response.headers["set-cookie"] ?? response.headers["Set-Cookie"]);
  // Browsers correctly store HttpOnly cookies, but do not expose Set-Cookie to JavaScript.
  if (!token && Platform.OS === "web") {
    // Marker only: the browser owns the HttpOnly ws_session cookie itself.
    sessionToken = "browser-cookie-session";
    await writeStoredToken(sessionToken);
    return response.data.user as User;
  }
  if (!token) throw new Error("The server did not return a session cookie.");
  sessionToken = token;
  await writeStoredToken(token);
  return response.data.user as User;
}
export async function restoreToken() { sessionToken = await readStoredToken(); return sessionToken; }
export async function clearToken() { sessionToken = null; await removeStoredToken(); }
export async function me() { return (await api.get("/api/auth/me")).data.user as User; }
export async function logout() { try { await api.post("/api/auth/logout"); } finally { await clearToken(); } }

export type Role = "ADMIN" | "EMPLOYEE";
export type User = { id: number; code: string; name: string; role: Role };
export type Item = { itemId: string; itemName: string; pricePL1: string; lastCost: string; defaultSupplier: string; defaultSupplierUnitId: string; defaultSupplierUnitQty: string };
export type Employee = User & { createdAt: string };
export type Sales = { last7Days: { qtySold: number }; last14Days: { qtySold: number }; last30Days: { qtySold: number } };

export async function getItem(itemId: string): Promise<Item> {
  const data = (await api.get("/api/item-search", { params: { itemSearch: itemId } })).data;
  if (!data.success || !data.data) throw new Error(data.message || "Item not found");
  const item = data.data;
  return { ...item, itemId: item.itemId || itemId, itemName: item.itemName || "", pricePL1: item.pricePL1 || item.price || "", lastCost: item.lastCost || "", defaultSupplier: item.defaultSupplier || "", defaultSupplierUnitId: item.defaultSupplierUnitId || "", defaultSupplierUnitQty: item.defaultSupplierUnitQty || "" };
}
export async function getMargin() { return Number((await api.get("/api/wholesale/settings")).data.margin ?? 35); }
export async function putMargin(margin: number) { return (await api.put("/api/wholesale/settings", { margin })).data; }
export async function getSales(itemId: string): Promise<Sales> { return (await api.get("/api/buyer-sales", { params: { itemId } })).data.sales; }
export async function saveItem(original: Item, item: Item) {
  if (original.itemName !== item.itemName) await api.post("/api/updateName", [{ action: "U", itemId: item.itemId, name: item.itemName.trim(), receiptAlias: item.itemName.trim(), nonReturnable: true }]);
  if (original.pricePL1 !== item.pricePL1 || original.lastCost !== item.lastCost) await api.post("/api/updatePriceV2", { zoneName: "Primary Zone", startDate: localDateTime(), itemId: item.itemId, price1: item.pricePL1, cost: item.lastCost || "0" });
}
function localDateTime() { const d = new Date(); const p = (v: number) => String(v).padStart(2, "0"); return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}:${p(d.getSeconds())}`; }
export async function employees() { return (await api.get("/api/admin/employees")).data.employees as Employee[]; }
export async function addEmployee(payload: { name: string; code: string; password: string; role: Role }) { return api.post("/api/admin/employees", payload); }
export async function changePassword(id: number, password: string) { return api.patch(`/api/admin/employees/${id}`, { password }); }
export async function deleteEmployee(id: number) { return api.delete(`/api/admin/employees/${id}`); }
