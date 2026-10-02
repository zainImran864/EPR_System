"use client";

import React, { useEffect } from "react";
import {
  CheckCircle2,
  AlertCircle,
  Info,
  AlertTriangle,
  X,
} from "lucide-react";
import { cn } from "@/app/lib/utils";
import {
  useToastStore,
  type ToastItem,
  type ToastVariant,
} from "@/app/store/useToastStore";

const VARIANTS: Record<
  ToastVariant,
  { icon: React.ElementType; accent: string; iconColor: string; bar: string }
> = {
  success: {
    icon: CheckCircle2,
    accent: "border-emerald-200",
    iconColor: "text-emerald-600",
    bar: "bg-emerald-500",
  },
  error: {
    icon: AlertCircle,
    accent: "border-rose-200",
    iconColor: "text-rose-600",
    bar: "bg-rose-500",
  },
  warning: {
    icon: AlertTriangle,
    accent: "border-amber-200",
    iconColor: "text-amber-600",
    bar: "bg-amber-500",
  },
  info: {
    icon: Info,
    accent: "border-sky-200",
    iconColor: "text-sky-600",
    bar: "bg-sky-500",
  },
};

function ToastCard({ toast }: { toast: ToastItem }) {
  const remove = useToastStore((s) => s.remove);
  const v = VARIANTS[toast.variant];
  const Icon = v.icon;

  useEffect(() => {
    if (toast.duration > 0) {
      const t = setTimeout(() => remove(toast.id), toast.duration);
      return () => clearTimeout(t);
    }
  }, [toast.id, toast.duration, remove]);

  return (
    <div
      role="status"
      className={cn(
        "relative overflow-hidden pointer-events-auto flex items-start gap-3 rounded-xl border bg-white shadow-lg shadow-slate-900/5 px-4 py-3 animate-[slideIn_0.2s_ease-out]",
        v.accent
      )}
    >
      <span className="absolute left-0 top-0 bottom-0 w-1" />
      <Icon className={cn("w-5 h-5 mt-0.5 shrink-0", v.iconColor)} />
      <div className="flex-1 min-w-0">
        {toast.title && (
          <p className="text-sm font-semibold text-slate-900 leading-tight">
            {toast.title}
          </p>
        )}
        <p className="text-xs text-slate-600 leading-relaxed">{toast.message}</p>
      </div>
      <button
        onClick={() => remove(toast.id)}
        className="text-slate-300 hover:text-slate-600 transition-colors shrink-0"
        aria-label="Dismiss"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}

/** Global toast viewport — mount once at the app root. */
export function Toaster() {
  const toasts = useToastStore((s) => s.toasts);
  return (
    <div className="fixed top-4 right-4 z-[100] flex flex-col gap-2 w-80 max-w-[calc(100vw-2rem)] pointer-events-none">
      {toasts.map((t) => (
        <ToastCard key={t.id} toast={t} />
      ))}
    </div>
  );
}
