"use client";

import React, { useRef, useState } from "react";
import { User, Lock, ShieldCheck, BellRing, Camera, Save } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Switch } from "@/components/ui/Switch";
import { Avatar } from "@/components/ui/Avatar";
import { useAuth } from "@/app/hooks/useAuth";
import { useAccount } from "@/app/hooks/useAccount";
import { useToast } from "@/app/hooks/useToast";

/** Universal per-user settings — used by every role's /settings route. */
export const AccountSettings: React.FC = () => {
  const { user } = useAuth();
  const {
    updateProfile,
    changePassword,
    setTwoFactor,
    setNotifications,
    uploadImage,
  } = useAccount();
  const { success, error } = useToast();
  const fileRef = useRef<HTMLInputElement>(null);

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

  const toggle2FA = async (v: boolean) => {
    try {
      await setTwoFactor(v);
      success(v ? "Two-factor authentication enabled." : "Two-factor disabled.");
    } catch {
      error("Could not update 2FA.");
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
    <div className="space-y-6 max-w-3xl">
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
    </div>
  );
};
