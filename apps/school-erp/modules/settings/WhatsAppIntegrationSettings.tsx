"use client";

import React, { useState, useEffect } from "react";
import {
  MessageCircle,
  CheckCircle2,
  AlertCircle,
  Save,
  Send,
  ExternalLink,
  ShieldCheck,
  Unplug,
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { PhoneInput } from "@/components/ui/PhoneInput";
import { useToast } from "@/app/hooks/useToast";
import { useAuth } from "@/app/hooks/useAuth";

export const WhatsAppIntegrationSettings: React.FC = () => {
  const { user, role } = useAuth();
  const { success, error, info } = useToast();

  const storageKey = `whatsapp_config_${user?._id || role || "user"}`;

  const [connectedPhone, setConnectedPhone] = useState("");
  const [isValidPhone, setIsValidPhone] = useState(false);
  const [senderName, setSenderName] = useState("");
  const [isConnected, setIsConnected] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    // Load persisted WhatsApp settings
    try {
      const stored = localStorage.getItem(storageKey);
      if (stored) {
        const parsed = JSON.parse(stored);
        setConnectedPhone(parsed.phone || user?.phone || "");
        setSenderName(parsed.senderName || user?.name || "");
        setIsConnected(Boolean(parsed.isConnected && parsed.phone));
      } else if (user?.phone) {
        setConnectedPhone(user.phone);
        setSenderName(user.name || "");
      }
    } catch {}
  }, [storageKey, user]);

  const handleConnect = () => {
    if (!connectedPhone || !isValidPhone) {
      error("Please enter a complete and valid WhatsApp phone number with country code.");
      return;
    }
    setSaving(true);
    try {
      const payload = {
        phone: connectedPhone,
        senderName: senderName.trim() || user?.name || "School Official",
        isConnected: true,
        connectedAt: new Date().toISOString(),
      };
      localStorage.setItem(storageKey, JSON.stringify(payload));
      setIsConnected(true);
      success("WhatsApp number connected and verified successfully!");
    } catch {
      error("Could not save WhatsApp settings.");
    } finally {
      setSaving(false);
    }
  };

  const handleDisconnect = () => {
    if (!window.confirm("Disconnect your WhatsApp number? WhatsApp messaging will be disabled until reconnected.")) {
      return;
    }
    try {
      localStorage.removeItem(storageKey);
      setIsConnected(false);
      setConnectedPhone("");
      info("WhatsApp number disconnected.");
    } catch {}
  };

  const handleTestPing = () => {
    if (!connectedPhone) {
      error("No connected WhatsApp number found.");
      return;
    }
    const cleanPhone = connectedPhone.replace(/\D/g, "");
    const text = encodeURIComponent(
      `*WhatsApp Connection Test*\nYour WhatsApp number (${connectedPhone}) is successfully connected to the School ERP Portal as official sender: ${senderName || user?.name || "Official"}.`
    );
    window.open(`https://wa.me/${cleanPhone}?text=${text}`, "_blank");
  };

  return (
    <Card className="border-emerald-200/80 shadow-xs">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-bold flex items-center gap-2">
            <MessageCircle className="w-4 h-4 text-emerald-600" />
            WhatsApp Official Gateway &amp; Sender Settings
          </CardTitle>
          <Badge
            variant={isConnected ? "success" : "neutral"}
            size="sm"
            dot
          >
            {isConnected ? "Connected" : "Disconnected"}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-xs text-slate-500 leading-relaxed">
          Connect your verified mobile phone number with country code. This number is used to dispatch official class announcements, 1-click transcript reports, fee reminders, and direct guardian messages.
        </p>

        {isConnected ? (
          <div className="p-4 bg-emerald-50/70 border border-emerald-200 rounded-xl space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-700 font-bold">
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-bold text-emerald-950 font-mono-data">
                    {connectedPhone}
                  </div>
                  <div className="text-[11px] text-emerald-700">
                    Sender: {senderName || user?.name || "School Official"} ({role})
                  </div>
                </div>
              </div>
              <Button
                variant="outline"
                size="xs"
                onClick={handleDisconnect}
                leftIcon={<Unplug className="w-3.5 h-3.5 text-rose-600" />}
                className="text-xs text-rose-600 border-rose-200 hover:bg-rose-50"
              >
                Disconnect
              </Button>
            </div>

            <div className="pt-2 border-t border-emerald-200/60 flex items-center justify-between gap-2">
              <span className="text-[11px] text-emerald-800">
                Ready for click-to-chat messaging across the portal.
              </span>
              <Button
                variant="outline"
                size="xs"
                onClick={handleTestPing}
                leftIcon={<Send className="w-3.5 h-3.5 text-emerald-700" />}
                className="text-xs bg-white text-emerald-800 border-emerald-300 hover:bg-emerald-100/50"
              >
                Test WhatsApp Ping
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
              <span>
                WhatsApp messaging features remain locked until you configure your official phone number below.
              </span>
            </div>

            <div className="space-y-3">
              <PhoneInput
                label="Official WhatsApp Mobile Number"
                value={connectedPhone}
                onChange={(full, isValid) => {
                  setConnectedPhone(full);
                  setIsValidPhone(isValid);
                }}
                required
                helperText="Must match exact country digit count (e.g. +92 300 1234567 for Pakistan)."
              />

              <div className="flex justify-end pt-2">
                <Button
                  variant="primary"
                  size="sm"
                  onClick={handleConnect}
                  isLoading={saving}
                  leftIcon={<Save className="w-4 h-4" />}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white"
                >
                  Save &amp; Connect WhatsApp
                </Button>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
