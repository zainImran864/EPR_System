"use client";

import React, { useEffect, useRef, useState } from "react";
import {
  Settings,
  Save,
  ImageUp,
  SendHorizonal,
  Coins,
  Clock,
  Database,
  Download,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Skeleton } from "@/components/ui/Skeleton";
import { schoolsRestApi, backupRestApi } from "@/app/api/client";
import { useAuth } from "@/app/hooks/useAuth";
import { useAccount } from "@/app/hooks/useAccount";
import { useToast } from "@/app/hooks/useToast";
import { useCurrencyStore, CURRENCY_PRESETS } from "@/app/store/useCurrencyStore";

export const SchoolSettings: React.FC = () => {
  const { user } = useAuth();
  const [school, setSchool] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const { uploadImage, requestSchoolNameChange } = useAccount();
  const { success, error } = useToast();
  const logoRef = useRef<HTMLInputElement>(null);

  const [form, setForm] = useState({
    email: "contact@oakridge.edu",
    phone: "+1 (555) 234-5678",
    address: "123 Education Lane, Academic City",
    activeYear: "2026-2027",
    currencySymbol: "$",
    currencyCode: "USD",
    schoolStartTime: "07:30",
    schoolEndTime: "14:00",
    autoBackupEnabled: true,
    backupScheduleTime: "02:00",
    backupFrequency: "daily",
  });

  const [saving, setSaving] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [nameReq, setNameReq] = useState("");
  const [reqSending, setReqSending] = useState(false);

  // Backup State
  const [backingUp, setBackingUp] = useState(false);
  const [lastBackup, setLastBackup] = useState<any>(null);
  const [backupStatus, setBackupStatus] = useState<any>(null);

  const loadData = async () => {
    setLoading(true);
    try {
      const [schoolData, backupData] = await Promise.allSettled([
        schoolsRestApi.getCurrentSchool(),
        backupRestApi.getStatus(),
      ]);

      if (schoolData.status === "fulfilled" && schoolData.value) {
        const data = schoolData.value;
        setSchool(data);
        setForm((prev) => ({
          ...prev,
          email: data.email ?? "contact@oakridge.edu",
          phone: data.phone ?? "+1 (555) 234-5678",
          address: data.address ?? "123 Education Lane, Academic City",
          activeYear: data.activeYear ?? "2026-2027",
          currencySymbol: data.currencySymbol ?? "$",
          currencyCode: data.currencyCode ?? "USD",
          schoolStartTime: data.schoolStartTime ?? "07:30",
          schoolEndTime: data.schoolEndTime ?? "14:00",
          autoBackupEnabled: data.autoBackupEnabled ?? true,
          backupScheduleTime: data.backupScheduleTime ?? "02:00",
          backupFrequency: data.backupFrequency ?? "daily",
        }));

        // Sync with store
        useCurrencyStore.getState().setCurrency(data.currencySymbol ?? "$", data.currencyCode ?? "USD");
        useCurrencyStore.getState().setSchoolHours(data.schoolStartTime ?? "07:30", data.schoolEndTime ?? "14:00");
      }

      if (backupData.status === "fulfilled" && backupData.value) {
        setBackupStatus(backupData.value);
      }
    } catch {
      // Ignored
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleLogo = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingLogo(true);
    try {
      await uploadImage(file, "logo");
      success("School logo updated.");
    } catch {
      error("Could not upload logo.");
    } finally {
      setUploadingLogo(false);
      if (logoRef.current) logoRef.current.value = "";
    }
  };

  const handleNameRequest = async () => {
    if (!nameReq.trim()) return;
    setReqSending(true);
    try {
      await requestSchoolNameChange(nameReq.trim());
      success("Name change requested — pending platform approval.");
      setNameReq("");
    } catch {
      error("Could not submit request.");
    } finally {
      setReqSending(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await schoolsRestApi.updateSchool({
        email: form.email || undefined,
        phone: form.phone || undefined,
        address: form.address || undefined,
        activeYear: form.activeYear || undefined,
        currencySymbol: form.currencySymbol,
        currencyCode: form.currencyCode,
        schoolStartTime: form.schoolStartTime,
        schoolEndTime: form.schoolEndTime,
        autoBackupEnabled: form.autoBackupEnabled,
        backupScheduleTime: form.backupScheduleTime,
        backupFrequency: form.backupFrequency,
      });

      // Update store state instantly
      useCurrencyStore.getState().setCurrency(form.currencySymbol, form.currencyCode);
      useCurrencyStore.getState().setSchoolHours(form.schoolStartTime, form.schoolEndTime);

      success("School settings saved successfully.");
    } catch {
      error("Could not save settings.");
    } finally {
      setSaving(false);
    }
  };

  const handleBackupNow = async () => {
    setBackingUp(true);
    try {
      const res = await backupRestApi.triggerNow();
      if (res && res.success) {
        setLastBackup(res);
        success(`Database backup generated: ${res.recordsCount} records archived.`);
        // Reload backup status
        const status = await backupRestApi.getStatus();
        setBackupStatus(status);
      } else {
        error("Backup process completed with warnings.");
      }
    } catch (e: any) {
      error(e?.message || "Failed to trigger automated database backup.");
    } finally {
      setBackingUp(false);
    }
  };

  const handlePresetSelect = (preset: { symbol: string; code: string }) => {
    setForm((prev) => ({
      ...prev,
      currencySymbol: preset.symbol,
      currencyCode: preset.code,
    }));
  };

  if (loading) {
    return (
      <div className="space-y-6 max-w-4xl mx-auto">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-48 w-full" />
        <Skeleton className="h-32 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <Settings className="w-5 h-5 text-[#0D9488]" />
            School Branding &amp; Operational Settings
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Configure currency, attendance timing gates, institution profile, and database backups
          </p>
        </div>

        <Button
          variant="primary"
          size="sm"
          onClick={handleSave}
          isLoading={saving}
          leftIcon={<Save className="w-4 h-4" />}
          className="text-xs shadow-sm"
        >
          Save All Settings
        </Button>
      </div>

      {/* Currency & Financial Configuration */}
      <Card className="border-teal-100 shadow-xs">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-teal-800">
            <Coins className="w-5 h-5 text-teal-600" />
            School Currency &amp; Financial Format
          </CardTitle>
          <p className="text-xs text-slate-500">
            Set your institution's official currency symbol (e.g. <strong>Rs</strong>, <strong>$</strong>, <strong>€</strong>, <strong>£</strong>). All fee challans, expense trackers, and financial reports will instantly reflect this currency.
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="text-xs font-semibold text-slate-700 block mb-1.5">
              Quick Currency Presets
            </label>
            <div className="flex flex-wrap gap-2">
              {CURRENCY_PRESETS.map((p) => {
                const active = form.currencySymbol === p.symbol && form.currencyCode === p.code;
                return (
                  <button
                    key={p.code}
                    type="button"
                    onClick={() => handlePresetSelect(p)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                      active
                        ? "bg-teal-600 text-white border-teal-600 shadow-2xs"
                        : "bg-white text-slate-700 border-slate-200 hover:border-teal-400 hover:bg-teal-50/50"
                    }`}
                  >
                    {p.label}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-slate-100">
            <Input
              label="Currency Symbol"
              value={form.currencySymbol}
              onChange={(e) => setForm({ ...form, currencySymbol: e.target.value })}
              placeholder="e.g. Rs, $, €, £"
              helperText="Prefix displayed alongside amounts (e.g. Rs 5,000)"
            />
            <Input
              label="Currency ISO Code"
              value={form.currencyCode}
              onChange={(e) => setForm({ ...form, currencyCode: e.target.value.toUpperCase() })}
              placeholder="e.g. PKR, USD, EUR"
              helperText="Official 3-letter currency abbreviation"
            />
          </div>
        </CardContent>
      </Card>

      {/* School Timing & Attendance Geofence Window */}
      <Card className="border-indigo-100 shadow-xs">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-indigo-900">
            <Clock className="w-5 h-5 text-indigo-600" />
            School Operating Hours &amp; Live Attendance Window
          </CardTitle>
          <p className="text-xs text-slate-500">
            Enforce strict attendance bounds. Teachers can only mark live GPS selfie attendance during official school hours. Outside this window, attendance is locked.
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="School Start Time (Attendance Opens)"
              type="time"
              value={form.schoolStartTime}
              onChange={(e) => setForm({ ...form, schoolStartTime: e.target.value })}
              helperText="Earliest time teachers can check in (e.g. 07:30 AM)"
            />
            <Input
              label="School End Time (Attendance Closes)"
              type="time"
              value={form.schoolEndTime}
              onChange={(e) => setForm({ ...form, schoolEndTime: e.target.value })}
              helperText="Latest time check-in is accepted (e.g. 02:00 PM)"
            />
          </div>
          <div className="p-3 rounded-xl bg-indigo-50/60 border border-indigo-100 text-xs text-indigo-800 flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
            <span>
              Selfie &amp; GPS attendance submitted before <strong>{form.schoolStartTime}</strong> or after <strong>{form.schoolEndTime}</strong> will be rejected by the server with a descriptive notification, preventing fraudulent off-hours marking.
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Automated Database Backup & Protection */}
      <Card className="border-emerald-100 shadow-xs">
        <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <CardTitle className="flex items-center gap-2 text-emerald-900">
              <Database className="w-5 h-5 text-emerald-600" />
              Automated Database Backups &amp; Data Protection
            </CardTitle>
            <p className="text-xs text-slate-500 mt-0.5">
              Scheduled and on-demand database snapshots to prevent any data loss
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={handleBackupNow}
            isLoading={backingUp}
            leftIcon={<Database className="w-4 h-4 text-emerald-600" />}
            className="text-xs font-semibold border-emerald-300 text-emerald-800 hover:bg-emerald-50"
          >
            Backup Database Now
          </Button>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="flex flex-col justify-center">
              <label className="text-xs font-semibold text-slate-700 block mb-1">
                Automated Backup
              </label>
              <div className="flex items-center gap-2 mt-1">
                <input
                  type="checkbox"
                  id="autoBackupToggle"
                  checked={form.autoBackupEnabled}
                  onChange={(e) => setForm({ ...form, autoBackupEnabled: e.target.checked })}
                  className="w-4 h-4 text-teal-600 rounded border-slate-300 focus:ring-teal-500"
                />
                <label htmlFor="autoBackupToggle" className="text-xs font-medium text-slate-700 cursor-pointer">
                  {form.autoBackupEnabled ? "Enabled (Active)" : "Disabled"}
                </label>
              </div>
            </div>

            <Input
              label="Backup Schedule Time"
              type="time"
              value={form.backupScheduleTime}
              onChange={(e) => setForm({ ...form, backupScheduleTime: e.target.value })}
              disabled={!form.autoBackupEnabled}
              helperText="Nightly execution time (e.g. 02:00 AM)"
            />

            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1.5">
                Backup Frequency
              </label>
              <select
                value={form.backupFrequency}
                onChange={(e) => setForm({ ...form, backupFrequency: e.target.value })}
                disabled={!form.autoBackupEnabled}
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500"
              >
                <option value="daily">Daily Snapshot (Recommended)</option>
                <option value="weekly">Weekly Snapshot</option>
                <option value="monthly">Monthly Archive</option>
              </select>
            </div>
          </div>

          {/* Backup Status / Last Backup Info */}
          {(lastBackup || backupStatus?.lastBackupAt) && (
            <div className="p-3.5 rounded-xl bg-emerald-50/80 border border-emerald-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2.5 text-emerald-900">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                <div>
                  <p className="font-semibold">
                    {lastBackup
                      ? "New Database Backup Generated!"
                      : `Last Successful Backup: ${new Date(backupStatus.lastBackupAt).toLocaleString()}`}
                  </p>
                  <p className="text-[11px] text-emerald-700">
                    {lastBackup
                      ? `${lastBackup.recordsCount} records secured (${((lastBackup.sizeBytes || 0) / 1024).toFixed(1)} KB)`
                      : `${backupStatus.availableBackups?.length || 1} archive(s) ready in secure storage`}
                  </p>
                </div>
              </div>

              {lastBackup?.downloadUrl && (
                <a
                  href={lastBackup.downloadUrl}
                  download={lastBackup.filename}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white font-semibold rounded-lg text-xs transition-colors shrink-0"
                >
                  <Download className="w-3.5 h-3.5" />
                  Download Archive (.json)
                </a>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Institution Profile */}
      <Card>
        <CardHeader>
          <CardTitle>Institution Profile</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Current School Name"
              value={school?.name ?? ""}
              disabled
              helperText="Name changes require platform approval"
            />
            <Input
              label="Tenant Code"
              value={school?.code ?? ""}
              disabled
              helperText="Unique identifier for multi-tenant scoping"
            />
          </div>

          {/* Request a school-name change (needs super-admin approval) */}
          <div className="flex flex-col sm:flex-row sm:items-end gap-3 p-3 rounded-xl bg-amber-50/60 border border-amber-100">
            <div className="flex-1">
              <Input
                label="Request a new school name"
                value={nameReq}
                onChange={(e) => setNameReq(e.target.value)}
                placeholder="e.g. Oakridge International Academy"
                helperText="Submitted to the platform super-admin for approval."
              />
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleNameRequest}
              isLoading={reqSending}
              disabled={!nameReq.trim()}
              leftIcon={<SendHorizonal className="w-4 h-4" />}
              className="text-xs"
            >
              Request Change
            </Button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Official Email"
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
            />
            <Input
              label="Phone Number"
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Campus Address"
              value={form.address}
              onChange={(e) => setForm({ ...form, address: e.target.value })}
            />
            <Input
              label="Active Academic Year"
              value={form.activeYear}
              onChange={(e) => setForm({ ...form, activeYear: e.target.value })}
              placeholder="2026-2027"
            />
          </div>
        </CardContent>
      </Card>

      {/* School Logo */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ImageUp className="w-4 h-4 text-[#0D9488]" />
            School Logo
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            {school?.logoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={school.logoUrl}
                alt={school.name}
                className="w-16 h-16 rounded-xl object-cover border border-slate-200"
              />
            ) : (
              <div className="w-16 h-16 rounded-xl bg-slate-100 flex items-center justify-center text-slate-300">
                <ImageUp className="w-6 h-6" />
              </div>
            )}
            <div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => logoRef.current?.click()}
                isLoading={uploadingLogo}
                leftIcon={<ImageUp className="w-4 h-4" />}
                className="text-xs"
              >
                Upload Logo
              </Button>
              <p className="text-[11px] text-slate-400 mt-1.5">
                Appears in the sidebar and at the top of report cards &amp; fee challans.
              </p>
              <input
                ref={logoRef}
                type="file"
                accept="image/*"
                onChange={handleLogo}
                className="hidden"
              />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
