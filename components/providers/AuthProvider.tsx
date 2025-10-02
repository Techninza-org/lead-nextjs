"use client"

import { createContext, useContext, ReactNode, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { APIError } from 'graphql-hooks';
import { useAtom, useSetAtom } from 'jotai';
import { z } from 'zod';
import { deleteCookie, getCookie, setCookie } from "cookies-next";
import { useToast } from '@/components/ui/use-toast';
import { useGraphql } from './GraphqlProvider';
import { loggedUserSchema } from '@/types/auth';
import { userAtom, userAuthToken } from '@/lib/atom/userAtom';
import { MANAGER, ROOT } from '@/lib/role-constant';

interface AuthContextType {
  handleUserLogin: ({ user, error }: { user: z.infer<typeof loggedUserSchema>, error?: APIError<object> | undefined }) => void;
  logout: () => void;
  isInitialized: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const { toast } = useToast();
  const client = useGraphql();
  const [isInitialized, setIsInitialized] = useState(false);
  const [authToken, setToken] = useAtom(userAuthToken);
  const setUser = useSetAtom(userAtom);
  const router = useRouter();

  // Initialize auth state from cookies
  const initializeAuth = async () => {
    try {
      const userT = getCookie('x-lead-token');
      const userC = getCookie('x-lead-user');

      if (userT && userC) {
        const userData = JSON.parse(String(userC));
        const userToken = JSON.parse(String(userT));

        // Set user data and token in state
        setUser(userData);
        setToken(userToken || authToken);

        // Set authorization header
        client.setHeader('Authorization', `x-lead-token ${userToken || authToken}`);
      } else {
        setUser(null);
        setToken("");
        client.setHeader('Authorization', '');
      }
    } catch (error) {
      console.error('Auth initialization error:', error);
      // Clear invalid auth state
      setUser(null);
      setToken("");
      client.setHeader('Authorization', '');
    } finally {
      setIsInitialized(true);
    }
  };

  // Initialize auth state when component mounts
  useEffect(() => {
    initializeAuth();
  }, []);

  // Update header when token changes
  useEffect(() => {
    if (authToken) {
      client.setHeader('Authorization', `x-lead-token ${authToken}`);
    }
  }, [authToken, client]);

  const handleUserLogin = async ({ user, error }: {
    user: z.infer<typeof loggedUserSchema>,
    error?: APIError<object> | undefined
  }) => {
    if (error) {
      const message = error?.graphQLErrors?.map((e: any) => e.message).join(", ");
      toast({
        title: 'Error',
        description: message || "Something went wrong",
        variant: "destructive"
      });
      return;
    }

    try {
      // Set token first to ensure header is updated before any API calls
      setToken(user.token);
      client.setHeader('Authorization', `x-lead-token ${user.token}`);

      // Set user data and cookies
      setUser(user);
      const expiresDate = new Date();
      expiresDate.setDate(expiresDate.getDate() + 1);
      localStorage.setItem('orgName', "ORG_" + user.name.toUpperCase().trim())
      setCookie('x-lead-user', user, { expires: expiresDate });
      setCookie('x-lead-token', JSON.stringify(user.token), { expires: expiresDate });

      // Handle navigation
      const role = user?.role?.name?.toLowerCase()?.split(" ").join("");
      router.refresh();
      
      // Determine redirect based on role and context
      if (role === 'admin') {
        // System admin (no companyId) goes to admin dashboard
        // Company admin (has companyId) goes to company dashboard
        router.push(user.companyId ? '/dashboard' : '/admin/dashboard');
      } else if (['root', 'manager'].includes(role)) {
        router.push('/dashboard');
      } else {
        router.push('/leads');
      }
    } catch (error) {
      console.error('Login error:', error);
      toast({
        title: 'Error',
        description: "Failed to complete login process",
        variant: "destructive"
      });
    }
  };

  const logout = () => {
    try {
      setUser(null);
      setToken(null);
      client.setHeader('Authorization', '');
      client.cache?.clear();

      deleteCookie('x-lead-user');
      deleteCookie('x-lead-token');

      router.push('/login');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  // Don't render children until auth is initialized
  if (!isInitialized) {
    return null; // Or a loading spinner
  }

  return (
    <AuthContext.Provider value={{ handleUserLogin, logout, isInitialized }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};