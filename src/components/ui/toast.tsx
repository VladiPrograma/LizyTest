"use client";

import { CircleAlert, CircleCheckBig, Info, X } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

const TOAST_EXIT_DURATION_MS = 180;

export type ToastVariant = "info" | "success" | "error";

export type ToastRecord = {
  duration: number;
  id: string;
  message: string;
  variant: ToastVariant;
};

type ToastViewportProps = {
  onRemove: (id: string) => void;
  toasts: ToastRecord[];
};

type ToastNotificationProps = {
  onRemove: (id: string) => void;
  toast: ToastRecord;
};

const toastVariantStyles: Record<
  ToastVariant,
  {
    icon: typeof Info;
    iconClassName: string;
    role: "alert" | "status";
  }
> = {
  error: {
    icon: CircleAlert,
    iconClassName: "border-[var(--danger-red-border)] bg-[var(--danger-red-soft)] text-[var(--danger-red)]",
    role: "alert",
  },
  info: {
    icon: Info,
    iconClassName: "border-[var(--payments-soft-blue-border)] bg-[var(--accent-blue-light)] text-[var(--accent-blue)]",
    role: "status",
  },
  success: {
    icon: CircleCheckBig,
    iconClassName: "border-[var(--success-green-border)] bg-[var(--success-green-soft)] text-[var(--success-green)]",
    role: "status",
  },
};

function ToastNotification({ onRemove, toast }: ToastNotificationProps) {
  const [isClosing, setIsClosing] = useState(false);
  const hasStartedClosingRef = useRef(false);
  const removeTimerRef = useRef<number | null>(null);

  const handleDismiss = useCallback(() => {
    if (hasStartedClosingRef.current) {
      return;
    }

    hasStartedClosingRef.current = true;
    setIsClosing(true);
    removeTimerRef.current = window.setTimeout(() => {
      onRemove(toast.id);
    }, TOAST_EXIT_DURATION_MS);
  }, [onRemove, toast.id]);

  useEffect(() => {
    const dismissTimer = window.setTimeout(handleDismiss, toast.duration);

    return () => {
      window.clearTimeout(dismissTimer);

      if (removeTimerRef.current !== null) {
        window.clearTimeout(removeTimerRef.current);
      }
    };
  }, [handleDismiss, toast.duration]);

  const variantConfig = toastVariantStyles[toast.variant];
  const Icon = variantConfig.icon;

  return (
    <div
      aria-atomic="true"
      aria-live={toast.variant === "error" ? "assertive" : "polite"}
      className={cn(
        "pointer-events-auto flex items-center gap-3 rounded-[16px] border border-[var(--border-color)] bg-[var(--bg-white)] px-3.5 py-3 shadow-[0_18px_40px_var(--navy-alpha-08)]",
        isClosing ? "toast-exit" : "toast-enter",
      )}
      role={variantConfig.role}
    >
      <span
        aria-hidden="true"
        className={cn(
          "flex h-8 w-8 shrink-0 items-center justify-center rounded-[10px] border",
          variantConfig.iconClassName,
        )}
      >
        <Icon className="h-4 w-4" />
      </span>
      <p className="min-w-0 flex-1 text-[13px] font-medium leading-5 text-[var(--text-primary)]">{toast.message}</p>
      <button
        aria-label="Cerrar notificación"
        className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[var(--text-muted)] transition-colors hover:bg-[var(--bg-light)] hover:text-[var(--text-primary)] focus-visible:outline-none focus-visible:shadow-[0_0_0_3px_var(--blue-alpha-25)]"
        onClick={handleDismiss}
        type="button"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}

export function ToastViewport({ onRemove, toasts }: ToastViewportProps) {
  return (
    <div className="pointer-events-none fixed right-4 top-4 z-[100] flex w-[min(360px,calc(100vw-2rem))] flex-col gap-2">
      {toasts.map((toast) => (
        <ToastNotification key={toast.id} onRemove={onRemove} toast={toast} />
      ))}
    </div>
  );
}
