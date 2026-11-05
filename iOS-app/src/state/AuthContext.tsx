import React, { createContext, useContext, useEffect, useRef, useState } from "react";
import axios from "axios";
import { AppState, AppStateStatus } from "react-native";
import {
  clearActivity,
  clearToken,
  fetchRemoteBaseUrl,
  getLastActive,
  getSessionTimeout,
  initApiBaseUrl,
  login as requestLogin,
  logout as requestLogout,
  me,
  restoreSession,
  touchActivity,
  User
} from "../services/api";

type Auth = {
  user: User | null;
  loading: boolean;
  /** Notify the context that the user interacted — resets the idle timer. */
  recordActivity: () => void;
  login: (code: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
};

const Context = createContext<Auth | null>(null);

/** Poll interval for the idle-timer check (ms). */
const POLL_MS = 30_000;

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // Idle-timeout bookkeeping (refs so they don't cause re-renders)
  const timeoutMinutesRef = useRef<number>(10);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const appStateRef = useRef<AppStateStatus>(AppState.currentState);

  // ─── Helpers ───────────────────────────────────────────────────────────────

  const doLogout = async () => {
    stopIdleTimer();
    await requestLogout();
    await clearActivity();
    setUser(null);
  };

  const checkIdle = async () => {
    const last = await getLastActive();
    if (last === null) return; // no activity recorded yet — grace period
    const idleMs = Date.now() - last;
    const limitMs = timeoutMinutesRef.current * 60 * 1000;
    if (idleMs >= limitMs) {
      await doLogout();
    }
  };

  const startIdleTimer = () => {
    if (pollRef.current) return; // already running
    pollRef.current = setInterval(checkIdle, POLL_MS);
  };

  const stopIdleTimer = () => {
    if (pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }
  };

  const recordActivity = () => {
    // Fire-and-forget — write timestamp to SecureStore
    touchActivity().catch(() => {});
  };

  // ─── Boot: restore session + wire up idle timer ────────────────────────────

  useEffect(() => {
    (async () => {
      try {
        // First restore or load the active API base URL
        await initApiBaseUrl();
        // Background check for centralized updated API URL
        fetchRemoteBaseUrl().catch(() => {});

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

          // Fetch the admin-configured timeout
          const minutes = await getSessionTimeout().catch(() => 10);
          timeoutMinutesRef.current = minutes;

          // Kick off idle timer if a user is now set
          startIdleTimer();
          recordActivity();
        }
      } catch {
        // Storage reading error — don't crash the app.
      } finally {
        setLoading(false);
      }
    })();

    // AppState listener: when app comes back to foreground, immediately check
    const sub = AppState.addEventListener("change", (nextState: AppStateStatus) => {
      if (appStateRef.current.match(/inactive|background/) && nextState === "active") {
        // App foregrounded — check idle immediately, then restart poll
        checkIdle();
        // Refresh timeout setting in background (admin may have changed it)
        getSessionTimeout()
          .then((m) => { timeoutMinutesRef.current = m; })
          .catch(() => {});
      }
      appStateRef.current = nextState;
    });

    return () => {
      stopIdleTimer();
      sub.remove();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Start/stop timer whenever login state changes
  useEffect(() => {
    if (user) {
      // Fetch latest timeout when user logs in
      getSessionTimeout()
        .then((m) => { timeoutMinutesRef.current = m; })
        .catch(() => {});
      startIdleTimer();
      recordActivity();
    } else {
      stopIdleTimer();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [!!user]);

  // ─── Public auth actions ───────────────────────────────────────────────────

  const login = async (code: string, password: string) => {
    const loggedInUser = await requestLogin(code, password);
    setUser(loggedInUser);
  };

  const logout = async () => {
    await doLogout();
  };

  return (
    <Context.Provider value={{ user, loading, recordActivity, login, logout }}>
      {children}
    </Context.Provider>
  );
}

export function useAuth() {
  const value = useContext(Context);
  if (!value) throw new Error("AuthProvider missing");
  return value;
}
