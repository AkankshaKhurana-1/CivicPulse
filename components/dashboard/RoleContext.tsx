'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { User, UserRole } from '@/lib/types';
import { useRouter } from 'next/navigation';

interface RoleContextType {
  role: UserRole;
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  selectedCityId: string;
  setRole: (role: UserRole) => void;
  setSelectedCityId: (cityId: string) => void;
  logout: () => Promise<void>;
  refreshSession: () => Promise<void>;
  switchDemoPersona: (role: UserRole) => Promise<void>;
}

const DEMO_CREDENTIALS: Record<UserRole, { email: string; name: string }> = {
  citizen: { email: 'aarav.sharma@example.com', name: 'Aarav Sharma' },
  officer: { email: 's.gupta@pwd.delhi.gov.in', name: 'Sanjay Gupta' },
  worker: { email: 'rajesh.k@pwd.delhi.gov.in', name: 'Rajesh Kumar' },
  oversight: { email: 'm.iyer@oversight.gov.in', name: 'Dr. Meera Iyer' },
  admin: { email: 'admin@civicpulse.org', name: 'CivicPulse Admin' },
};

const RoleContext = createContext<RoleContextType | undefined>(undefined);

export function RoleProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [role, setRoleState] = useState<UserRole>('citizen');
  const [user, setUser] = useState<User | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [selectedCityId, setSelectedCityId] = useState<string>('city-delhi');

  const refreshSession = useCallback(async () => {
    try {
      const res = await fetch('/api/auth/session', { cache: 'no-store' });
      if (res.ok) {
        const data = await res.json();
        if (data.authenticated && data.user) {
          setUser(data.user);
          setRoleState(data.user.role);
          setIsAuthenticated(true);
          if (data.user.city_id) {
            setSelectedCityId(data.user.city_id);
          }
          setIsLoading(false);
          return;
        }
      }
      // If no active session
      setUser(null);
      setIsAuthenticated(false);
    } catch {
      setUser(null);
      setIsAuthenticated(false);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshSession();
    const savedCity = localStorage.getItem('civic_city');
    if (savedCity) setSelectedCityId(savedCity);
  }, [refreshSession]);

  const switchDemoPersona = async (targetRole: UserRole) => {
    setIsLoading(true);
    try {
      const creds = DEMO_CREDENTIALS[targetRole];
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: creds.email,
          password: 'demo-password',
          role: targetRole,
        }),
      });

      if (res.ok) {
        await refreshSession();
      }
    } catch (e) {
      console.error('Failed to switch demo persona:', e);
    } finally {
      setIsLoading(false);
    }
  };

  const setRole = (newRole: UserRole) => {
    // For backwards compatibility, switching role in demo mode establishes a valid signed session
    switchDemoPersona(newRole);
  };

  const handleSetSelectedCityId = (cityId: string) => {
    setSelectedCityId(cityId);
    localStorage.setItem('civic_city', cityId);
  };

  const logout = async () => {
    setIsLoading(true);
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      setUser(null);
      setIsAuthenticated(false);
      setRoleState('citizen');
      router.push('/login');
    } catch (e) {
      console.error('Logout error:', e);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <RoleContext.Provider
      value={{
        role,
        user,
        isAuthenticated,
        isLoading,
        selectedCityId,
        setRole,
        setSelectedCityId: handleSetSelectedCityId,
        logout,
        refreshSession,
        switchDemoPersona,
      }}
    >
      {children}
    </RoleContext.Provider>
  );
}

export function useRole() {
  const context = useContext(RoleContext);
  if (!context) throw new Error('useRole must be used within a RoleProvider');
  return context;
}
