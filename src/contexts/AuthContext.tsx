import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { authApi, AuthResponse } from '@/lib/api';
import { toast } from 'sonner';

export interface User {
  id: string;
  email: string;
  keywords: string[];
  preferences: {
    alertFrequency: string;
    emailNotifications: boolean;
    darkMode: boolean;
  };
}

type AuthStatus = 'loading' | 'authenticated' | 'unauthenticated';

interface AuthContextType {
  user: User | null;
  status: AuthStatus;
  login: (email: string, password: string) => Promise<boolean>;
  signup: (email: string, password: string, firstName?: string, lastName?: string) => Promise<boolean>;
  logout: () => void;
  isAuthenticated: boolean;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [status, setStatus] = useState<AuthStatus>('loading');

  // Validate existing token on mount
  useEffect(() => {
    const validateToken = async () => {
      const token = localStorage.getItem('token');
      
      if (!token) {
        setStatus('unauthenticated');
        return;
      }

      try {
        const userData = await authApi.getMe();
        setUser(userData.user || userData);
        setStatus('authenticated');
      } catch (error) {
        // Token is invalid or expired - clear it
        localStorage.removeItem('token');
        localStorage.removeItem('refreshToken');
        setStatus('unauthenticated');
      }
    };

    validateToken();
  }, []);

  const login = useCallback(async (email: string, password: string): Promise<boolean> => {
    try {
      // Clear any existing tokens before login attempt
      localStorage.removeItem('token');
      localStorage.removeItem('refreshToken');
      
      const response: AuthResponse = await authApi.login({ email, password });
      
      // Store tokens
      localStorage.setItem('token', response.token);
      localStorage.setItem('refreshToken', response.refreshToken);
      
      // Set user state
      setUser(response.user);
      setStatus('authenticated');
      
      toast.success('Welcome back!');
      return true;
    } catch (error) {
      // Error toast is already shown by the API interceptor
      setStatus('unauthenticated');
      return false;
    }
  }, []);

  const signup = useCallback(async (
    email: string, 
    password: string, 
    firstName?: string, 
    lastName?: string
  ): Promise<boolean> => {
    try {
      // Clear any existing tokens before signup attempt
      localStorage.removeItem('token');
      localStorage.removeItem('refreshToken');
      
      const response: AuthResponse = await authApi.signup({ 
        email, 
        password,
        firstName,
        lastName 
      });
      
      // Store tokens
      localStorage.setItem('token', response.token);
      localStorage.setItem('refreshToken', response.refreshToken);
      
      // Set user state
      setUser(response.user);
      setStatus('authenticated');
      
      toast.success('Account created successfully!');
      return true;
    } catch (error) {
      // Error toast is already shown by the API interceptor
      setStatus('unauthenticated');
      return false;
    }
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('token');
    localStorage.removeItem('refreshToken');
    setUser(null);
    setStatus('unauthenticated');
    toast.success('Logged out successfully');
  }, []);

  const value: AuthContextType = {
    user,
    status,
    login,
    signup,
    logout,
    isAuthenticated: status === 'authenticated',
    isLoading: status === 'loading',
  };

  return (
    <AuthContext.Provider value={value}>
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
