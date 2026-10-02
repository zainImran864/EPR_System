"use client";

import React, { useState } from "react";
import {
  User,
  ShieldCheck,
  Palette,
  Camera,
  Award,
  Calendar,
  Mail,
  Phone,
  Building,
  CheckCircle2,
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Avatar } from "@/components/ui/Avatar";
import { useAuth } from "@/app/hooks/useAuth";
import { AccountSettings } from "@/modules/settings/AccountSettings";
import { KycVerificationCard } from "@/modules/settings/KycVerificationCard";

export interface UserProfileViewProps {
  roleName: string;
  roleType: "TEACHER" | "PARENT" | "ADMIN" | "STUDENT" | "SUPERADMIN";
}

export const UserProfileView: React.FC<UserProfileViewProps> = ({
  roleName,
  roleType,
}) => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<"overview" | "security" | "kyc">("overview");

  const schoolName = user?.school?.name || "Oakridge International School";
  const userEmail = user?.email || `${user?.name?.toLowerCase().replace(/\s+/g, ".") || "user"}@school.edu`;

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Profile Banner / Header Card */}
      <div className="relative overflow-hidden rounded-3xl bg-linear-to-r from-teal-900 via-teal-800 to-slate-900 p-6 sm:p-8 text-white shadow-xl">
        <div className="absolute right-0 top-0 -mt-12 -mr-12 w-64 h-64 rounded-full bg-teal-500/10 blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center gap-6">
          <Avatar
            name={user?.name || roleName}
            src={user?.avatarUrl || undefined}
            size="xl"
            className="w-20 h-20 sm:w-24 sm:h-24 ring-4 ring-white/20 text-2xl"
          />
          <div className="flex-1 space-y-1.5">
            <div className="flex flex-wrap items-center gap-2.5">
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
                {user?.name || roleName}
              </h1>
              <Badge variant="primary" size="sm" className="bg-teal-500/30 text-teal-200 border-teal-400/40 uppercase">
                {roleName}
              </Badge>
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                <CheckCircle2 className="w-3.5 h-3.5" />
                Active Account
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-4 text-xs text-teal-100/80 pt-1">
              <span className="flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5 text-teal-300" />
                {userEmail}
              </span>
              {user?.phone && (
                <span className="flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5 text-teal-300" />
                  {user.phone}
                </span>
              )}
              <span className="flex items-center gap-1.5">
                <Building className="w-3.5 h-3.5 text-teal-300" />
                {schoolName}
              </span>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-2 mt-6 pt-4 border-t border-white/10 text-xs font-medium">
          <button
            onClick={() => setActiveTab("overview")}
            className={`px-4 py-2 rounded-xl transition-all ${
              activeTab === "overview"
                ? "bg-white text-teal-900 font-bold shadow-md"
                : "text-teal-100 hover:bg-white/10"
            }`}
          >
            Profile &amp; Settings
          </button>
          <button
            onClick={() => setActiveTab("kyc")}
            className={`px-4 py-2 rounded-xl transition-all flex items-center gap-1.5 ${
              activeTab === "kyc"
                ? "bg-white text-teal-900 font-bold shadow-md"
                : "text-teal-100 hover:bg-white/10"
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            Biometric KYC &amp; Real-Time Face Match
          </button>
        </div>
      </div>

      {/* Main Tab Content */}
      {activeTab === "overview" && (
        <div className="pt-2">
          <AccountSettings showProfileSection={true} />
        </div>
      )}

      {activeTab === "kyc" && (
        <div className="pt-2 max-w-4xl mx-auto space-y-4">
          <KycVerificationCard
            userRole={
              roleType === "TEACHER" || roleType === "PARENT" || roleType === "ADMIN"
                ? roleType
                : "TEACHER"
            }
          />
        </div>
      )}
    </div>
  );
};
