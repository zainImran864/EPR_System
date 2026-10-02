"use client";

import React, { useState, useCallback, useRef } from "react";
import { AlertModal, AlertVariant } from "@/components/ui/AlertModal";

export interface ConfirmOptions {
  title: string;
  message: string;
  variant?: AlertVariant;
  confirmText?: string;
  cancelText?: string;
}

export interface PromptOptions extends ConfirmOptions {
  placeholder?: string;
  defaultValue?: string;
  label?: string;
}

export interface AlertOptions {
  title: string;
  message: string;
  variant?: AlertVariant;
  buttonText?: string;
}

export function useConfirmDialog() {
  const [isOpen, setIsOpen] = useState(false);
  const [config, setConfig] = useState<{
    title: string;
    message: string;
    variant: AlertVariant;
    confirmText: string;
    cancelText: string;
    isPrompt: boolean;
    promptPlaceholder?: string;
    promptDefaultValue?: string;
    promptLabel?: string;
  }>({
    title: "",
    message: "",
    variant: "warning",
    confirmText: "Confirm",
    cancelText: "Cancel",
    isPrompt: false,
  });

  const resolveRef = useRef<(value: any) => void>(() => {});

  const confirm = useCallback((options: ConfirmOptions): Promise<boolean> => {
    return new Promise((resolve) => {
      resolveRef.current = resolve;
      setConfig({
        title: options.title,
        message: options.message,
        variant: options.variant || "warning",
        confirmText: options.confirmText || "Confirm",
        cancelText: options.cancelText || "Cancel",
        isPrompt: false,
      });
      setIsOpen(true);
    });
  }, []);

  const prompt = useCallback((options: PromptOptions): Promise<string | null> => {
    return new Promise((resolve) => {
      resolveRef.current = resolve;
      setConfig({
        title: options.title,
        message: options.message,
        variant: options.variant || "prompt",
        confirmText: options.confirmText || "Submit",
        cancelText: options.cancelText || "Cancel",
        isPrompt: true,
        promptPlaceholder: options.placeholder,
        promptDefaultValue: options.defaultValue || "",
        promptLabel: options.label,
      });
      setIsOpen(true);
    });
  }, []);

  const alert = useCallback((options: AlertOptions): Promise<void> => {
    return new Promise((resolve) => {
      resolveRef.current = resolve;
      setConfig({
        title: options.title,
        message: options.message,
        variant: options.variant || "info",
        confirmText: options.buttonText || "OK",
        cancelText: "",
        isPrompt: false,
      });
      setIsOpen(true);
    });
  }, []);

  const handleClose = useCallback(() => {
    setIsOpen(false);
    resolveRef.current(config.isPrompt ? null : false);
  }, [config.isPrompt]);

  const handleConfirm = useCallback(
    (inputValue?: string) => {
      setIsOpen(false);
      if (config.isPrompt) {
        resolveRef.current(inputValue ?? "");
      } else {
        resolveRef.current(true);
      }
    },
    [config.isPrompt]
  );

  const ConfirmDialog = useCallback(() => {
    return (
      <AlertModal
        isOpen={isOpen}
        onClose={handleClose}
        onConfirm={handleConfirm}
        title={config.title}
        message={config.message}
        variant={config.variant}
        confirmText={config.confirmText}
        cancelText={config.cancelText || "Cancel"}
        isPrompt={config.isPrompt}
        promptPlaceholder={config.promptPlaceholder}
        promptDefaultValue={config.promptDefaultValue}
        promptLabel={config.promptLabel}
      />
    );
  }, [isOpen, config, handleClose, handleConfirm]);

  return {
    confirm,
    prompt,
    alert,
    ConfirmDialog,
  };
}
