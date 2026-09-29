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

      if (meData.gyms && meData.gyms.length > 0) {
        setGyms(meData.gyms);
        localStorage.setItem(STORAGE_KEY_GYMS, JSON.stringify(meData.gyms));

        // If no active gym set yet, default to first
        const currentActive = localStorage.getItem(STORAGE_KEY_ACTIVE_GYM);
        if (!currentActive) {
          setActiveGym(meData.gyms[0]);
          localStorage.setItem(STORAGE_KEY_ACTIVE_GYM, JSON.stringify(meData.gyms[0]));
          api.setGym(meData.gyms[0]);
        }
      }
    } catch {
      // Backend not reachable — stay with localStorage data or demo defaults
    }
  };

  const switchGym = useCallback(
    (gymId: string) => {
      const target = gyms.find((g) => g.id === gymId);
      if (target) {
        setActiveGym(target);
        localStorage.setItem(STORAGE_KEY_ACTIVE_GYM, JSON.stringify(target));
        api.setGym(target);
      }
    },
    [gyms],
  );

  const setAuthFromLogin = useCallback(
    (data: { user: UserInfo; gymId: string; gymName: string; gymSlug: string }) => {
      setUser(data.user);
      localStorage.setItem(STORAGE_KEY_USER, JSON.stringify(data.user));

      const gymInfo: GymInfo = {
        id: data.gymId,
        name: data.gymName,
        slug: data.gymSlug,
        city: '',
        currency: 'PKR',
      };
      setGyms([gymInfo]);
      setActiveGym(gymInfo);
      localStorage.setItem(STORAGE_KEY_GYMS, JSON.stringify([gymInfo]));
      localStorage.setItem(STORAGE_KEY_ACTIVE_GYM, JSON.stringify(gymInfo));
      api.setGym(gymInfo);
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
