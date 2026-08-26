"use client";

import { useToastStore, type ToastVariant } from "@/app/store/useToastStore";

interface ToastOpts {
  title?: string;
  duration?: number;
}

/**
 * Convenience toast API: `const { success, error } = useToast()`.
 */
export function useToast() {
  const add = useToastStore((s) => s.add);

  const make =
    (variant: ToastVariant) =>
    (message: string, opts?: ToastOpts) =>
      add({
        message,
        variant,
        title: opts?.title,
        duration: opts?.duration ?? 4000,
      });

  return {
    success: make("success"),
    error: make("error"),
    info: make("info"),
    warning: make("warning"),
    toast: (message: string, opts?: ToastOpts & { variant?: ToastVariant }) =>
      add({
        message,
        variant: opts?.variant ?? "info",
        title: opts?.title,
        duration: opts?.duration ?? 4000,
      }),
  };
}
