'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, Business } from '@/types';
import { authAPI } from '@/lib/api';

interface AuthContextType {
  user: User | null;
  businesses: Business[];
  token: string | null;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, name: string) => Promise<void>;
  logout: () => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const storedToken = localStorage.getItem('token');
    if (storedToken) {
      setToken(storedToken);
      loadUser();
    } else {
      setIsLoading(false);
    }
  }, []);

  const loadUser = async () => {
    try {
      const response = await authAPI.getMe();
      setUser(response.data.user);
      setBusinesses(response.data.businesses || []);
    } catch (error) {
      localStorage.removeItem('token');
      setToken(null);
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (email: string, password: string) => {
    const response = await authAPI.login(email, password);
    const { user, token } = response.data;
    
    setUser(user);
    setToken(token);
    localStorage.setItem('token', token);
    
    // Load businesses after login
    const meResponse = await authAPI.getMe();
    setBusinesses(meResponse.data.businesses || []);
  };

  const register = async (email: string, password: string, name: string) => {
    const response = await authAPI.register(email, password, name);
    const { user, token } = response.data;
    
    setUser(user);
    setToken(token);
    localStorage.setItem('token', token);
    
    // Create first business for new user
    const businessName = `${name}'s Business`;
    await fetch('/api/businesses', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ name: businessName }),
    });
    
    // Load businesses
    const meResponse = await authAPI.getMe();
    setBusinesses(meResponse.data.businesses || []);
  };

  const logout = () => {
    setUser(null);
    setBusinesses([]);
    setToken(null);
    localStorage.removeItem('token');
  };

  return (
    <AuthContext.Provider value={{ user, businesses, token, login, register, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
