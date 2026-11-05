import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type StaffRole = 'WAITER' | 'KITCHEN' | 'RIDER' | 'MANAGER' | 'CASHIER';

interface AuthContextType {
  user: any | null;
  role: StaffRole | null;
  branchId: string | null;
  token: string | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

import api from '../api/api';
import { Platform } from 'react-native';

const BASE_URL = Platform.OS === 'android' ? 'http://10.0.2.2:5000/api' : 'http://localhost:5000/api';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<any | null>(null);
  const [role, setRole] = useState<StaffRole | null>(null);
  const [branchId, setBranchId] = useState<string | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Restore session on mount
    const restore = async () => {
      const savedToken = await AsyncStorage.getItem('staffToken');
      const savedUser = await AsyncStorage.getItem('staffUser');
      const savedRole = await AsyncStorage.getItem('staffRole');
      const savedBranchId = await AsyncStorage.getItem('staffBranchId');
      if (savedToken && savedUser) {
        setToken(savedToken);
        setUser(JSON.parse(savedUser));
        setRole((savedRole as StaffRole) || null);
        setBranchId(savedBranchId);
      }
      setIsLoading(false);
    };
    restore();
  }, []);

  const login = async (email: string, password: string) => {
    const res = await api.post('/auth/login', { email, password });
    const { accessToken, user: userData } = res.data.data;

    // Determine primary role from user roles
    const primaryRole = userData.roles?.[0]?.name?.toUpperCase() as StaffRole || 'WAITER';
    const userBranchId = userData.employee?.branchId || null;

    await AsyncStorage.setItem('staffToken', accessToken);
    await AsyncStorage.setItem('staffUser', JSON.stringify(userData));
    await AsyncStorage.setItem('staffRole', primaryRole);
    if (userBranchId) await AsyncStorage.setItem('staffBranchId', userBranchId);

    setToken(accessToken);
    setUser(userData);
    setRole(primaryRole);
    setBranchId(userBranchId);
  };

  const logout = async () => {
    await AsyncStorage.multiRemove(['staffToken', 'staffUser', 'staffRole', 'staffBranchId']);
    setToken(null);
    setUser(null);
    setRole(null);
    setBranchId(null);
  };

  return (
    <AuthContext.Provider value={{ user, role, branchId, token, login, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
};
