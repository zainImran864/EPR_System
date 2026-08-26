"use client";

import React, { useEffect, useState } from "react";
import { Settings, Save, Palette, Check, Lock } from "lucide-react";
import { useQuery, useMutation } from "convex/react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Skeleton } from "@/components/ui/Skeleton";
import { schoolsApi } from "@/app/api/schools";
import { useAuth } from "@/app/hooks/useAuth";
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
  const { success, error } = useToast();

  const [form, setForm] = useState({
    email: "",
    phone: "",
    address: "",
    primaryColor: "#0D9488",
    activeYear: "",
  });
  const [saving, setSaving] = useState(false);

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
      <div className="space-y-6 max-w-4xl">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-48 w-full" />
        <Skeleton className="h-32 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl">
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
              label="School Name"
              value={school?.name ?? ""}
              disabled
              rightIcon={<Lock className="w-3.5 h-3.5" />}
              helperText="Name changes require platform approval (request coming soon)"
            />
            <Input
              label="Tenant Code"
              value={school?.code ?? ""}
              disabled
              helperText="Unique identifier for multi-tenant scoping"
            />
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
