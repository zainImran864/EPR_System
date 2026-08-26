"use client";

import React, { useEffect, useRef, useState } from "react";
import { Settings, Save, Palette, Check, ImageUp, SendHorizonal } from "lucide-react";
import { useQuery, useMutation } from "convex/react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Skeleton } from "@/components/ui/Skeleton";
import { schoolsApi } from "@/app/api/schools";
import { useAuth } from "@/app/hooks/useAuth";
import { useAccount } from "@/app/hooks/useAccount";
import { useToast } from "@/app/hooks/useToast";

const THEME_COLORS = [
  { name: "Teal", hex: "#0D9488" },
  { name: "Royal Blue", hex: "#2563EB" },
  { name: "Indigo", hex: "#4F46E5" },
  { name: "Emerald", hex: "#059669" },
  { name: "Crimson", hex: "#DC2626" },
  { name: "Violet", hex: "#7C3AED" },
];

export const SchoolSettings: React.FC = () => {
  const { user } = useAuth();
  const schoolId = user?.schoolId ?? null;
  const school = useQuery(schoolsApi.getById, schoolId ? { schoolId } : "skip");
  const updateBranding = useMutation(schoolsApi.updateBranding);
  const { uploadImage, requestSchoolNameChange } = useAccount();
  const { success, error } = useToast();
  const logoRef = useRef<HTMLInputElement>(null);

  const [form, setForm] = useState({
    email: "",
    phone: "",
    address: "",
    primaryColor: "#0D9488",
    activeYear: "",
  });
  const [saving, setSaving] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [nameReq, setNameReq] = useState("");
  const [reqSending, setReqSending] = useState(false);

  useEffect(() => {
    if (school) {
      setForm({
        email: school.email ?? "",
        phone: school.phone ?? "",
        address: school.address ?? "",
        primaryColor: school.primaryColor ?? "#0D9488",
        activeYear: school.activeYear ?? "",
      });
    }
  }, [school]);

  const loading = schoolId === null || school === undefined;

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
    if (!schoolId) return;
    setSaving(true);
    try {
      await updateBranding({
        schoolId,
        email: form.email || undefined,
        phone: form.phone || undefined,
        address: form.address || undefined,
        primaryColor: form.primaryColor,
        activeYear: form.activeYear || undefined,
      });
      success("Settings saved.");
    } catch {
      error("Could not save settings.");
    } finally {
      setSaving(false);
    }
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
            School Branding & Settings
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Configure your institution profile, active session, and theme palette
          </p>
        </div>

        <Button
          variant="primary"
          size="sm"
          onClick={handleSave}
          isLoading={saving}
          leftIcon={<Save className="w-4 h-4" />}
          className="text-xs"
        >
          Save Changes
        </Button>
      </div>

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
                Appears in the sidebar and at the top of report cards & fee challans.
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

      {/* Theme */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Palette className="w-4 h-4 text-[#0D9488]" />
            School Theme & Branding Colors
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <span className="text-xs font-semibold text-slate-700 block mb-2">
              Primary Brand Accent
            </span>
            <div className="flex flex-wrap gap-3">
              {THEME_COLORS.map((color) => {
                const isSelected = form.primaryColor === color.hex;
                return (
                  <button
                    key={color.hex}
                    type="button"
                    onClick={() => setForm({ ...form, primaryColor: color.hex })}
                    className={`flex items-center gap-2 px-3 py-2 rounded-xl border text-xs font-medium transition-all ${
                      isSelected
                        ? "border-slate-800 bg-slate-50 shadow-xs ring-2 ring-slate-800/10"
                        : "border-slate-200 hover:bg-slate-50"
                    }`}
                  >
                    <span
                      className="w-4 h-4 rounded-full shadow-2xs shrink-0 flex items-center justify-center text-white"
                      style={{ backgroundColor: color.hex }}
                    >
                      {isSelected && <Check className="w-2.5 h-2.5" />}
                    </span>
                    <span>{color.name}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
