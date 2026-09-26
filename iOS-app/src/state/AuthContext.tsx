import React, { createContext, useContext, useEffect, useState } from "react";
import { clearToken, login as requestLogin, logout as requestLogout, me, restoreToken, User } from "../services/api";

type Auth = { user: User | null; loading: boolean; login: (code: string, password: string) => Promise<void>; logout: () => Promise<void> };
const Context = createContext<Auth | null>(null);
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null); const [loading, setLoading] = useState(true);
  useEffect(() => { (async () => { try { if (await restoreToken()) setUser(await me()); } catch { await clearToken(); } finally { setLoading(false); } })(); }, []);
  const login = async (code: string, password: string) => setUser(await requestLogin(code, password));
  const logout = async () => { await requestLogout(); setUser(null); };
  return <Context.Provider value={{ user, loading, login, logout }}>{children}</Context.Provider>;
}
export function useAuth() { const value = useContext(Context); if (!value) throw new Error("AuthProvider missing"); return value; }
