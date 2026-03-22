"use client";

import {createContext, type PropsWithChildren, useContext, useEffect, useState,} from "react";
import {type User} from "firebase/auth";
import {
    type AuthPersistenceMode,
    authService,
    type LoginCredentials,
    type RegisterCredentials,
} from "@/services/auth.service";

type AuthContextValue = {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (credentials: LoginCredentials) => Promise<User>;
  register: (credentials: RegisterCredentials) => Promise<User>;
  signInWithGoogle: (persistence?: AuthPersistenceMode) => Promise<User>;
  logout: () => Promise<void>;
  sendPasswordReset: (email: string) => Promise<void>;
  setPersistence: (mode: AuthPersistenceMode) => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: PropsWithChildren) {
  const [user, setUser] = useState<User | null>(null);
  const [isInitializing, setIsInitializing] = useState(true);
  const [pendingOperations, setPendingOperations] = useState(0);

  useEffect(() => {
      return authService.onAuthStateChanged((nextUser) => {
        setUser(nextUser);
        setIsInitializing(false);
    });
  }, []);

  const runWithPendingState = async <T,>(operation: () => Promise<T>) => {
    setPendingOperations((count) => count + 1);

    try {
      return await operation();
    } finally {
      setPendingOperations((count) => count - 1);
    }
  };

  const value: AuthContextValue = {
    user,
    isAuthenticated: user !== null,
    isLoading: isInitializing || pendingOperations > 0,
    login: (credentials) => runWithPendingState(() => authService.login(credentials)),
    register: (credentials) => runWithPendingState(() => authService.register(credentials)),
    signInWithGoogle: (persistence) =>
      runWithPendingState(() => authService.signInWithGoogle(persistence)),
    logout: () => runWithPendingState(() => authService.logout()),
    sendPasswordReset: (email) =>
      runWithPendingState(() => authService.sendPasswordReset(email)),
    setPersistence: (mode) => runWithPendingState(() => authService.setPersistence(mode)),
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }

  return context;
}
