"use client";

import { createContext, useCallback, useContext, useMemo, useRef, useState, type PropsWithChildren } from "react";
import { ToastViewport, type ToastRecord, type ToastVariant } from "@/components/ui/toast";

const DEFAULT_TOAST_DURATION_MS = 4000;

type ShowToastInput = {
  duration?: number;
  message: string;
  variant: ToastVariant;
};

type ToastContextValue = {
  dismissToast: (id: string) => void;
  showError: (message: string, duration?: number) => string;
  showInfo: (message: string, duration?: number) => string;
  showSuccess: (message: string, duration?: number) => string;
  showToast: (input: ShowToastInput) => string;
};

const ToastContext = createContext<ToastContextValue | null>(null);

function createToastId(sequence: number) {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }

  return `toast-${Date.now()}-${sequence}`;
}

export function ToastProvider({ children }: PropsWithChildren) {
  const [toasts, setToasts] = useState<ToastRecord[]>([]);
  const nextToastSequenceRef = useRef(0);

  const dismissToast = useCallback((id: string) => {
    setToasts((currentToasts) => currentToasts.filter((toast) => toast.id !== id));
  }, []);

  const showToast = useCallback(({ duration = DEFAULT_TOAST_DURATION_MS, message, variant }: ShowToastInput) => {
    const toastId = createToastId(nextToastSequenceRef.current);

    nextToastSequenceRef.current += 1;

    setToasts((currentToasts) => [
      ...currentToasts,
      {
        duration,
        id: toastId,
        message,
        variant,
      },
    ]);

    return toastId;
  }, []);

  const showInfo = useCallback(
    (message: string, duration?: number) => showToast({ duration, message, variant: "info" }),
    [showToast],
  );
  const showSuccess = useCallback(
    (message: string, duration?: number) => showToast({ duration, message, variant: "success" }),
    [showToast],
  );
  const showError = useCallback(
    (message: string, duration?: number) => showToast({ duration, message, variant: "error" }),
    [showToast],
  );

  const value = useMemo<ToastContextValue>(
    () => ({
      dismissToast,
      showError,
      showInfo,
      showSuccess,
      showToast,
    }),
    [dismissToast, showError, showInfo, showSuccess, showToast],
  );

  return (
    <ToastContext.Provider value={value}>
      {children}
      <ToastViewport onRemove={dismissToast} toasts={toasts} />
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);

  if (!context) {
    throw new Error("useToast must be used within a ToastProvider");
  }

  return context;
}
