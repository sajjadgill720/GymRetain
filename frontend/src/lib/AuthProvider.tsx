'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { api } from '../lib/api';

export interface GymInfo {
  id: string;
  name: string;
  slug: string;
  city: string;
  currency: string;
  timezone?: string;
  status?: string;
}

export interface UserInfo {
  id: string;
  email: string;
  name: string;
  phone?: string;
  role: string;
}

interface AuthContextValue {
  user: UserInfo | null;
  gyms: GymInfo[];
  activeGym: GymInfo | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  /** Switch the active gym (only meaningful if user is linked to multiple gyms). */
  switchGym: (gymId: string) => void;
  /** Hydrate auth state from login response or /auth/me. */
  setAuthFromLogin: (data: { user: UserInfo; gymId: string; gymName: string; gymSlug: string }) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue>({
  user: null,
  gyms: [],
  activeGym: null,
  isLoading: true,
  isAuthenticated: false,
  switchGym: () => {},
  setAuthFromLogin: () => {},
  logout: () => {},
});

export const useAuth = () => useContext(AuthContext);

const STORAGE_KEY_USER = 'gymretain_user';
const STORAGE_KEY_GYMS = 'gymretain_gyms';
const STORAGE_KEY_ACTIVE_GYM = 'gymretain_active_gym';

/**
 * AuthProvider hydrates user + gym context from:
 * 1. localStorage (persisted from login response), then
 * 2. GET /auth/me (server-validated refresh) if a JWT token exists.
 *
 * For demo mode (no backend running), falls back to the first
 * gym returned from the login response stored in localStorage.
 */
export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserInfo | null>(null);
  const [gyms, setGyms] = useState<GymInfo[]>([]);
  const [activeGym, setActiveGym] = useState<GymInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Hydrate from localStorage on mount
  useEffect(() => {
    try {
      const storedUser = localStorage.getItem(STORAGE_KEY_USER);
      const storedGyms = localStorage.getItem(STORAGE_KEY_GYMS);
      const storedActiveGym = localStorage.getItem(STORAGE_KEY_ACTIVE_GYM);

      if (storedUser) setUser(JSON.parse(storedUser));
      if (storedGyms) {
        const parsed = JSON.parse(storedGyms);
        setGyms(parsed);
      }
      if (storedActiveGym) {
        const parsed = JSON.parse(storedActiveGym);
        setActiveGym(parsed);
        // Sync with api client
        api.setGym(parsed);
      }
    } catch {
      // Ignore corrupt localStorage
    }

    // Try to refresh from /auth/me if token exists
    refreshFromServer().finally(() => setIsLoading(false));
  }, []);

  const refreshFromServer = async () => {
    try {
      const token = localStorage.getItem('gymretain_token');
      if (!token) return;

      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api/v1'}/auth/me`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        },
      );

      if (!res.ok) return;

      const data = await res.json();
      const meData = data.data || data;

      if (meData.user) {
        setUser(meData.user);
        localStorage.setItem(STORAGE_KEY_USER, JSON.stringify(meData.user));
      }

      if (meData.gyms) {
        setGyms(meData.gyms);
        localStorage.setItem(STORAGE_KEY_GYMS, JSON.stringify(meData.gyms));
      }

      if (meData.activeGym) {
        setActiveGym(meData.activeGym);
        localStorage.setItem(STORAGE_KEY_ACTIVE_GYM, JSON.stringify(meData.activeGym));
        api.setGym(meData.activeGym);
      } else if (meData.gyms && meData.gyms.length > 0) {
        const currentActive = localStorage.getItem(STORAGE_KEY_ACTIVE_GYM);
        let selected = meData.gyms[0];
        if (currentActive) {
          try {
            const parsed = JSON.parse(currentActive);
            const found = meData.gyms.find((g: GymInfo) => g.id === parsed.id);
            if (found) selected = found;
          } catch {
            // Ignore
          }
        }
        setActiveGym(selected);
        localStorage.setItem(STORAGE_KEY_ACTIVE_GYM, JSON.stringify(selected));
        api.setGym(selected);
      } else {
        setActiveGym(null);
        localStorage.removeItem(STORAGE_KEY_ACTIVE_GYM);
      }
    } catch {
      // Backend not reachable — stay with localStorage data or demo defaults
    }
  };

  const switchGym = useCallback(
    async (gymId: string) => {
      try {
        const token = localStorage.getItem('gymretain_token');
        if (token) {
          const res = await fetch(
            `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api/v1'}/auth/switch-gym`,
            {
              method: 'POST',
              headers: {
                Authorization: `Bearer ${token}`,
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({ gymId }),
            },
          );

          if (res.ok) {
            const data = await res.json();
            const payload = data.data || data;

            if (payload.token) {
              api.setToken(payload.token);
              localStorage.setItem('gymretain_token', payload.token);
            }
            if (payload.activeGym) {
              setActiveGym(payload.activeGym);
              localStorage.setItem(STORAGE_KEY_ACTIVE_GYM, JSON.stringify(payload.activeGym));
              api.setGym(payload.activeGym);
            }
            if (payload.user) {
              setUser(payload.user);
              localStorage.setItem(STORAGE_KEY_USER, JSON.stringify(payload.user));
            }

            // Immediately reload view so no stale tenant data from previous gym is retained
            if (typeof window !== 'undefined') {
              window.location.reload();
            }
            return;
          }
        }
      } catch (err) {
        console.error('Server switchGym failed, falling back:', err);
      }

      // Offline / demo fallback
      const target = gyms.find((g) => g.id === gymId);
      if (target) {
        setActiveGym(target);
        localStorage.setItem(STORAGE_KEY_ACTIVE_GYM, JSON.stringify(target));
        api.setGym(target);
        if (typeof window !== 'undefined') {
          window.location.reload();
        }
      }
    },
    [gyms],
  );

  const setAuthFromLogin = useCallback(
    (data: {
      user: UserInfo;
      gymId: string;
      gymName: string;
      gymSlug: string;
      token?: string;
      gyms?: GymInfo[];
    }) => {
      if (data.token) {
        api.setToken(data.token);
        localStorage.setItem('gymretain_token', data.token);
      }

      setUser(data.user);
      localStorage.setItem(STORAGE_KEY_USER, JSON.stringify(data.user));

      const gymList: GymInfo[] =
        data.gyms && data.gyms.length > 0
          ? data.gyms
          : data.gymId
          ? [
              {
                id: data.gymId,
                name: data.gymName,
                slug: data.gymSlug,
                city: '',
                currency: 'PKR',
              },
            ]
          : [];

      setGyms(gymList);
      localStorage.setItem(STORAGE_KEY_GYMS, JSON.stringify(gymList));

      if (gymList.length > 0) {
        setActiveGym(gymList[0]);
        localStorage.setItem(STORAGE_KEY_ACTIVE_GYM, JSON.stringify(gymList[0]));
        api.setGym(gymList[0]);
      } else {
        setActiveGym(null);
        localStorage.removeItem(STORAGE_KEY_ACTIVE_GYM);
      }
    },
    [],
  );

  const logout = useCallback(() => {
    setUser(null);
    setGyms([]);
    setActiveGym(null);
    api.clearToken();
    localStorage.removeItem(STORAGE_KEY_USER);
    localStorage.removeItem(STORAGE_KEY_GYMS);
    localStorage.removeItem(STORAGE_KEY_ACTIVE_GYM);
    localStorage.removeItem('gymretain_token');
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        gyms,
        activeGym,
        isLoading,
        isAuthenticated: !!user,
        switchGym,
        setAuthFromLogin,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
