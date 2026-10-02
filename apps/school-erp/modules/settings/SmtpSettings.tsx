"use client";

import React, { useEffect, useState } from "react";
import { Mailbox, Save, ShieldCheck, Send, CheckCircle2, AlertCircle } from "lucide-react";
import { useQuery, useMutation, useAction } from "convex/react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Switch } from "@/components/ui/Switch";
import { Badge } from "@/components/ui/Badge";
import { schoolsApi } from "@/app/api/schools";
import { emailApi } from "@/app/api/email";
import { schoolsRestApi } from "@/app/api/client";
import { useAuth } from "@/app/hooks/useAuth";
import { useToast } from "@/app/hooks/useToast";

/**
 * Per-school SMTP configuration. When enabled, credential emails and notices to newly-added
 * teachers/students/parents are sent from THIS school's mail server instead of the platform default.
 */
export const SmtpSettings: React.FC = () => {
  const { user } = useAuth();
  const schoolId = user?.schoolId ?? null;
  const school = useQuery(schoolsApi.getById, schoolId ? { schoolId } : "skip");
  const updateSmtp = useMutation(schoolsApi.updateSmtp);
  const testSmtpAction = useAction(emailApi.testSmtp);
  const { success, error } = useToast();

  const [form, setForm] = useState({
    smtpHost: "",
    smtpPort: 587,
    smtpUser: "",
    smtpPass: "",
    smtpFrom: "",
    smtpSecure: false,
    smtpEnabled: false,
  });
  const [saving, setSaving] = useState(false);
  const [testEmail, setTestEmail] = useState("");
  const [testing, setTesting] = useState(false);
  const [isConfigured, setIsConfigured] = useState(false);

  useEffect(() => {
    // Attempt fetching current SMTP settings from REST backend
    async function loadRestSmtp() {
      try {
        const res = await schoolsRestApi.getSmtpSettings();
        if (res) {
          setForm((prev) => ({
            ...prev,
            smtpHost: res.smtpHost ?? "",
            smtpPort: res.smtpPort ?? 587,
            smtpUser: res.smtpUser ?? "",
            smtpPass: "",
            smtpFrom: res.smtpFrom ?? "",
            smtpSecure: res.smtpSecure ?? false,
            smtpEnabled: res.smtpEnabled ?? false,
          }));
          setIsConfigured(Boolean(res.isConfigured || res.smtpHost));
          return;
        }
      } catch {
        // Fallback to Convex if REST not running
      }

      if (school) {
        setForm((prev) => ({
          ...prev,
          smtpHost: school.smtpHost ?? "",
          smtpPort: school.smtpPort ?? 587,
          smtpUser: school.smtpUser ?? "",
          smtpPass: "",
          smtpFrom: school.smtpFrom ?? "",
          smtpSecure: school.smtpSecure ?? false,
          smtpEnabled: school.smtpEnabled ?? false,
        }));
        setIsConfigured(Boolean(school.smtpConfigured));
      }
    }

    loadRestSmtp();
  }, [school]);

  const handleSave = async () => {
    setSaving(true);
    try {
      // 1. Try NestJS REST Backend
      try {
        await schoolsRestApi.updateSmtpSettings({
          smtpHost: form.smtpHost || undefined,
          smtpPort: form.smtpPort || undefined,
          smtpUser: form.smtpUser || undefined,
          smtpPass: form.smtpPass || undefined,
          smtpFrom: form.smtpFrom || undefined,
          smtpSecure: form.smtpSecure,
          smtpEnabled: form.smtpEnabled,
        });
        setIsConfigured(Boolean(form.smtpHost && form.smtpUser));
        success("SMTP server settings saved successfully.");
        return;
      } catch (restErr: any) {
        // Fallback to Convex mutation if REST is unreachable
        if (schoolId) {
          await updateSmtp({
            schoolId,
            smtpHost: form.smtpHost || undefined,
            smtpPort: form.smtpPort || undefined,
            smtpUser: form.smtpUser || undefined,
            smtpPass: form.smtpPass || undefined,
            smtpFrom: form.smtpFrom || undefined,
            smtpSecure: form.smtpSecure,
            smtpEnabled: form.smtpEnabled,
          });
          setIsConfigured(Boolean(form.smtpHost && form.smtpUser));
          success("SMTP server settings saved successfully.");
          return;
        }
        throw restErr;
      }
    } catch (err: any) {
      error(err?.message || "Could not save SMTP settings.");
    } finally {
      setSaving(false);
    }
  };

  const handleTest = async () => {
    if (!testEmail.trim()) {
      error("Please enter an email address to send the test message to.");
      return;
    }
    setTesting(true);
    try {
      // 1. Try NestJS REST Backend
      try {
        const res = await schoolsRestApi.testSmtp({
          toEmail: testEmail.trim(),
          smtpHost: form.smtpHost || undefined,
          smtpPort: form.smtpPort || undefined,
          smtpUser: form.smtpUser || undefined,
          smtpPass: form.smtpPass || undefined,
          smtpFrom: form.smtpFrom || undefined,
          smtpSecure: form.smtpSecure,
        });
        if (res?.success) {
          success(`SMTP verified! Test message sent to ${testEmail.trim()}`);
          return;
        }
      } catch (restErr: any) {
        // Fallback to Convex action
        if (schoolId) {
          const res = await testSmtpAction({ schoolId, to: testEmail.trim() });
          if (res?.ok) {
            success(`Test email sent to ${testEmail.trim()} — check inbox.`);
            return;
          }
          throw new Error(res?.error || "Test failed.");
        }
        throw restErr;
      }
    } catch (e: any) {
      error(e?.message || "SMTP handshake failed. Verify host, port, username & password.");
    } finally {
      setTesting(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Mailbox className="w-4 h-4 text-[#0D9488]" />
          Custom Email (SMTP) Configuration
          {isConfigured ? (
            <Badge variant="success" size="sm" dot>
              Configured
            </Badge>
          ) : (
            <Badge variant="neutral" size="sm">
              Not Configured
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-xs text-slate-500 leading-relaxed">
          Configure your school&apos;s custom mail server so account activation, login credentials,
          fee alerts, and attendance notifications are delivered directly from your school domain.
        </p>

        <div className="flex items-center justify-between py-2.5 px-3.5 rounded-xl bg-slate-50 border border-slate-200">
          <div className="flex items-start gap-3">
            <ShieldCheck className="w-4 h-4 text-teal-600 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-slate-800">Enable School SMTP Mailer</p>
              <p className="text-xs text-slate-500">
                When enabled, all system emails will be sent through this server.
              </p>
            </div>
          </div>
          <Switch
            checked={form.smtpEnabled}
            onCheckedChange={(v) => setForm({ ...form, smtpEnabled: v })}
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            label="SMTP Host *"
            placeholder="e.g. smtp.gmail.com, mail.yourschool.edu"
            value={form.smtpHost}
            onChange={(e) => setForm({ ...form, smtpHost: e.target.value })}
          />
          <Input
            label="Port *"
            type="number"
            min={0}
            placeholder="587"
            value={form.smtpPort}
            onChange={(e) =>
              setForm({ ...form, smtpPort: Math.max(0, Number(e.target.value) || 0) })
            }
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            label="SMTP Username / Email *"
            placeholder="admin@yourschool.edu"
            value={form.smtpUser}
            onChange={(e) => setForm({ ...form, smtpUser: e.target.value })}
          />
          <Input
            label="SMTP Password / App Password *"
            type="password"
            placeholder={isConfigured ? "•••••••• (unchanged)" : "App Password"}
            value={form.smtpPass}
            onChange={(e) => setForm({ ...form, smtpPass: e.target.value })}
            helperText="For Gmail, use a 16-character App Password."
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            label="From Address (optional)"
            placeholder="no-reply@yourschool.edu"
            value={form.smtpFrom}
            onChange={(e) => setForm({ ...form, smtpFrom: e.target.value })}
          />
          <div className="flex items-center justify-between py-2 px-3 rounded-xl bg-slate-50 border border-slate-200 self-end w-full">
            <div>
              <span className="text-sm font-medium text-slate-700 block">
                SSL / TLS Security
              </span>
              <span className="text-[11px] text-slate-400">
                {form.smtpSecure ? "Port 465 (SSL/TLS)" : "Port 587 (STARTTLS)"}
              </span>
            </div>
            <Switch
              checked={form.smtpSecure}
              onCheckedChange={(v) =>
                setForm({
                  ...form,
                  smtpSecure: v,
                  smtpPort: v ? 465 : 587,
                })
              }
            />
          </div>
        </div>

        <div className="flex justify-end">
          <Button
            variant="primary"
            size="sm"
            onClick={handleSave}
            isLoading={saving}
            leftIcon={<Save className="w-4 h-4" />}
          >
            Save SMTP Settings
          </Button>
        </div>

        {/* Test connection */}
        <div className="pt-4 border-t border-slate-100">
          <p className="text-xs font-semibold text-slate-700 mb-1">
            Test SMTP Handshake & Email Delivery
          </p>
          <p className="text-[11px] text-slate-400 mb-3">
            Send an instant test email to verify credentials and server connectivity.
          </p>
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1">
              <Input
                type="email"
                placeholder="recipient@example.com"
                value={testEmail}
                onChange={(e) => setTestEmail(e.target.value)}
                leftIcon={<Send className="w-4 h-4" />}
              />
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleTest}
              isLoading={testing}
              disabled={!testEmail.trim()}
              leftIcon={<Send className="w-4 h-4" />}
            >
              Send Test Email
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
