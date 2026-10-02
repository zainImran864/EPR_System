"use client";

import React, { useEffect, useState } from "react";
import QRCode from "qrcode";
import { ShieldCheck, Smartphone, KeyRound, Copy, Check } from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { useAccount } from "@/app/hooks/useAccount";
import { useToast } from "@/app/hooks/useToast";

export interface TwoFactorModalProps {
  mode: "enroll" | "disable";
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const TwoFactorModal: React.FC<TwoFactorModalProps> = ({
  mode,
  isOpen,
  onClose,
  onSuccess,
}) => {
  const { startTwoFactorSetup, confirmTwoFactor, disableTwoFactor } = useAccount();
  const { success, error } = useToast();

  const [step, setStep] = useState<"scan" | "code">(mode === "enroll" ? "scan" : "code");
  const [secret, setSecret] = useState("");
  const [qr, setQr] = useState("");
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [copied, setCopied] = useState(false);

  // Kick off enrollment (fetch secret + render QR) when the enroll modal opens.
  useEffect(() => {
    if (!isOpen) return;
    setStep(mode === "enroll" ? "scan" : "code");
    setCode("");
    if (mode === "enroll") {
      let cancelled = false;
      (async () => {
        try {
          const res = await startTwoFactorSetup();
          if (cancelled || !res) return;
          setSecret(res.secret);
          const url = await QRCode.toDataURL(res.otpauthUrl, { width: 220, margin: 1 });
          if (!cancelled) setQr(url);
        } catch {
          error("Could not start 2FA setup.");
        }
      })();
      return () => {
        cancelled = true;
      };
    }
  }, [isOpen, mode]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleConfirm = async () => {
    if (code.replace(/\D/g, "").length !== 6) return;
    setBusy(true);
    try {
      const res =
        mode === "enroll"
          ? await confirmTwoFactor(code)
          : await disableTwoFactor(code);
      if (res?.ok) {
        success(
          mode === "enroll"
            ? "Two-factor authentication enabled."
            : "Two-factor authentication disabled."
        );
        onSuccess();
        onClose();
      } else {
        error(res?.error === "bad-code" ? "Invalid code — try again." : "Could not verify code.");
      }
    } catch {
      error("Could not verify code.");
    } finally {
      setBusy(false);
    }
  };

  const copySecret = async () => {
    try {
      await navigator.clipboard.writeText(secret);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* ignore */
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={mode === "enroll" ? "Enable Two-Factor Authentication" : "Disable Two-Factor"}
      description={
        mode === "enroll"
          ? "Secure your account with an authenticator app (Google Authenticator, Authy…)."
          : "Enter a current code from your authenticator app to turn off 2FA."
      }
      size="md"
      footer={
        <>
          <Button variant="outline" size="sm" onClick={onClose} type="button">
            Cancel
          </Button>
          {mode === "enroll" && step === "scan" ? (
            <Button
              variant="primary"
              size="sm"
              onClick={() => setStep("code")}
              disabled={!qr}
            >
              Next
            </Button>
          ) : (
            <Button
              variant="primary"
              size="sm"
              onClick={handleConfirm}
              isLoading={busy}
              disabled={code.replace(/\D/g, "").length !== 6}
            >
              {mode === "enroll" ? "Verify & Enable" : "Verify & Disable"}
            </Button>
          )}
        </>
      }
    >
      {mode === "enroll" && step === "scan" ? (
        <div className="space-y-4 text-center">
          <div className="flex items-center justify-center">
            {qr ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={qr}
                alt="2FA QR code"
                className="w-52 h-52 rounded-xl border border-slate-200"
              />
            ) : (
              <div className="w-52 h-52 rounded-xl border border-dashed border-slate-200 flex items-center justify-center text-xs text-slate-400">
                Generating QR…
              </div>
            )}
          </div>
          <p className="text-xs text-slate-500 flex items-center justify-center gap-1.5">
            <Smartphone className="w-4 h-4 text-[#0D9488]" />
            Scan this in your authenticator app.
          </p>
          {secret && (
            <div>
              <p className="text-[11px] text-slate-400 mb-1">Or enter this key manually:</p>
              <button
                onClick={copySecret}
                className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-50 border border-slate-200 font-mono-data text-xs text-slate-700 hover:bg-slate-100"
              >
                {secret}
                {copied ? (
                  <Check className="w-3.5 h-3.5 text-emerald-500" />
                ) : (
                  <Copy className="w-3.5 h-3.5 text-slate-400" />
                )}
              </button>
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex items-center gap-3 p-3 rounded-xl bg-teal-50/60 border border-teal-100">
            <ShieldCheck className="w-5 h-5 text-[#0D9488] shrink-0" />
            <p className="text-xs text-slate-600">
              Open your authenticator app and enter the current 6-digit code for{" "}
              <b>AcademiX</b>.
            </p>
          </div>
          <Input
            label="6-digit code"
            inputMode="numeric"
            maxLength={6}
            placeholder="123456"
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
            leftIcon={<KeyRound className="w-4 h-4" />}
            className="tracking-[0.4em] text-center font-mono-data text-lg"
            autoFocus
          />
        </div>
      )}
    </Modal>
  );
};
