import React, { createContext, useContext, useEffect, useState } from "react";
import axios from "axios";
import {
  clearToken,
  login as requestLogin,
  logout as requestLogout,
  me,
  restoreSession,
  User
} from "../services/api";

type Auth = {
  user: User | null;
  loading: boolean;
  login: (code: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
};

const Context = createContext<Auth | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const { token, user: cachedUser } = await restoreSession();
        if (token) {
          if (cachedUser) {
            // Show the user immediately from cache — no loading delay
            setUser(cachedUser);
          }
          try {
            const freshUser = await me();
            if (freshUser) {
              setUser(freshUser);
            }
          } catch (err) {
            if (axios.isAxiosError(err) && err.response?.status === 401) {
              if (cachedUser) {
                // We have a cached user but server rejected — the stored token is likely
                // stale (e.g. old format from before the JWT-in-body fix).
                // Clear storage so next open they'll see the login screen properly.
                await clearToken();
                setUser(null);
              } else {
                // No cached user either, definitely not authenticated.
                await clearToken();
                setUser(null);
              }
            }
            // For network errors / timeouts / offline mode, keep the cached user shown.
          }
        }
      } catch {
        // Storage reading error — don't crash the app.
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const login = async (code: string, password: string) => setUser(await requestLogin(code, password));
  const logout = async () => {
    await requestLogout();
    setUser(null);
  };

  return <Context.Provider value={{ user, loading, login, logout }}>{children}</Context.Provider>;
}

export function useAuth() {
  const value = useContext(Context);
  if (!value) throw new Error("AuthProvider missing");
  return value;
}
