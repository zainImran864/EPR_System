"use client";

import React, { useEffect, useState } from "react";
import { Mailbox, Save, ShieldCheck, Send } from "lucide-react";
import { useQuery, useMutation, useAction } from "convex/react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Switch } from "@/components/ui/Switch";
import { Badge } from "@/components/ui/Badge";
import { schoolsApi } from "@/app/api/schools";
import { emailApi } from "@/app/api/email";
import { useAuth } from "@/app/hooks/useAuth";
import { useToast } from "@/app/hooks/useToast";

/**
 * Per-school SMTP configuration. When enabled, credential emails to newly-added
 * teachers/students are sent from THIS school's mail server instead of the
 * platform default.
 */
export const SmtpSettings: React.FC = () => {
  const { user } = useAuth();
  const schoolId = user?.schoolId ?? null;
  const school = useQuery(schoolsApi.getById, schoolId ? { schoolId } : "skip");
  const updateSmtp = useMutation(schoolsApi.updateSmtp);
  const testSmtp = useAction(emailApi.testSmtp);
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

  useEffect(() => {
    if (school) {
      setForm({
        smtpHost: school.smtpHost ?? "",
        smtpPort: school.smtpPort ?? 587,
        smtpUser: school.smtpUser ?? "",
        smtpPass: "", // never prefilled
        smtpFrom: school.smtpFrom ?? "",
        smtpSecure: school.smtpSecure ?? false,
        smtpEnabled: school.smtpEnabled ?? false,
      });
    }
  }, [school]);

  const configured = school?.smtpConfigured ?? false;

  const handleSave = async () => {
    if (!schoolId) return;
    setSaving(true);
    try {
      await updateSmtp({
        schoolId,
        smtpHost: form.smtpHost || undefined,
        smtpPort: form.smtpPort || undefined,
        smtpUser: form.smtpUser || undefined,
        smtpPass: form.smtpPass || undefined, // only patched if typed
        smtpFrom: form.smtpFrom || undefined,
        smtpSecure: form.smtpSecure,
        smtpEnabled: form.smtpEnabled,
      });
      success("SMTP settings saved.");
    } catch {
      error("Could not save SMTP settings.");
    } finally {
      setSaving(false);
    }
  };

  const handleTest = async () => {
    if (!schoolId || !testEmail.trim()) return;
    setTesting(true);
    try {
      const res = await testSmtp({ schoolId, to: testEmail.trim() });
      if (res?.ok) success(`Test email sent to ${testEmail.trim()} — check the inbox.`);
      else error(res?.error ? `Test failed: ${res.error}` : "Test failed.");
    } catch (e) {
      error(e instanceof Error ? `Test failed: ${e.message}` : "Test failed.");
    } finally {
      setTesting(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Mailbox className="w-4 h-4 text-[#0D9488]" />
          Email (SMTP) Configuration
          {configured && (
            <Badge variant="success" size="sm" dot>
              Configured
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-xs text-slate-500 leading-relaxed">
          Set your school&apos;s mail server so login credentials for new teachers and
          students are sent from your own email address. Leave disabled to use the
          AcademiX platform mailer.
        </p>

        <div className="flex items-center justify-between py-2 px-3 rounded-xl bg-slate-50 border border-slate-200">
          <div className="flex items-start gap-3">
            <ShieldCheck className="w-4 h-4 text-slate-400 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-slate-800">Use my school SMTP</p>
              <p className="text-xs text-slate-500">
                When on, credential emails send from your server.
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
            label="SMTP Host"
            placeholder="smtp.gmail.com"
            value={form.smtpHost}
            onChange={(e) => setForm({ ...form, smtpHost: e.target.value })}
          />
          <Input
            label="Port"
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
            label="SMTP Username / Email"
            placeholder="school@gmail.com"
            value={form.smtpUser}
            onChange={(e) => setForm({ ...form, smtpUser: e.target.value })}
          />
          <Input
            label="SMTP Password"
            type="password"
            placeholder={configured ? "•••••••• (unchanged)" : "App password"}
            value={form.smtpPass}
            onChange={(e) => setForm({ ...form, smtpPass: e.target.value })}
            helperText="Leave blank to keep the saved password."
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            label="From Address (optional)"
            placeholder="no-reply@yourschool.com"
            value={form.smtpFrom}
            onChange={(e) => setForm({ ...form, smtpFrom: e.target.value })}
          />
          <div className="flex items-center justify-between py-2 px-3 rounded-xl bg-slate-50 border border-slate-200 self-end w-full">
            <span className="text-sm font-medium text-slate-700">
              Secure (SSL/TLS, port 465)
            </span>
            <Switch
              checked={form.smtpSecure}
              onCheckedChange={(v) => setForm({ ...form, smtpSecure: v })}
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
          <p className="text-xs font-semibold text-slate-700 mb-2">
            Test connection
          </p>
          <p className="text-[11px] text-slate-400 mb-3">
            Save your settings first, then send a test email to confirm everything works.
          </p>
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1">
              <Input
                type="email"
                placeholder="Send test email to…"
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
