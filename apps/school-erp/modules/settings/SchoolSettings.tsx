"use client";

import React, { useState } from "react";
import { Settings, Save, Palette, Globe, School, Check } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Badge } from "@/components/ui/Badge";

export const SchoolSettings: React.FC = () => {
  const [settings, setSettings] = useState({
    name: "Oakridge International Academy",
    code: "OAK-RIDGE",
    primaryColor: "#0D9488",
    activeYear: "2026-2027",
    email: "admissions@oakridge.edu",
    phone: "+1 (555) 234-5678",
    address: "450 Academic Boulevard, Cambridge, MA",
    customDomain: "portal.oakridge.edu",
  });

  const [isSaved, setIsSaved] = useState(false);

  const themeColors = [
    { name: "Teal (Default)", hex: "#0D9488" },
    { name: "Royal Blue", hex: "#2563EB" },
    { name: "Indigo", hex: "#4F46E5" },
    { name: "Emerald Green", hex: "#059669" },
    { name: "Crimson", hex: "#DC2626" },
  ];

  const handleSave = () => {
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 3000);
  };

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <Settings className="w-5 h-5 text-[#0D9488]" />
            School Branding & Institutional Settings
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Configure multi-tenant branding, active session, domain mapping, and theme palette
          </p>
        </div>

        <Button
          variant="primary"
          size="sm"
          onClick={handleSave}
          leftIcon={<Save className="w-4 h-4" />}
          className="text-xs"
        >
          {isSaved ? "Settings Saved!" : "Save Changes"}
        </Button>
      </div>

      {/* Settings Cards */}
      <Card>
        <CardHeader>
          <CardTitle>Institution Profile</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="School Name"
              value={settings.name}
              onChange={(e) => setSettings({ ...settings, name: e.target.value })}
            />
            <Input
              label="Tenant Code"
              value={settings.code}
              disabled
              helperText="Unique identifier for multi-tenant database scoping"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Official Email"
              type="email"
              value={settings.email}
              onChange={(e) => setSettings({ ...settings, email: e.target.value })}
            />
            <Input
              label="Phone Number"
              value={settings.phone}
              onChange={(e) => setSettings({ ...settings, phone: e.target.value })}
            />
          </div>

          <Input
            label="Campus Address"
            value={settings.address}
            onChange={(e) => setSettings({ ...settings, address: e.target.value })}
          />
        </CardContent>
      </Card>

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
              {themeColors.map((color) => {
                const isSelected = settings.primaryColor === color.hex;
                return (
                  <button
                    key={color.hex}
                    type="button"
                    onClick={() =>
                      setSettings({ ...settings, primaryColor: color.hex })
                    }
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

