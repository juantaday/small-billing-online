/**
 * Feature: Authentication
 * Hook para manejar la autenticación del usuario
 */

import { useState, useEffect, createContext, useContext, ReactNode } from 'react';
import { userApi, UserDto, LoginDto } from '@/entities/user';
import { logger } from '@/shared/lib';
import {
  AppRole,
  APP_ROLES,
  canAccessRoute,
  DEFAULT_APP_ROLE,
} from './roles';

const ROLE_STORAGE_KEY = 'small-billing.user-role';

interface AuthContextValue {
  user: UserDto | null;
  role: AppRole;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (credentials: LoginDto) => Promise<void>;
  logout: () => void;
  setRole: (role: AppRole) => void;
  canAccess: (route: string) => boolean;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserDto | null>(null);
  const [role, setRoleState] = useState<AppRole>(DEFAULT_APP_ROLE);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const storedRole = localStorage.getItem(ROLE_STORAGE_KEY) as AppRole | null;
    if (storedRole && APP_ROLES.includes(storedRole)) {
      setRoleState(storedRole);
    }

    const token = localStorage.getItem('accessToken');
    if (token) {
      loadUserProfile();
    } else {
      setIsLoading(false);
    }
  }, []);

  const loadUserProfile = async () => {
    try {
      const userData = await userApi.getProfile();
      setUser(userData);
    } catch (error) {
      logger.error('Error loading profile', error);
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (credentials: LoginDto) => {
    try {
      const response = await userApi.login(credentials);
      
      localStorage.setItem('accessToken', response.tokens.accessToken);
      localStorage.setItem('refreshToken', response.tokens.refreshToken);
      
      setUser(response.user);
    } catch (error) {
      logger.error('Login error', error);
      throw error;
    }
  };

  const logout = () => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    setUser(null);
  };

  const setRole = (nextRole: AppRole) => {
    setRoleState(nextRole);
    localStorage.setItem(ROLE_STORAGE_KEY, nextRole);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        role,
        isAuthenticated: !!user,
        isLoading,
        login,
        logout,
        setRole,
        canAccess: (route: string) => canAccessRoute(role, route),
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}
