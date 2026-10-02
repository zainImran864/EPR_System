"use client";

import React, { useRef, useState } from "react";
import { useQuery } from "convex/react";
import {
  User,
  Lock,
  ShieldCheck,
  BellRing,
  Camera,
  Save,
  Monitor,
  Trash2,
  Palette,
  Check,
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Switch } from "@/components/ui/Switch";
import { Avatar } from "@/components/ui/Avatar";
import { useAuth } from "@/app/hooks/useAuth";
import { useAccount } from "@/app/hooks/useAccount";
import { useAuthStore } from "@/app/store/useAuthStore";
import { accountApi } from "@/app/api/account";
import { useToast } from "@/app/hooks/useToast";
import { THEME_OPTIONS, DEFAULT_THEME } from "@/app/lib/theme";
import { TwoFactorModal } from "./TwoFactorModal";

/** Universal per-user settings — used by every role's /settings route. */
export const AccountSettings: React.FC = () => {
  const { user } = useAuth();
  const { token } = useAuthStore();
  const {
    updateProfile,
    changePassword,
    setNotifications,
    setThemeColor,
    uploadImage,
    deleteTrustedDevice,
  } = useAccount();
  const { success, error } = useToast();
  const fileRef = useRef<HTMLInputElement>(null);

  const [twoFAModal, setTwoFAModal] = useState<null | "enroll" | "disable">(null);
  const devices = useQuery(
    accountApi.listTrustedDevices,
    token ? { token } : "skip"
  );

  const [profile, setProfile] = useState({
    name: user?.name ?? "",
    phone: user?.phone ?? "",
  });
  const [pw, setPw] = useState({ current: "", next: "", confirm: "" });
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingPw, setSavingPw] = useState(false);
  const [uploading, setUploading] = useState(false);

  const twoFA = user?.twoFactorEnabled ?? false;
  const notifOn = user?.notificationsEnabled ?? true;

  const handleProfile = async () => {
    setSavingProfile(true);
    try {
      await updateProfile(profile.name, profile.phone);
      success("Profile updated.");
    } catch {
      error("Could not update profile.");
    } finally {
      setSavingProfile(false);
    }
  };

  const handlePassword = async () => {
    if (pw.next.length < 6) return error("New password must be at least 6 characters.");
    if (pw.next !== pw.confirm) return error("Passwords do not match.");
    setSavingPw(true);
    try {
      const res = await changePassword(pw.current, pw.next);
      if (res?.ok) {
        success("Password changed.");
        setPw({ current: "", next: "", confirm: "" });
      } else if (res?.error === "wrong-password") {
        error("Current password is incorrect.");
      } else {
        error("Could not change password.");
      }
    } catch {
      error("Could not change password.");
    } finally {
      setSavingPw(false);
    }
  };

  const handleAvatar = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      await uploadImage(file, "avatar");
      success("Profile picture updated.");
    } catch {
      error("Could not upload picture.");
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  // Toggling opens the QR/code modal instead of flipping the flag directly.
  const toggle2FA = (v: boolean) => setTwoFAModal(v ? "enroll" : "disable");

  const currentTheme = user?.themeColor ?? DEFAULT_THEME;
  const chooseTheme = async (hex: string) => {
    try {
      await setThemeColor(hex); // applies instantly, then persists
      success("Sidebar theme updated.");
    } catch {
      error("Could not update theme.");
    }
  };

  const removeDevice = async (id: string) => {
    try {
      await deleteTrustedDevice(id);
      success("Device removed — it will require 2FA on next login.");
    } catch {
      error("Could not remove device.");
    }
  };

  const toggleNotif = async (v: boolean) => {
    try {
      await setNotifications(v);
      success(v ? "Notifications enabled." : "Notifications muted.");
    } catch {
      error("Could not update notifications.");
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div>
        <h2 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
          <User className="w-5 h-5 text-[#0D9488]" />
          My Account
        </h2>
        <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
          Manage your profile, password, security and notification preferences.
        </p>
      </div>

      {/* Profile + avatar */}
      <Card>
        <CardHeader>
          <CardTitle>Profile</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-4">
            <div className="relative">
              <Avatar name={user?.name ?? "User"} src={user?.avatarUrl ?? undefined} size="xl" />
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-[#0D9488] text-white flex items-center justify-center shadow-md hover:bg-[#0B7A70] transition-colors"
                title="Change picture"
                disabled={uploading}
              >
                <Camera className="w-3.5 h-3.5" />
              </button>
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                onChange={handleAvatar}
                className="hidden"
              />
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-900">{user?.email}</p>
              <p className="text-xs text-slate-500 capitalize">{user?.role}</p>
              {uploading && <p className="text-[11px] text-teal-600 mt-0.5">Uploading…</p>}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Full Name"
              value={profile.name}
              onChange={(e) => setProfile({ ...profile, name: e.target.value })}
            />
            <Input
              label="Phone"
              value={profile.phone}
              onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
            />
          </div>
          <div className="flex justify-end">
            <Button
              variant="primary"
              size="sm"
              onClick={handleProfile}
              isLoading={savingProfile}
              leftIcon={<Save className="w-4 h-4" />}
            >
              Save Profile
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Password */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lock className="w-4 h-4 text-[#0D9488]" />
            Change Password
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Input
            label="Current Password"
            type="password"
            value={pw.current}
            onChange={(e) => setPw({ ...pw, current: e.target.value })}
          />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="New Password"
              type="password"
              value={pw.next}
              onChange={(e) => setPw({ ...pw, next: e.target.value })}
            />
            <Input
              label="Confirm New Password"
              type="password"
              value={pw.confirm}
              onChange={(e) => setPw({ ...pw, confirm: e.target.value })}
            />
          </div>
          <div className="flex justify-end">
            <Button
              variant="outline"
              size="sm"
              onClick={handlePassword}
              isLoading={savingPw}
              disabled={!pw.current || !pw.next}
            >
              Update Password
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Security + notifications */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-[#0D9488]" />
            Security & Notifications
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-1">
          <div className="flex items-center justify-between py-3 border-b border-slate-100">
            <div className="flex items-start gap-3">
              <ShieldCheck className="w-4 h-4 text-slate-400 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-slate-800">
                  Two-Factor Authentication
                </p>
                <p className="text-xs text-slate-500">
                  Add an extra layer of security to your login.
                </p>
              </div>
            </div>
            <Switch checked={twoFA} onCheckedChange={toggle2FA} />
          </div>
          <div className="flex items-center justify-between py-3">
            <div className="flex items-start gap-3">
              <BellRing className="w-4 h-4 text-slate-400 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-slate-800">Notifications</p>
                <p className="text-xs text-slate-500">
                  Receive announcement toasts and alerts.
                </p>
              </div>
            </div>
            <Switch checked={notifOn} onCheckedChange={toggleNotif} />
          </div>
        </CardContent>
      </Card>

      {/* Sidebar theme (per-user — only you see your colour) */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Palette className="w-4 h-4" style={{ color: currentTheme }} />
            Sidebar Theme
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-xs text-slate-500 mb-3">
            Pick your sidebar accent colour. This is personal to your account — other
            users keep their own.
          </p>
          <div className="flex flex-wrap gap-3">
            {THEME_OPTIONS.map((c) => {
              const selected = currentTheme.toLowerCase() === c.hex.toLowerCase();
              const isDefault = c.hex === DEFAULT_THEME;
              return (
                <button
                  key={c.hex}
                  type="button"
                  onClick={() => chooseTheme(c.hex)}
                  className={`flex items-center gap-2 px-3 py-2 rounded-xl border text-xs font-medium transition-all ${
                    selected
                      ? "border-slate-800 bg-slate-50 ring-2 ring-slate-800/10"
                      : "border-slate-200 hover:bg-slate-50"
                  }`}
                >
                  <span
                    className="w-4 h-4 rounded-full shrink-0 flex items-center justify-center text-white"
                    style={{ backgroundColor: c.hex }}
                  >
                    {selected && <Check className="w-2.5 h-2.5" />}
                  </span>
                  <span>
                    {c.name}
                    {isDefault && <span className="text-slate-400"> (Default)</span>}
                  </span>
                </button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Trusted devices (only relevant when 2FA is on) */}
      {twoFA && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Monitor className="w-4 h-4 text-[#0D9488]" />
              Remembered Devices
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-slate-500 mb-3">
              These browsers skip the 2FA code at login. Remove one to require the code
              again there.
            </p>
            {!devices || devices.length === 0 ? (
              <p className="text-xs text-slate-400 py-3 text-center">
                No remembered devices yet.
              </p>
            ) : (
              <div className="divide-y divide-slate-100">
                {devices.map((d) => (
                  <div key={d._id} className="flex items-center justify-between py-3">
                    <div className="flex items-center gap-3">
                      <Monitor className="w-4 h-4 text-slate-400" />
                      <div>
                        <p className="text-sm font-medium text-slate-800">{d.label}</p>
                        <p className="text-[11px] text-slate-400">
                          Added {new Date(d.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="xs"
                      onClick={() => removeDevice(d._id)}
                      className="text-slate-400 hover:text-rose-600"
                      leftIcon={<Trash2 className="w-4 h-4" />}
                    >
                      Remove
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* 2FA enroll / disable modal */}
      {twoFAModal && (
        <TwoFactorModal
          mode={twoFAModal}
          isOpen={Boolean(twoFAModal)}
          onClose={() => setTwoFAModal(null)}
          onSuccess={() => setTwoFAModal(null)}
        />
      )}
    </div>
  );
};
