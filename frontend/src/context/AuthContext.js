import React, { createContext, useCallback, useContext, useEffect, useState } from "react";
import { api, TOKEN_KEY, getErrorMessage } from "@/lib/api";

const USER_KEY = "sunsafe-user";
const AuthContext = createContext(null);

const readStoredUser = () => {
  try {
    const raw = window.localStorage?.getItem(USER_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(readStoredUser);
  const [loading, setLoading] = useState(true);

  const persistSession = useCallback((token, userData) => {
    try {
      window.localStorage?.setItem(TOKEN_KEY, token);
      window.localStorage?.setItem(USER_KEY, JSON.stringify(userData));
    } catch {
      // localStorage unavailable — auth still works for this tab, just won't survive a refresh.
    }
    setUser(userData);
  }, []);

  const clearSession = useCallback(() => {
    try {
      window.localStorage?.removeItem(TOKEN_KEY);
      window.localStorage?.removeItem(USER_KEY);
    } catch {
      // ignore
    }
    setUser(null);
  }, []);

  useEffect(() => {
    let token = null;
    try {
      token = window.localStorage?.getItem(TOKEN_KEY);
    } catch {
      // ignore
    }

    if (!token) {
      setLoading(false);
      return;
    }

    // Validate the stored token against the backend once on mount, in case it
    // expired or the account was removed since the last session.
    api
      .get("/auth/me")
      .then((res) => persistSession(token, res.data))
      .catch(() => clearSession())
      .finally(() => setLoading(false));
  }, []);

  const login = useCallback(
    async (email, password) => {
      try {
        const res = await api.post("/auth/login", { email, password });
        persistSession(res.data.access_token, res.data.user);
        return res.data.user;
      } catch (err) {
        throw new Error(getErrorMessage(err, "Login failed"));
      }
    },
    [persistSession]
  );

  const register = useCallback(
    async (email, password, name) => {
      try {
        const res = await api.post("/auth/register", { email, password, name });
        persistSession(res.data.access_token, res.data.user);
        return res.data.user;
      } catch (err) {
        throw new Error(getErrorMessage(err, "Registration failed"));
      }
    },
    [persistSession]
  );

  const logout = useCallback(() => {
    clearSession();
  }, [clearSession]);

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within an AuthProvider");
  return ctx;
};
