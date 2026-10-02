"use client";

import React, { useState, useMemo } from "react";
import {
  ShieldAlert,
  Search,
  Filter,
  Calendar,
  UserCheck,
  AlertTriangle,
  CheckCircle2,
  Lock,
  Activity,
  Download,
  Eye,
  RefreshCw,
  Server,
  Laptop,
  ArrowUpDown,
  FileSpreadsheet,
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { AreaChart, BarChart, DonutChart } from "@/components/charts";
import { useAuth } from "@/app/hooks/useAuth";
import { useToast } from "@/app/hooks/useToast";
import { Modal } from "@/components/ui/Modal";

export interface AuditLogItem {
  id: string;
  timestamp: string;
  userId: string;
  userName: string;
  userEmail: string;
  userRole: "ADMIN" | "TEACHER" | "STUDENT" | "PARENT" | "SUPERADMIN";
  action: string;
  category: "AUTH" | "MARKS" | "ATTENDANCE" | "FEES" | "TIMETABLE" | "SETTINGS" | "KYC" | "SECURITY";
  description: string;
  ipAddress: string;
  userAgent: string;
  status: "SUCCESS" | "WARNING" | "FAILURE";
  metadata?: Record<string, any>;
}

// Initial realistic audit logs database
const MOCK_AUDIT_LOGS: AuditLogItem[] = [
  {
    id: "log-101",
    timestamp: new Date(Date.now() - 1000 * 60 * 12).toISOString(),
    userId: "u-admin-1",
    userName: "Arthur Pendelton",
    userEmail: "admin@oakridge.edu",
    userRole: "ADMIN",
    action: "USER_LOGIN_2FA",
    category: "AUTH",
    description: "Successful login with 2FA TOTP verification",
    ipAddress: "127.0.0.1",
    userAgent: "Chrome 128.0 (Linux x86_64)",
    status: "SUCCESS",
    metadata: { method: "TOTP_AUTHENTICATOR", trustedDevice: true },
  },
  {
    id: "log-102",
    timestamp: new Date(Date.now() - 1000 * 60 * 35).toISOString(),
    userId: "u-teacher-1",
    userName: "Dr. Sarah Johnson",
    userEmail: "sarah@oakridge.edu",
    userRole: "TEACHER",
    action: "MARKS_RECORDED",
    category: "MARKS",
    description: "Submitted Midterm Exam marks for Class 10-A (Mathematics)",
    ipAddress: "127.0.0.1",
    userAgent: "Firefox 130.0 (Linux x86_64)",
    status: "SUCCESS",
    metadata: { class: "10-A", subject: "Mathematics", studentsCount: 28 },
  },
  {
    id: "log-103",
    timestamp: new Date(Date.now() - 1000 * 60 * 55).toISOString(),
    userId: "u-parent-1",
    userName: "Robert Brown",
    userEmail: "robert.parent@oakridge.edu",
    userRole: "PARENT",
    action: "FEE_CHALLAN_DOWNLOAD",
    category: "FEES",
    description: "Downloaded October 2026 tuition fee challan for Alice Brown",
    ipAddress: "127.0.0.1",
    userAgent: "Safari 17.5 (iOS Mobile)",
    status: "SUCCESS",
    metadata: { challanNumber: "CH-2026-10-00001", amount: "$450.00" },
  },
  {
    id: "log-104",
    timestamp: new Date(Date.now() - 1000 * 60 * 110).toISOString(),
    userId: "u-student-1",
    userName: "Alice Brown",
    userEmail: "alice@oakridge.edu",
    userRole: "STUDENT",
    action: "TIMETABLE_VIEWED",
    category: "TIMETABLE",
    description: "Viewed weekly class schedule & room allocations",
    ipAddress: "127.0.0.1",
    userAgent: "Chrome 128.0 (Android)",
    status: "SUCCESS",
    metadata: { grade: 10, section: "A" },
  },
  {
    id: "log-105",
    timestamp: new Date(Date.now() - 1000 * 60 * 180).toISOString(),
    userId: "u-unknown",
    userName: "Unknown User",
    userEmail: "intruder@external-node.net",
    userRole: "ADMIN",
    action: "LOGIN_FAILED",
    category: "SECURITY",
    description: "Failed login attempt with invalid credentials (blocked by rate-limiter)",
    ipAddress: "192.168.1.105",
    userAgent: "Python-Requests/2.31",
    status: "FAILURE",
    metadata: { attempts: 4, reason: "INVALID_PASSWORD" },
  },
  {
    id: "log-106",
    timestamp: new Date(Date.now() - 1000 * 60 * 240).toISOString(),
    userId: "u-teacher-1",
    userName: "Dr. Sarah Johnson",
    userEmail: "sarah@oakridge.edu",
    userRole: "TEACHER",
    action: "ATTENDANCE_MARKED",
    category: "ATTENDANCE",
    description: "Marked morning attendance for Grade 10-A (28 Present, 2 Absent)",
    ipAddress: "127.0.0.1",
    userAgent: "Firefox 130.0 (Linux x86_64)",
    status: "SUCCESS",
    metadata: { present: 28, absent: 2, section: "10-A" },
  },
  {
    id: "log-107",
    timestamp: new Date(Date.now() - 1000 * 60 * 360).toISOString(),
    userId: "u-admin-1",
    userName: "Arthur Pendelton",
    userEmail: "admin@oakridge.edu",
    userRole: "ADMIN",
    action: "KYC_VERIFICATION_SUBMITTED",
    category: "KYC",
    description: "Submitted CNIC documentation & biometric webcam selfie for identity clearance",
    ipAddress: "127.0.0.1",
    userAgent: "Chrome 128.0 (Linux x86_64)",
    status: "SUCCESS",
    metadata: { cnicNumber: "35201-1234567-1", faceMatchConfidence: "98.6%" },
  },
  {
    id: "log-108",
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
    userId: "u-admin-1",
    userName: "Arthur Pendelton",
    userEmail: "admin@oakridge.edu",
    userRole: "ADMIN",
    action: "TIMETABLE_PERIOD_MOVED",
    category: "TIMETABLE",
    description: "Rescheduled Physics Lab period from Monday 09:20 to Wednesday 10:15",
    ipAddress: "127.0.0.1",
    userAgent: "Chrome 128.0 (Linux x86_64)",
    status: "WARNING",
    metadata: { teacherConflictDetected: false, previousPeriod: "Mon P2" },
  },
  {
    id: "log-109",
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 48).toISOString(),
    userId: "u-super-1",
    userName: "Platform Super Admin",
    userEmail: "superadmin@academix.com",
    userRole: "SUPERADMIN",
    action: "TENANT_SETTINGS_MODIFIED",
    category: "SETTINGS",
    description: "Updated SMTP & WhatsApp notification gateway credentials",
    ipAddress: "127.0.0.1",
    userAgent: "Chrome 128.0 (Linux x86_64)",
    status: "SUCCESS",
    metadata: { provider: "SMTP_TLS", port: 587 },
  },
];

export interface AuditLogsViewProps {
  scopedToUser?: boolean;
}

export const AuditLogsView: React.FC<AuditLogsViewProps> = ({ scopedToUser = false }) => {
  const { user, role } = useAuth();
  const { success, info } = useToast();

  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("ALL");
  const [categoryFilter, setCategoryFilter] = useState<string>("ALL");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [dateRange, setDateRange] = useState<"ALL" | "TODAY" | "7DAYS" | "30DAYS">("ALL");
  const [selectedLog, setSelectedLog] = useState<AuditLogItem | null>(null);

  const isAdminOrSuper = role === "admin" || role === "superadmin";
  const shouldScopeToUser = scopedToUser || (!isAdminOrSuper && user);

  // Filter logs based on user permissions and active filters
  const filteredLogs = useMemo(() => {
    let logs = [...MOCK_AUDIT_LOGS];

    // If scoped to user (Teachers, Students, Parents), show only their logs
    if (shouldScopeToUser && user?.email) {
      logs = logs.filter(
        (l) =>
          l.userEmail.toLowerCase() === user.email?.toLowerCase() ||
          l.userName.toLowerCase() === user.name?.toLowerCase()
      );
    }

    // Role filter
    if (roleFilter !== "ALL") {
      logs = logs.filter((l) => l.userRole === roleFilter);
    }

    // Category filter
    if (categoryFilter !== "ALL") {
      logs = logs.filter((l) => l.category === categoryFilter);
    }

    // Status filter
    if (statusFilter !== "ALL") {
      logs = logs.filter((l) => l.status === statusFilter);
    }

    // Date range filter
    const now = Date.now();
    if (dateRange === "TODAY") {
      const oneDayAgo = now - 24 * 60 * 60 * 1000;
      logs = logs.filter((l) => new Date(l.timestamp).getTime() >= oneDayAgo);
    } else if (dateRange === "7DAYS") {
      const sevenDaysAgo = now - 7 * 24 * 60 * 60 * 1000;
      logs = logs.filter((l) => new Date(l.timestamp).getTime() >= sevenDaysAgo);
    } else if (dateRange === "30DAYS") {
      const thirtyDaysAgo = now - 30 * 24 * 60 * 60 * 1000;
      logs = logs.filter((l) => new Date(l.timestamp).getTime() >= thirtyDaysAgo);
    }

    // Search query
    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      logs = logs.filter(
        (l) =>
          l.userName.toLowerCase().includes(q) ||
          l.userEmail.toLowerCase().includes(q) ||
          l.action.toLowerCase().includes(q) ||
          l.description.toLowerCase().includes(q) ||
          l.ipAddress.includes(q)
      );
    }

    return logs;
  }, [shouldScopeToUser, user, roleFilter, categoryFilter, statusFilter, dateRange, searchTerm]);

  // Metrics calculations
  const totalEvents = filteredLogs.length;
  const successCount = filteredLogs.filter((l) => l.status === "SUCCESS").length;
  const warningCount = filteredLogs.filter((l) => l.status === "WARNING").length;
  const failureCount = filteredLogs.filter((l) => l.status === "FAILURE").length;

  // Chart data: activity timeline
  const timelineData = useMemo(() => {
    return [
      { day: "Mon", auth: 12, activity: 34, security: 0 },
      { day: "Tue", auth: 18, activity: 48, security: 1 },
      { day: "Wed", auth: 22, activity: 65, security: 0 },
      { day: "Thu", auth: 19, activity: 52, security: 2 },
      { day: "Fri", auth: 25, activity: 70, security: 1 },
      { day: "Sat", auth: 8, activity: 15, security: 0 },
      { day: "Sun", auth: 5, activity: 10, security: 0 },
    ];
  }, []);

  // Category breakdown chart data
  const categoryDonutData = useMemo(() => {
    const counts: Record<string, number> = {};
    filteredLogs.forEach((l) => {
      counts[l.category] = (counts[l.category] || 0) + 1;
    });
    return Object.entries(counts).map(([name, value]) => ({ name, value }));
  }, [filteredLogs]);

  const handleExportCsv = () => {
    const headers = ["Timestamp", "User", "Email", "Role", "Action", "Category", "Description", "IP", "Status"];
    const rows = filteredLogs.map((l) => [
      l.timestamp,
      `"${l.userName}"`,
      l.userEmail,
      l.userRole,
      l.action,
      l.category,
      `"${l.description}"`,
      l.ipAddress,
      l.status,
    ]);
    const csvContent = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `audit_logs_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    success("Audit logs exported to CSV successfully.");
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-50 border border-teal-200 text-teal-800 text-xs font-semibold mb-2">
            <ShieldAlert className="w-3.5 h-3.5 text-teal-600" />
            Immutable Audit Trail &amp; MongoDB Event Store
          </div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            Security &amp; System Audit Logs
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            {shouldScopeToUser
              ? "Viewing your personal activity, sign-in sessions, and security verification logs."
              : "Comprehensive institutional activity stream with real-time telemetry across teachers, students, parents, and administrators."}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleExportCsv}
            leftIcon={<FileSpreadsheet className="w-4 h-4 text-emerald-600" />}
            className="border-slate-200"
          >
            Export CSV
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={() => info("Audit log stream synchronizing in real time...")}
            leftIcon={<RefreshCw className="w-4 h-4" />}
            className="bg-teal-600 hover:bg-teal-700 text-white"
          >
            Live Sync
          </Button>
        </div>
      </div>

      {/* Metric Highlights */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-slate-200/80 shadow-xs">
          <CardContent className="p-4 flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-teal-50 border border-teal-200 flex items-center justify-center shrink-0">
              <Activity className="w-5 h-5 text-teal-600" />
            </div>
            <div>
              <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Total Events</p>
              <h3 className="text-xl font-bold text-slate-900">{totalEvents}</h3>
            </div>
          </CardContent>
        </Card>

        <Card className="border-emerald-200/80 shadow-xs bg-emerald-50/20">
          <CardContent className="p-4 flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center shrink-0">
              <CheckCircle2 className="w-5 h-5 text-emerald-600" />
            </div>
            <div>
              <p className="text-[11px] font-semibold text-emerald-600 uppercase tracking-wider">Successful</p>
              <h3 className="text-xl font-bold text-slate-900">{successCount}</h3>
            </div>
          </CardContent>
        </Card>

        <Card className="border-amber-200/80 shadow-xs bg-amber-50/20">
          <CardContent className="p-4 flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-center shrink-0">
              <AlertTriangle className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <p className="text-[11px] font-semibold text-amber-600 uppercase tracking-wider">Warnings</p>
              <h3 className="text-xl font-bold text-slate-900">{warningCount}</h3>
            </div>
          </CardContent>
        </Card>

        <Card className="border-rose-200/80 shadow-xs bg-rose-50/20">
          <CardContent className="p-4 flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-rose-50 border border-rose-200 flex items-center justify-center shrink-0">
              <Lock className="w-5 h-5 text-rose-600" />
            </div>
            <div>
              <p className="text-[11px] font-semibold text-rose-600 uppercase tracking-wider">Failed / Alerts</p>
              <h3 className="text-xl font-bold text-slate-900">{failureCount}</h3>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Visual Analytics Charts (Recharts) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2 border-slate-200/80">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-bold flex items-center justify-between">
              <span>Event Volume &amp; Activity Stream (7-Day Overview)</span>
              <span className="text-[11px] font-normal text-slate-500">Live Telemetry</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <AreaChart
              data={timelineData}
              xKey="day"
              areas={[
                { key: "activity", name: "System Operations", color: "#0D9488" },
                { key: "auth", name: "User Logins", color: "#6366F1" },
                { key: "security", name: "Security Alerts", color: "#F43F5E" },
              ]}
              height={230}
              showLegend
            />
          </CardContent>
        </Card>

        <Card className="border-slate-200/80">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-bold">Category Distribution</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col items-center justify-center">
            {categoryDonutData.length > 0 ? (
              <DonutChart
                data={categoryDonutData}
                height={200}
                innerRadius={50}
                outerRadius={75}
                showLegend
              />
            ) : (
              <p className="text-xs text-slate-400 py-12">No categorized events.</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Filter & Search Bar */}
      <Card className="border-slate-200/80">
        <CardContent className="p-4 space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
            <div className="lg:col-span-2">
              <Input
                placeholder="Search user, action, IP or description..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                leftIcon={<Search className="w-4 h-4 text-slate-400" />}
                className="text-xs"
              />
            </div>

            {!shouldScopeToUser && (
              <div>
                <Select
                  value={roleFilter}
                  onChange={(e) => setRoleFilter(e.target.value)}
                  options={[
                    { value: "ALL", label: "All User Roles" },
                    { value: "ADMIN", label: "Admin Only" },
                    { value: "TEACHER", label: "Teachers Only" },
                    { value: "STUDENT", label: "Students Only" },
                    { value: "PARENT", label: "Parents Only" },
                    { value: "SUPERADMIN", label: "SuperAdmin" },
                  ]}
                  className="text-xs"
                />
              </div>
            )}

            <div>
              <Select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                options={[
                  { value: "ALL", label: "All Categories" },
                  { value: "AUTH", label: "Authentication" },
                  { value: "MARKS", label: "Marks & Exams" },
                  { value: "ATTENDANCE", label: "Attendance" },
                  { value: "FEES", label: "Fees & Challans" },
                  { value: "TIMETABLE", label: "Timetable" },
                  { value: "KYC", label: "KYC & Biometrics" },
                  { value: "SECURITY", label: "Security Alerts" },
                ]}
                className="text-xs"
              />
            </div>

            <div>
              <Select
                value={dateRange}
                onChange={(e) => setDateRange(e.target.value as any)}
                options={[
                  { value: "ALL", label: "All Time" },
                  { value: "TODAY", label: "Today (Last 24h)" },
                  { value: "7DAYS", label: "Last 7 Days" },
                  { value: "30DAYS", label: "Last 30 Days" },
                ]}
                className="text-xs"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Audit Logs Data Table */}
      <Card className="border-slate-200/80 overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200/80 text-slate-600 font-semibold uppercase tracking-wider text-[10px]">
              <tr>
                <th className="py-3 px-4">Timestamp</th>
                <th className="py-3 px-4">User Details</th>
                <th className="py-3 px-4">Action &amp; Category</th>
                <th className="py-3 px-4">Description</th>
                <th className="py-3 px-4">IP Address</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-400">
                    No audit log records match your filter criteria.
                  </td>
                </tr>
              ) : (
                filteredLogs.map((log) => {
                  const dateObj = new Date(log.timestamp);
                  const timeFormatted = dateObj.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
                  const dateFormatted = dateObj.toLocaleDateString([], { month: "short", day: "numeric" });

                  return (
                    <tr key={log.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3 px-4 whitespace-nowrap font-mono text-[11px] text-slate-500">
                        <div>{dateFormatted}</div>
                        <div className="text-[10px] text-slate-400">{timeFormatted}</div>
                      </td>

                      <td className="py-3 px-4 whitespace-nowrap">
                        <div className="font-semibold text-slate-900">{log.userName}</div>
                        <div className="text-[10px] text-slate-400 font-mono">{log.userEmail}</div>
                        <span className="inline-block px-1.5 py-0.2 rounded text-[9px] font-semibold bg-slate-100 text-slate-600 border border-slate-200 mt-0.5 uppercase">
                          {log.userRole}
                        </span>
                      </td>

                      <td className="py-3 px-4 whitespace-nowrap">
                        <span className="font-mono text-slate-800 font-semibold">{log.action}</span>
                        <div className="text-[10px] text-teal-700 font-medium">{log.category}</div>
                      </td>

                      <td className="py-3 px-4 text-slate-600 max-w-xs">
                        <span className="line-clamp-2">{log.description}</span>
                      </td>

                      <td className="py-3 px-4 whitespace-nowrap font-mono text-[11px] text-slate-500">
                        {log.ipAddress}
                      </td>

                      <td className="py-3 px-4 whitespace-nowrap">
                        <Badge
                          variant={
                            log.status === "SUCCESS"
                              ? "success"
                              : log.status === "WARNING"
                              ? "warning"
                              : "danger"
                          }
                          size="sm"
                          dot
                        >
                          {log.status}
                        </Badge>
                      </td>

                      <td className="py-3 px-4 whitespace-nowrap text-right">
                        <Button
                          variant="ghost"
                          size="xs"
                          onClick={() => setSelectedLog(log)}
                          className="text-slate-500 hover:text-teal-700"
                        >
                          <Eye className="w-3.5 h-3.5 mr-1" /> View
                        </Button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Log Detail Modal */}
      {selectedLog && (
        <Modal
          isOpen={Boolean(selectedLog)}
          onClose={() => setSelectedLog(null)}
          title="Audit Log Event Details"
        >
          <div className="space-y-4 text-xs">
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
              <div className="flex justify-between">
                <span className="font-semibold text-slate-600">Event ID:</span>
                <span className="font-mono text-slate-800">{selectedLog.id}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-semibold text-slate-600">Timestamp:</span>
                <span className="font-mono text-slate-800">{new Date(selectedLog.timestamp).toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-semibold text-slate-600">Actor:</span>
                <span className="text-slate-800 font-medium">{selectedLog.userName} ({selectedLog.userEmail})</span>
              </div>
              <div className="flex justify-between">
                <span className="font-semibold text-slate-600">Role:</span>
                <Badge variant="neutral" size="sm">{selectedLog.userRole}</Badge>
              </div>
              <div className="flex justify-between">
                <span className="font-semibold text-slate-600">Action:</span>
                <span className="font-mono text-teal-700 font-bold">{selectedLog.action}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-semibold text-slate-600">IP &amp; Device:</span>
                <span className="font-mono text-slate-700">{selectedLog.ipAddress} — {selectedLog.userAgent}</span>
              </div>
            </div>

            <div>
              <p className="font-semibold text-slate-700 mb-1">Description:</p>
              <p className="p-2.5 bg-slate-50 rounded-lg text-slate-600 border border-slate-200">
                {selectedLog.description}
              </p>
            </div>

            {selectedLog.metadata && (
              <div>
                <p className="font-semibold text-slate-700 mb-1">Metadata (Payload JSON):</p>
                <pre className="p-3 bg-slate-900 text-teal-300 rounded-xl font-mono text-[11px] overflow-x-auto">
                  {JSON.stringify(selectedLog.metadata, null, 2)}
                </pre>
              </div>
            )}

            <div className="flex justify-end pt-2">
              <Button variant="outline" size="sm" onClick={() => setSelectedLog(null)}>
                Close
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
