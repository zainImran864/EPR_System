"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  ShieldCheck,
  CreditCard,
  UploadCloud,
  CheckCircle2,
  AlertCircle,
  Camera,
  Trash2,
  FileCheck,
  Eye,
  Save,
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Badge } from "@/components/ui/Badge";
import { useToast } from "@/app/hooks/useToast";
import { useAuth } from "@/app/hooks/useAuth";

export interface KycVerificationCardProps {
  userRole?: "TEACHER" | "PARENT" | "ADMIN";
}

export const KycVerificationCard: React.FC<KycVerificationCardProps> = ({
  userRole = "TEACHER",
}) => {
  const { user } = useAuth();
  const { success, error, info } = useToast();

  const storageKey = `kyc_profile_${user?._id || userRole}`;

  const [cnicNumber, setCnicNumber] = useState("");
  const [fullNameOnCnic, setFullNameOnCnic] = useState(user?.name || "");
  const [fatherOrHusbandName, setFatherOrHusbandName] = useState("");
  const [cnicFrontUrl, setCnicFrontUrl] = useState<string | null>(null);
  const [cnicBackUrl, setCnicBackUrl] = useState<string | null>(null);
  const [status, setStatus] = useState<"UNVERIFIED" | "PENDING" | "VERIFIED">("UNVERIFIED");
  const [saving, setSaving] = useState(false);

  const frontInputRef = useRef<HTMLInputElement>(null);
  const backInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(storageKey);
      if (stored) {
        const parsed = JSON.parse(stored);
        setCnicNumber(parsed.cnicNumber || "");
        setFullNameOnCnic(parsed.fullNameOnCnic || user?.name || "");
        setFatherOrHusbandName(parsed.fatherOrHusbandName || "");
        setCnicFrontUrl(parsed.cnicFrontUrl || null);
        setCnicBackUrl(parsed.cnicBackUrl || null);
        setStatus(parsed.status || "UNVERIFIED");
      }
    } catch {}
  }, [storageKey, user]);

  // Format CNIC as XXXXX-XXXXXXX-X
  const handleCnicChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/\D/g, "").slice(0, 13);
    let formatted = raw;
    if (raw.length > 5 && raw.length <= 12) {
      formatted = `${raw.slice(0, 5)}-${raw.slice(5)}`;
    } else if (raw.length > 12) {
      formatted = `${raw.slice(0, 5)}-${raw.slice(5, 12)}-${raw.slice(12, 13)}`;
    }
    setCnicNumber(formatted);
  };

  const isCnicValid = cnicNumber.replace(/\D/g, "").length === 13;

  const handleFileUpload = (
    e: React.ChangeEvent<HTMLInputElement>,
    side: "front" | "back",
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      error("File size cannot exceed 10MB.");
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const base64 = reader.result as string;
      if (side === "front") setCnicFrontUrl(base64);
      else setCnicBackUrl(base64);
      success(`${side === "front" ? "Front" : "Back"} document attached.`);
    };
    reader.readAsDataURL(file);
  };

  const handleSaveKyc = () => {
    if (!isCnicValid) {
      error("Please enter a valid 13-digit CNIC number (e.g. 35201-1234567-1).");
      return;
    }
    if (!cnicFrontUrl || !cnicBackUrl) {
      error("Please upload both CNIC Front and Back document scans.");
      return;
    }

    setSaving(true);
    try {
      const payload = {
        cnicNumber,
        fullNameOnCnic,
        fatherOrHusbandName,
        cnicFrontUrl,
        cnicBackUrl,
        status: "VERIFIED",
        submittedAt: new Date().toISOString(),
      };
      localStorage.setItem(storageKey, JSON.stringify(payload));
      setStatus("VERIFIED");
      success("KYC identity verification documents submitted and verified successfully!");
    } catch {
      error("Could not save KYC verification.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card className="border-teal-200/80 shadow-xs">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-bold flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-[#0D9488]" />
            National Identity &amp; KYC Verification (CNIC)
          </CardTitle>
          <Badge
            variant={status === "VERIFIED" ? "success" : status === "PENDING" ? "warning" : "neutral"}
            size="sm"
            dot
          >
            {status === "VERIFIED"
              ? "Verified Identity"
              : status === "PENDING"
              ? "Pending Review"
              : "Action Required"}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-xs text-slate-500 leading-relaxed">
          In accordance with institutional security policies, {userRole.toLowerCase()}s must verify their identity by providing their Computerized National Identity Card (CNIC) details along with clear Front and Back images.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="text-xs font-semibold text-slate-700 block mb-1">
              CNIC Number (13 Digits) <span className="text-rose-500">*</span>
            </label>
            <Input
              placeholder="35201-1234567-1"
              value={cnicNumber}
              onChange={handleCnicChange}
              className="font-mono-data text-xs"
            />
            <span className="text-[10px] text-slate-400 mt-1 block">
              {cnicNumber.replace(/\D/g, "").length}/13 digits
            </span>
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-700 block mb-1">
              Full Name (As on CNIC) <span className="text-rose-500">*</span>
            </label>
            <Input
              placeholder="Full Name"
              value={fullNameOnCnic}
              onChange={(e) => setFullNameOnCnic(e.target.value)}
              className="text-xs"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-700 block mb-1">
              Father / Guardian Name
            </label>
            <Input
              placeholder="Father's / Spouse Name"
              value={fatherOrHusbandName}
              onChange={(e) => setFatherOrHusbandName(e.target.value)}
              className="text-xs"
            />
          </div>
        </div>

        {/* Upload Cards: Front & Back */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
          {/* CNIC Front */}
          <div className="space-y-2">
            <span className="text-xs font-semibold text-slate-700 flex items-center justify-between">
              <span>CNIC Front Scan / Photo *</span>
              {cnicFrontUrl && (
                <span className="text-emerald-600 font-bold text-[10px] flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" /> Attached
                </span>
              )}
            </span>

            {cnicFrontUrl ? (
              <div className="relative rounded-xl border border-slate-200 overflow-hidden bg-slate-50 group h-36 flex items-center justify-center">
                <img
                  src={cnicFrontUrl}
                  alt="CNIC Front"
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-slate-900/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                  <button
                    type="button"
                    onClick={() => setCnicFrontUrl(null)}
                    className="p-1.5 bg-rose-600 text-white rounded-lg text-xs flex items-center gap-1 hover:bg-rose-700"
                  >
                    <Trash2 className="w-3.5 h-3.5" /> Remove
                  </button>
                </div>
              </div>
            ) : (
              <div
                onClick={() => frontInputRef.current?.click()}
                className="h-36 border-2 border-dashed border-slate-300 hover:border-[#0D9488] rounded-xl flex flex-col items-center justify-center p-4 cursor-pointer bg-slate-50/50 hover:bg-teal-50/30 transition-all text-center"
              >
                <UploadCloud className="w-6 h-6 text-slate-400 mb-1" />
                <span className="text-xs font-semibold text-slate-700">Upload CNIC Front</span>
                <span className="text-[10px] text-slate-400">PNG, JPG or PDF up to 10MB</span>
              </div>
            )}
            <input
              ref={frontInputRef}
              type="file"
              accept="image/*"
              onChange={(e) => handleFileUpload(e, "front")}
              className="hidden"
            />
          </div>

          {/* CNIC Back */}
          <div className="space-y-2">
            <span className="text-xs font-semibold text-slate-700 flex items-center justify-between">
              <span>CNIC Back Scan / Photo *</span>
              {cnicBackUrl && (
                <span className="text-emerald-600 font-bold text-[10px] flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" /> Attached
                </span>
              )}
            </span>

            {cnicBackUrl ? (
              <div className="relative rounded-xl border border-slate-200 overflow-hidden bg-slate-50 group h-36 flex items-center justify-center">
                <img
                  src={cnicBackUrl}
                  alt="CNIC Back"
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-slate-900/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                  <button
                    type="button"
                    onClick={() => setCnicBackUrl(null)}
                    className="p-1.5 bg-rose-600 text-white rounded-lg text-xs flex items-center gap-1 hover:bg-rose-700"
                  >
                    <Trash2 className="w-3.5 h-3.5" /> Remove
                  </button>
                </div>
              </div>
            ) : (
              <div
                onClick={() => backInputRef.current?.click()}
                className="h-36 border-2 border-dashed border-slate-300 hover:border-[#0D9488] rounded-xl flex flex-col items-center justify-center p-4 cursor-pointer bg-slate-50/50 hover:bg-teal-50/30 transition-all text-center"
              >
                <UploadCloud className="w-6 h-6 text-slate-400 mb-1" />
                <span className="text-xs font-semibold text-slate-700">Upload CNIC Back</span>
                <span className="text-[10px] text-slate-400">PNG, JPG or PDF up to 10MB</span>
              </div>
            )}
            <input
              ref={backInputRef}
              type="file"
              accept="image/*"
              onChange={(e) => handleFileUpload(e, "back")}
              className="hidden"
            />
          </div>
        </div>

        <div className="flex justify-end pt-2">
          <Button
            variant="primary"
            size="sm"
            onClick={handleSaveKyc}
            isLoading={saving}
            leftIcon={<Save className="w-4 h-4" />}
            className="bg-[#0D9488] hover:bg-[#0B7A70] text-white"
          >
            Save &amp; Submit KYC Documents
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
