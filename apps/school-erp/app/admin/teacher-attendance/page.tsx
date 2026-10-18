"use client";

import React, { useState, useEffect, useCallback } from "react";
import QRCode from "qrcode";
import { attendanceRestApi } from "@/app/api/client";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Input } from "@/components/ui/Input";
import { useToast } from "@/app/hooks/useToast";
import {
  MapPin,
  Users,
  CheckCircle2,
  Clock,
  FileText,
  Navigation,
  RefreshCw,
  ShieldCheck,
  XCircle,
  Camera,
  Search,
  QrCode,
  Smartphone,
  ExternalLink,
} from "lucide-react";

export default function AdminTeacherAttendancePage() {
  const { success, error: toastError } = useToast();

  const todayStr = new Date().toISOString().split("T")[0];
  const [selectedDate, setSelectedDate] = useState<string>(todayStr);
  const [activeTab, setActiveTab] = useState<"attendance" | "leaves" | "geofence">(
    "attendance"
  );
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(true);
  const [savingLocation, setSavingLocation] = useState<boolean>(false);
  const [reviewingLeaveId, setReviewingLeaveId] = useState<string | null>(null);
  const [previewPhotoModal, setPreviewPhotoModal] = useState<any | null>(null);
  const [isMobileDevice, setIsMobileDevice] = useState<boolean>(false);

  // Admin Mobile QR Session (Desktop only — hidden when Admin is already on mobile)
  const [qrSession, setQrSession] = useState<any>(null);
  const [qrDataUrl, setQrDataUrl] = useState<string>("");
  const [qrMobileUrl, setQrMobileUrl] = useState<string>("");
  const [qrLoading, setQrLoading] = useState<boolean>(false);

  const [school, setSchool] = useState<any>({
    name: "Oakridge International School",
    address: "Main Campus",
    latitude: 31.5204,
    longitude: 74.3587,
    geofenceRadiusMeters: 250,
  });
  const [summary, setSummary] = useState<any>({
    totalTeachers: 0,
    present: 0,
    late: 0,
    onLeave: 0,
    absent: 0,
    unmarked: 0,
  });
  const [records, setRecords] = useState<any[]>([]);
  const [leaves, setLeaves] = useState<any[]>([]);

  // Geofence config form
  const [geoLat, setGeoLat] = useState<string>("31.5204");
  const [geoLng, setGeoLng] = useState<string>("74.3587");
  const [geoRadius, setGeoRadius] = useState<string>("250");
  const [geoAddress, setGeoAddress] = useState<string>("");

  useEffect(() => {
    if (typeof window === "undefined") return;
    const checkMobile = () => {
      const ua = navigator.userAgent || "";
      const mobileUa = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
        ua
      );
      setIsMobileDevice(mobileUa || window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [attData, leavesData] = await Promise.all([
        attendanceRestApi.getTeacherRecords(selectedDate),
        attendanceRestApi.listLeaves(),
      ]);

      if (attData?.school) {
        setSchool(attData.school);
        setGeoLat(String(attData.school.latitude ?? 31.5204));
        setGeoLng(String(attData.school.longitude ?? 74.3587));
        setGeoRadius(String(attData.school.geofenceRadiusMeters ?? 250));
        setGeoAddress(attData.school.address || "");
      }
      if (attData?.summary) {
        setSummary(attData.summary);
      }
      setRecords(Array.isArray(attData?.records) ? attData.records : []);
      setLeaves(Array.isArray(leavesData) ? leavesData : []);
    } catch (err) {
      console.error("Failed to load admin teacher attendance:", err);
    } finally {
      setLoading(false);
    }
  }, [selectedDate]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Create Admin QR session on desktop so Admin can scan QR on mobile to set school location
  const startAdminQrSession = useCallback(async () => {
    if (isMobileDevice) return;
    setQrLoading(true);
    const origin =
      typeof window !== "undefined"
        ? window.location.origin
        : "http://127.0.0.1:3000";
    const instantSessionId = `qr_admin_${Date.now().toString(36)}`;
    const instantUrl = `${origin}/mobile-gps/${instantSessionId}`;

    try {
      setQrSession((prev: any) => prev || { sessionId: instantSessionId, status: "PENDING" });
      setQrMobileUrl(instantUrl);
      const instantDataUrl = await QRCode.toDataURL(instantUrl, {
        width: 190,
        margin: 1,
        color: { dark: "#0F172A", light: "#FFFFFF" },
      });
      setQrDataUrl(instantDataUrl);
    } catch {
      // Ignore instant QR error
    }

    try {
      const session = await attendanceRestApi.createQrSession("ADMIN_SET_LOCATION");
      if (session?.sessionId) {
        setQrSession(session);
        const url = `${origin}/mobile-gps/${session.sessionId}`;
        setQrMobileUrl(url);
        const dataUrl = await QRCode.toDataURL(url, {
          width: 190,
          margin: 1,
          color: { dark: "#0F172A", light: "#FFFFFF" },
        });
        setQrDataUrl(dataUrl);
      }
    } catch {
      // Fallback instant QR session remains active
    } finally {
      setQrLoading(false);
    }
  }, [isMobileDevice]);

  useEffect(() => {
    if (!isMobileDevice) {
      startAdminQrSession();
    }
  }, [isMobileDevice, startAdminQrSession]);

  // Poll QR session on desktop so when Admin sets school location on mobile, laptop updates live
  useEffect(() => {
    if (isMobileDevice || !qrSession?.sessionId || qrSession?.status === "COMPLETED") {
      return;
    }
    const timer = setInterval(async () => {
      try {
        const latest = await attendanceRestApi.getQrSession(qrSession.sessionId);
        if (latest?.status === "COMPLETED") {
          setQrSession(latest);
          if (latest.latitude && latest.longitude) {
            setGeoLat(String(latest.latitude));
            setGeoLng(String(latest.longitude));
          }
          if (latest.geofenceRadiusMeters) {
            setGeoRadius(String(latest.geofenceRadiusMeters));
          }
          success(
            "School Map Location updated live from your Mobile Phone GPS!",
            { title: "Mobile GPS Location Saved" }
          );
          await loadData();
        }
      } catch {
        // Ignore poll error
      }
    }, 3000);
    return () => clearInterval(timer);
  }, [isMobileDevice, qrSession, loadData, success]);

  const handleDetectCurrentGpsForSchool = () => {
    if (typeof navigator !== "undefined" && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setGeoLat(pos.coords.latitude.toFixed(6));
          setGeoLng(pos.coords.longitude.toFixed(6));
          success("Captured live GPS coordinates for School Campus!");
        },
        () => {
          toastError("Browser GPS unavailable; enter coordinates or scan QR with phone.");
        },
        { enableHighAccuracy: true, timeout: 6000 }
      );
    }
  };

  const handleSaveSchoolGeofence = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingLocation(true);
    try {
      const updated = await attendanceRestApi.updateSchoolLocation({
        latitude: Number(geoLat),
        longitude: Number(geoLng),
        geofenceRadiusMeters: Number(geoRadius),
        address: geoAddress.trim() || undefined,
      });
      setSchool((prev: any) => ({ ...prev, ...updated }));
      success("School live map location & geofence radius updated!", {
        title: "Geofence Saved",
      });
      await loadData();
    } catch (err: any) {
      toastError(err?.message || "Failed to update school geofence settings");
    } finally {
      setSavingLocation(false);
    }
  };

  const handlePurgeOldPhotos = async () => {
    try {
      const res = await attendanceRestApi.purgeOldPhotos();
      success(
        `3-Day Photo Retention Cleanup complete! Purged ${res?.purgedCount ?? 0} old image(s) older than ${res?.cutoffDate ?? "3 days"} while keeping all PRESENT records.`,
        { title: "Database Image Cleanup" }
      );
      await loadData();
    } catch (err: any) {
      toastError(err?.message || "Failed to purge expired attendance photos");
    }
  };

  const handleReviewLeave = async (
    leaveId: string,
    status: "APPROVED" | "REJECTED"
  ) => {
    setReviewingLeaveId(leaveId);
    try {
      await attendanceRestApi.reviewLeave(leaveId, {
        status,
        adminRemarks:
          status === "APPROVED"
            ? "Approved by School Principal / Admin"
            : "Declined by School Principal / Admin",
      });
      success(
        `Teacher leave request ${status === "APPROVED" ? "approved" : "rejected"}!`,
        { title: `Leave ${status}` }
      );
      await loadData();
    } catch (err: any) {
      toastError(err?.message || "Failed to review leave request");
    } finally {
      setReviewingLeaveId(null);
    }
  };

  const filteredRecords = records.filter((r) => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return true;
    return (
      r.fullName?.toLowerCase().includes(q) ||
      r.employeeId?.toLowerCase().includes(q) ||
      r.designation?.toLowerCase().includes(q)
    );
  });

  const pendingLeavesCount = leaves.filter((l) => l.status === "PENDING").length;

  const osmExternalUrl = `https://www.openstreetmap.org/?mlat=${Number(
    geoLat || 31.5204
  )}&mlon=${Number(geoLng || 74.3587)}#map=17/${Number(geoLat || 31.5204)}/${Number(
    geoLng || 74.3587
  )}`;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/80 shadow-xs">
        <div className="flex items-center gap-3">
          <span className="w-10 h-10 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center border border-teal-200/60 shrink-0">
            <MapPin className="w-5 h-5" />
          </span>
          <div>
            <h1 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight">
              Teacher Attendance &amp; Leave Approvals
            </h1>
            <p className="text-xs text-slate-500">
              Monitor live GPS &amp; photo-verified faculty attendance, configure school geofence, and approve teacher leaves
            </p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-mono font-semibold text-slate-800"
          />
          <Button
            variant="secondary"
            size="sm"
            onClick={handlePurgeOldPhotos}
            title="Delete attendance photos older than 3 days to keep database fast"
          >
            Purge &gt;3d Photos
          </Button>
          <Button
            variant="secondary"
            size="sm"
            onClick={loadData}
            leftIcon={<RefreshCw className="w-3.5 h-3.5" />}
          >
            Refresh
          </Button>
        </div>
      </div>

      {/* KPI Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <Card className="p-4 flex items-center justify-between">
          <div>
            <span className="text-xs font-medium text-slate-500">Total Faculty</span>
            <p className="text-xl sm:text-2xl font-bold font-mono-data text-slate-900 mt-1">
              {summary.totalTeachers}
            </p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center shrink-0">
            <Users className="w-5 h-5" />
          </div>
        </Card>

        <Card className="p-4 flex items-center justify-between">
          <div>
            <span className="text-xs font-medium text-slate-500">
              Present On-Campus (GPS Verified)
            </span>
            <p className="text-xl sm:text-2xl font-bold font-mono-data text-emerald-600 mt-1">
              {summary.present + summary.late}
            </p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        </Card>

        <Card className="p-4 flex items-center justify-between">
          <div>
            <span className="text-xs font-medium text-slate-500">On Approved Leave</span>
            <p className="text-xl sm:text-2xl font-bold font-mono-data text-sky-600 mt-1">
              {summary.onLeave}
            </p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center shrink-0">
            <Clock className="w-5 h-5" />
          </div>
        </Card>

        <Card className="p-4 flex items-center justify-between">
          <div>
            <span className="text-xs font-medium text-slate-500">
              Pending Leave Requests
            </span>
            <p className="text-xl sm:text-2xl font-bold font-mono-data text-amber-600 mt-1">
              {pendingLeavesCount}
            </p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
            <FileText className="w-5 h-5" />
          </div>
        </Card>
      </div>

      {/* Navigation Tabs */}
      <Card className="p-4 sm:p-5 space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-3.5">
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setActiveTab("attendance")}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
                activeTab === "attendance"
                  ? "bg-teal-600 text-white shadow-xs"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              Daily Teacher Attendance ({records.length})
            </button>
            <button
              type="button"
              data-testid="tab-leave-requests"
              onClick={() => setActiveTab("leaves")}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
                activeTab === "leaves"
                  ? "bg-teal-600 text-white shadow-xs"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              Leave Applications &amp; Approvals ({leaves.length})
            </button>
            <button
              type="button"
              data-testid="tab-school-geofence"
              onClick={() => setActiveTab("geofence")}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
                activeTab === "geofence"
                  ? "bg-teal-600 text-white shadow-xs"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              School Live Map &amp; Geofence Config
            </button>
          </div>

          {activeTab === "attendance" && (
            <div className="w-full sm:w-64">
              <Input
                placeholder="Search teacher or employee ID..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                leftIcon={<Search className="w-3.5 h-3.5 text-slate-400" />}
              />
            </div>
          )}
        </div>

        {loading ? (
          <div className="py-12 text-center text-xs text-slate-400">
            Loading teacher attendance &amp; leave records...
          </div>
        ) : activeTab === "attendance" ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-200 text-slate-500 uppercase text-[10px] tracking-wider">
                  <th className="py-2.5 px-3">Teacher</th>
                  <th className="py-2.5 px-3">Employee ID</th>
                  <th className="py-2.5 px-3">Status</th>
                  <th className="py-2.5 px-3">Live Photo Proof</th>
                  <th className="py-2.5 px-3">Campus GPS &amp; Distance</th>
                  <th className="py-2.5 px-3">Check-In Time</th>
                  <th className="py-2.5 px-3">Remarks</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredRecords.map((rec: any) => (
                  <tr key={rec.teacherId} className="hover:bg-slate-50/80">
                    <td className="py-3 px-3">
                      <div className="font-bold text-slate-900">{rec.fullName}</div>
                      <div className="text-[11px] text-slate-500">
                        {rec.designation || "Faculty"} • {rec.email}
                      </div>
                    </td>
                    <td className="py-3 px-3 font-mono font-semibold text-slate-700">
                      {rec.employeeId}
                    </td>
                    <td className="py-3 px-3">
                      <Badge
                        variant={
                          rec.status === "PRESENT"
                            ? "success"
                            : rec.status === "LATE"
                              ? "warning"
                              : rec.status === "EXCUSED"
                                ? "info"
                                : "neutral"
                        }
                        size="sm"
                      >
                        {rec.status === "EXCUSED" ? "ON LEAVE" : rec.status}
                      </Badge>
                    </td>
                    <td className="py-3 px-3">
                      {rec.photoUrl ? (
                        <button
                          type="button"
                          onClick={() => setPreviewPhotoModal(rec)}
                          className="inline-flex items-center gap-2 text-teal-600 hover:underline font-semibold cursor-pointer"
                        >
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={rec.photoUrl}
                            alt={rec.fullName}
                            className="w-11 h-8 rounded object-cover border border-slate-200 shadow-2xs"
                          />
                          <span>Inspect Photo</span>
                        </button>
                      ) : rec.locationVerified ? (
                        <span className="text-slate-500 font-mono text-[11px]">
                          Auto-deleted (&gt;3d retention)
                        </span>
                      ) : (
                        <span className="text-slate-400 inline-flex items-center gap-1">
                          <Camera className="w-3.5 h-3.5" /> No photo
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-3 font-mono text-[11px]">
                      {rec.latitude != null && rec.longitude != null ? (
                        <div className="space-y-0.5">
                          <div className="text-emerald-600 font-bold flex items-center gap-1">
                            <ShieldCheck className="w-3.5 h-3.5" />
                            {rec.distanceMeters ?? 0}m from campus (Verified)
                          </div>
                          <div className="text-slate-500">
                            {Number(rec.latitude).toFixed(4)}, {Number(rec.longitude).toFixed(4)}
                          </div>
                        </div>
                      ) : (
                        <span className="text-slate-400">—</span>
                      )}
                    </td>
                    <td className="py-3 px-3 font-mono text-slate-600">
                      {rec.checkInTime
                        ? new Date(rec.checkInTime).toLocaleTimeString()
                        : "—"}
                    </td>
                    <td className="py-3 px-3 text-slate-600 max-w-xs truncate">
                      {rec.remarks || "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : activeTab === "leaves" ? (
          leaves.length === 0 ? (
            <div className="py-12 text-center text-xs text-slate-400">
              No teacher leave requests found.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-500 uppercase text-[10px] tracking-wider">
                    <th className="py-2.5 px-3">Teacher</th>
                    <th className="py-2.5 px-3">Leave Type</th>
                    <th className="py-2.5 px-3">Dates</th>
                    <th className="py-2.5 px-3">Reason</th>
                    <th className="py-2.5 px-3">Status</th>
                    <th className="py-2.5 px-3 text-right">Admin Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {leaves.map((lv: any) => (
                    <tr key={lv.id} className="hover:bg-slate-50/80">
                      <td className="py-3 px-3">
                        <div className="font-bold text-slate-900">
                          {lv.teacher?.fullName || "Teacher"}
                        </div>
                        <div className="text-[11px] text-slate-500 font-mono">
                          {lv.teacher?.employeeId}
                        </div>
                      </td>
                      <td className="py-3 px-3 font-bold text-slate-800">{lv.leaveType}</td>
                      <td className="py-3 px-3 font-mono text-slate-700">
                        {lv.startDate} → {lv.endDate}
                      </td>
                      <td className="py-3 px-3 text-slate-700 max-w-sm">{lv.reason}</td>
                      <td className="py-3 px-3">
                        <Badge
                          variant={
                            lv.status === "APPROVED"
                              ? "success"
                              : lv.status === "REJECTED"
                                ? "danger"
                                : "warning"
                          }
                          size="sm"
                        >
                          {lv.status}
                        </Badge>
                      </td>
                      <td className="py-3 px-3 text-right">
                        <div className="inline-flex items-center gap-2">
                          <button
                            type="button"
                            data-testid={`approve-leave-${lv.id}`}
                            disabled={reviewingLeaveId === lv.id || lv.status === "APPROVED"}
                            onClick={() => handleReviewLeave(lv.id, "APPROVED")}
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[11px] font-bold bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 text-white transition-colors cursor-pointer"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            Approve
                          </button>
                          <button
                            type="button"
                            data-testid={`reject-leave-${lv.id}`}
                            disabled={reviewingLeaveId === lv.id || lv.status === "REJECTED"}
                            onClick={() => handleReviewLeave(lv.id, "REJECTED")}
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[11px] font-bold bg-rose-600 hover:bg-rose-700 disabled:opacity-40 text-white transition-colors cursor-pointer"
                          >
                            <XCircle className="w-3.5 h-3.5" />
                            Reject
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )
        ) : (
          /* School Live Map & Geofence Config Tab */
          <div className="space-y-6">
            {/* DESKTOP ONLY: Scan QR with Mobile Phone to Set Accurate School GPS */}
            {!isMobileDevice && (
              <div className="hidden md:flex flex-col lg:flex-row items-center justify-between gap-5 p-5 rounded-2xl bg-gradient-to-r from-teal-50/90 via-white to-slate-50 border-2 border-teal-200 text-slate-900 shadow-xs">
                <div className="space-y-2 max-w-xl">
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-teal-100 border border-teal-300 text-teal-900 text-xs font-bold">
                    <QrCode className="w-3.5 h-3.5 text-teal-700" />
                    On a Laptop? Scan QR to Set School Location Using Phone GPS
                  </div>
                  <h4 className="text-sm font-bold text-slate-900">
                    Capture Exact Campus Coordinates from Your Smartphone
                  </h4>
                  <p className="text-xs text-slate-700 leading-relaxed font-medium">
                    Since laptop Wi-Fi location can be inaccurate, scan this QR code on your
                    mobile phone while standing on campus. Your phone&apos;s hardware GPS will
                    set the exact school map coordinates and sync live to this page.
                  </p>
                  <div className="flex flex-wrap items-center gap-2.5 pt-1">
                    {qrMobileUrl && (
                      <a
                        href={qrMobileUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs shadow-2xs"
                      >
                        <Smartphone className="w-3.5 h-3.5" />
                        Open Mobile Location Setter
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    )}
                    <button
                      type="button"
                      onClick={startAdminQrSession}
                      disabled={qrLoading}
                      className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white hover:bg-slate-100 text-slate-800 text-xs font-bold border border-slate-300 shadow-2xs cursor-pointer"
                    >
                      <RefreshCw className={`w-3.5 h-3.5 ${qrLoading ? "animate-spin" : ""}`} />
                      Regenerate QR Code
                    </button>
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-teal-100/80 border border-teal-200 text-xs font-mono font-bold text-teal-900">
                      <span className="w-2 h-2 rounded-full bg-teal-600 animate-pulse" />
                      {qrSession?.status === "COMPLETED"
                        ? "✓ School GPS Synced from Mobile!"
                        : "Waiting for mobile scan..."}
                    </span>
                  </div>
                </div>
                <div className="bg-white p-3 rounded-2xl border-2 border-teal-200 shadow-md shrink-0 flex flex-col items-center">
                  {qrDataUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={qrDataUrl}
                      alt="Admin Mobile GPS QR Code"
                      data-testid="admin-location-qr-img"
                      className="w-32 h-32 rounded-lg"
                    />
                  ) : (
                    <div className="w-32 h-32 flex items-center justify-center text-xs font-semibold text-slate-600">
                      Generating QR...
                    </div>
                  )}
                  <span className="text-[10px] font-mono font-bold text-slate-800 mt-1.5 tracking-wider">
                    SCAN TO SET SCHOOL GPS
                  </span>
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              <form
                onSubmit={handleSaveSchoolGeofence}
                className="lg:col-span-6 space-y-4"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">
                      Set School Map Location &amp; Geofence Boundary
                    </h3>
                    <p className="text-xs text-slate-500">
                      All teachers&apos; live GPS check-ins will match against these coordinates and automatically mark them PRESENT
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={handleDetectCurrentGpsForSchool}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-teal-50 text-teal-700 border border-teal-200 hover:bg-teal-100 cursor-pointer"
                  >
                    <Navigation className="w-3.5 h-3.5" />
                    Use My Current Live GPS
                  </button>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <Input
                    label="School Latitude *"
                    type="number"
                    step="any"
                    value={geoLat}
                    onChange={(e) => setGeoLat(e.target.value)}
                    required
                  />
                  <Input
                    label="School Longitude *"
                    type="number"
                    step="any"
                    value={geoLng}
                    onChange={(e) => setGeoLng(e.target.value)}
                    required
                  />
                </div>
                <Input
                  label="Allowed Geofence Radius (Meters) *"
                  type="number"
                  value={geoRadius}
                  onChange={(e) => setGeoRadius(e.target.value)}
                  required
                />
                <Input
                  label="Campus Address Label"
                  value={geoAddress}
                  onChange={(e) => setGeoAddress(e.target.value)}
                  placeholder="e.g. 742 Evergreen Terrace, Main Campus"
                />
                <div className="rounded-xl bg-teal-50/70 border border-teal-200/70 p-3 text-xs text-teal-900 space-y-1">
                  <p className="font-bold">Automatic PRESENT + 3-Day Image Auto-Deletion Policy</p>
                  <p className="text-teal-700">
                    • Teachers within <strong>{geoRadius || 250}m</strong> of ({geoLat}, {geoLng}) are automatically marked <strong>PRESENT</strong>.<br />
                    • Uploaded attendance images are automatically purged after <strong>3 days</strong> so the database stays fast and never gets crowded.
                  </p>
                </div>
                <Button
                  type="submit"
                  variant="primary"
                  isLoading={savingLocation}
                  leftIcon={<ShieldCheck className="w-4 h-4" />}
                >
                  Save School Campus Geofence
                </Button>
              </form>

              <div className="lg:col-span-6 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="block text-xs font-semibold text-slate-700">
                    Live School Campus Map Pin ({geoLat}, {geoLng})
                  </span>
                  <a
                    href={osmExternalUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="text-xs font-semibold text-teal-600 hover:underline inline-flex items-center gap-1"
                  >
                    Open Full Map <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
                <div className="rounded-2xl overflow-hidden border border-slate-200 h-64 bg-slate-900 flex flex-col items-center justify-center p-6 text-white relative">
                  <div className="w-36 h-36 rounded-full border-2 border-teal-400/60 bg-teal-500/10 flex items-center justify-center">
                    <div className="w-20 h-20 rounded-full border border-teal-300/50 bg-teal-500/20 flex items-center justify-center">
                      <MapPin className="w-8 h-8 text-teal-300" />
                    </div>
                  </div>
                  <p className="mt-3 text-xs font-bold text-teal-300 font-mono">
                    {school?.name || "School Campus"} Geofence ({geoRadius || 250}m Radius)
                  </p>
                  <p className="text-[11px] text-slate-400 font-mono">
                    Center: {Number(geoLat || 31.5204).toFixed(5)},{" "}
                    {Number(geoLng || 74.3587).toFixed(5)}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </Card>

      {/* Photo Verification Modal */}
      {previewPhotoModal && (
        <div
          className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4"
          onClick={() => setPreviewPhotoModal(null)}
        >
          <div
            className="bg-white rounded-2xl p-5 max-w-md w-full space-y-3 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-900">
                  {previewPhotoModal.fullName} ({previewPhotoModal.employeeId})
                </h3>
                <p className="text-[11px] text-slate-500 font-mono">
                  Distance: {previewPhotoModal.distanceMeters ?? 0}m from school • GPS:{" "}
                  {Number(previewPhotoModal.latitude).toFixed(5)},{" "}
                  {Number(previewPhotoModal.longitude).toFixed(5)}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setPreviewPhotoModal(null)}
                className="text-xs font-semibold text-slate-500 hover:text-slate-900"
              >
                Close
              </button>
            </div>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={previewPhotoModal.photoUrl}
              alt={previewPhotoModal.fullName}
              className="w-full rounded-xl border border-slate-200"
            />
          </div>
        </div>
      )}
    </div>
  );
}
