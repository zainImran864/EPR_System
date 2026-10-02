"use client";

import React, { useState, useEffect, useRef } from "react";
import { cn } from "@/app/lib/utils";
import { AlertTriangle, AlertCircle, CheckCircle2, HelpCircle, Info, X } from "lucide-react";
import { Button } from "./Button";
import { Input } from "./Input";

export type AlertVariant = "danger" | "warning" | "info" | "success" | "prompt";

export interface AlertModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm?: (inputValue?: string) => void;
  title: string;
  message: string;
  variant?: AlertVariant;
  confirmText?: string;
  cancelText?: string;
  isPrompt?: boolean;
  promptPlaceholder?: string;
  promptDefaultValue?: string;
  promptLabel?: string;
  loading?: boolean;
}

export const AlertModal: React.FC<AlertModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  variant = "warning",
  confirmText = "Confirm",
  cancelText = "Cancel",
  isPrompt = false,
  promptPlaceholder = "",
  promptDefaultValue = "",
  promptLabel,
  loading = false,
}) => {
  const [inputValue, setInputValue] = useState(promptDefaultValue);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setInputValue(promptDefaultValue);
      setTimeout(() => {
        inputRef.current?.focus();
        inputRef.current?.select();
      }, 50);
    }
  }, [isOpen, promptDefaultValue]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;
      if (e.key === "Escape") {
        onClose();
      } else if (e.key === "Enter" && !e.shiftKey) {
        if (onConfirm) {
          e.preventDefault();
          onConfirm(isPrompt ? inputValue : undefined);
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, inputValue, isPrompt, onClose, onConfirm]);

  if (!isOpen) return null;

  const getIcon = () => {
    switch (variant) {
      case "danger":
        return <AlertTriangle className="w-6 h-6 text-rose-600" />;
      case "warning":
        return <AlertTriangle className="w-6 h-6 text-amber-500" />;
      case "success":
        return <CheckCircle2 className="w-6 h-6 text-emerald-600" />;
      case "prompt":
        return <HelpCircle className="w-6 h-6 text-teal-600" />;
      default:
        return <Info className="w-6 h-6 text-blue-600" />;
    }
  };

  const getIconBg = () => {
    switch (variant) {
      case "danger":
        return "bg-rose-50 border-rose-100";
      case "warning":
        return "bg-amber-50 border-amber-100";
      case "success":
        return "bg-emerald-50 border-emerald-100";
      case "prompt":
        return "bg-teal-50 border-teal-100";
      default:
        return "bg-blue-50 border-blue-100";
    }
  };

  const getConfirmButtonVariant = (): "primary" | "secondary" | "danger" | "ghost" => {
    if (variant === "danger") return "danger";
    return "primary";
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs transition-opacity duration-200 animate-in fade-in"
        onClick={onClose}
      />

      {/* Dialog Box */}
      <div
        className="relative z-10 w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-200/80 overflow-hidden transform transition-all duration-200 animate-in fade-in zoom-in-95"
        role="dialog"
        aria-modal="true"
      >
        <div className="p-6">
          <div className="flex items-start gap-4">
            <div
              className={cn(
                "p-3 rounded-xl border flex items-center justify-center shrink-0",
                getIconBg()
              )}
            >
              {getIcon()}
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-base font-semibold text-slate-900 tracking-tight">
                {title}
              </h3>
              <p className="text-sm text-slate-600 mt-1 leading-relaxed whitespace-pre-line">
                {message}
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Prompt Input Field */}
          {isPrompt && (
            <div className="mt-4 pt-2">
              {promptLabel && (
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  {promptLabel}
                </label>
              )}
              <input
                ref={inputRef}
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder={promptPlaceholder}
                className="w-full px-3.5 py-2 text-sm text-slate-900 bg-white border border-slate-300 rounded-lg shadow-xs placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-all"
              />
            </div>
          )}
        </div>

        {/* Action Buttons Footer */}
        <div className="px-6 py-3.5 bg-slate-50/80 border-t border-slate-100 flex items-center justify-end gap-2.5">
          <Button variant="ghost" size="sm" onClick={onClose} disabled={loading}>
            {cancelText}
          </Button>
          <Button
            variant={getConfirmButtonVariant()}
            size="sm"
            onClick={() => onConfirm?.(isPrompt ? inputValue : undefined)}
            isLoading={loading}
          >
            {confirmText}
          </Button>
        </div>
      </div>
    </div>
  );
};
