"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import {
  MessageCircle,
  Send,
  Users,
  User,
  Search,
  CheckCircle2,
  Phone,
  FileText,
  DollarSign,
  AlertTriangle,
  Calendar,
  Sparkles,
  ExternalLink,
  Copy,
  Layers,
  Settings,
  ShieldCheck,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { PhoneInput } from "@/components/ui/PhoneInput";
import { Select } from "@/components/ui/Select";
import { Badge } from "@/components/ui/Badge";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { useAuth } from "@/app/hooks/useAuth";
import { useToast } from "@/app/hooks/useToast";
import { whatsappRestApi } from "@/app/api/client";

export interface WhatsAppCenterProps {
  isTeacher?: boolean;
}

export const WhatsAppCenter: React.FC<WhatsAppCenterProps> = ({ isTeacher = false }) => {
  const { user, role } = useAuth();
  const { success, error, info } = useToast();

  const storageKey = `whatsapp_config_${user?._id || role || "user"}`;
  const [isSenderConnected, setIsSenderConnected] = useState(false);
  const [senderPhone, setSenderPhone] = useState("");
  const [senderDisplayName, setSenderDisplayName] = useState("");

  const [activeTab, setActiveTab] = useState<"direct" | "batch" | "templates">("direct");
  const [recipientsData, setRecipientsData] = useState<{ teachers: any[]; parents: any[] }>({
    teachers: [],
    parents: [],
  });
  const [templates, setTemplates] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(storageKey);
      if (stored) {
        const parsed = JSON.parse(stored);
        setIsSenderConnected(Boolean(parsed.isConnected && parsed.phone));
        setSenderPhone(parsed.phone || "");
        setSenderDisplayName(parsed.senderName || user?.name || "");
      } else if (user?.phone) {
        setIsSenderConnected(true);
        setSenderPhone(user.phone);
        setSenderDisplayName(user.name || "");
      }
    } catch {}
  }, [storageKey, user]);

  // Direct Message State
  const [recipientType, setRecipientType] = useState<"PARENT" | "TEACHER" | "CUSTOM">("PARENT");
  const [selectedRecipientId, setSelectedRecipientId] = useState("");
  const [customPhone, setCustomPhone] = useState("");
  const [customName, setCustomName] = useState("");
  const [selectedTemplateId, setSelectedTemplateId] = useState("CUSTOM");
  const [messageText, setMessageText] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  // Batch Message State
  const [batchTarget, setBatchTarget] = useState<
    "CLASS_PARENTS" | "ALL_PARENTS" | "ALL_TEACHERS"
  >("ALL_PARENTS");
  const [batchClassId, setBatchClassId] = useState("");
  const [batchMessage, setBatchMessage] = useState("");
  const [batchResults, setBatchResults] = useState<any[]>([]);
  const [isPreparingBatch, setIsPreparingBatch] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        const [recipients, tmpls] = await Promise.all([
          whatsappRestApi.getRecipients(),
          whatsappRestApi.getTemplates(),
        ]);
        setRecipientsData(recipients || { teachers: [], parents: [] });
        setTemplates(tmpls || []);
      } catch {
        // Fallback demo data if offline
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  // Update message when template is selected
  const handleTemplateChange = (tmplId: string) => {
    setSelectedTemplateId(tmplId);
    if (tmplId === "CUSTOM") {
      setMessageText("");
      return;
    }
    const tmpl = templates.find((t) => t.id === tmplId);
    if (tmpl) {
      setMessageText(tmpl.template);
    }
  };

  const getActivePhone = () => {
    if (recipientType === "CUSTOM") return customPhone;
    if (recipientType === "TEACHER") {
      const t = recipientsData.teachers.find((x) => x.id === selectedRecipientId);
      return t?.phone || "";
    }
    if (recipientType === "PARENT") {
      const p = recipientsData.parents.find(
        (x) => x.parentId === selectedRecipientId || x.studentId === selectedRecipientId,
      );
      return p?.phone || "";
    }
    return "";
  };

  const getActiveName = () => {
    if (recipientType === "CUSTOM") return customName || "Recipient";
    if (recipientType === "TEACHER") {
      const t = recipientsData.teachers.find((x) => x.id === selectedRecipientId);
      return t?.name || "Teacher";
    }
    if (recipientType === "PARENT") {
      const p = recipientsData.parents.find(
        (x) => x.parentId === selectedRecipientId || x.studentId === selectedRecipientId,
      );
      return p ? `${p.parentName} (${p.studentName})` : "Parent";
    }
    return "Recipient";
  };

  const activePhone = getActivePhone();
  const activeName = getActiveName();

  const handleSendDirect = async () => {
    if (!activePhone) {
      error("Please select a recipient with a valid phone number or enter custom phone.");
      return;
    }
    if (!messageText.trim()) {
      error("Message body cannot be empty.");
      return;
    }

    try {
      const res = await whatsappRestApi.sendDirect({
        recipientType,
        recipientId: selectedRecipientId || undefined,
        phone: activePhone,
        recipientName: activeName,
        message: messageText.trim(),
        templateType: selectedTemplateId,
      });

      if (res.whatsAppUrl) {
        window.open(res.whatsAppUrl, "_blank");
        success(`WhatsApp chat opened for ${res.recipientName}.`);
      }
    } catch (err: any) {
      error(err.message || "Could not prepare WhatsApp message.");
    }
  };

  const handlePrepareBatch = async () => {
    if (!batchMessage.trim()) {
      error("Batch message cannot be empty.");
      return;
    }
    setIsPreparingBatch(true);
    try {
      const res = await whatsappRestApi.sendBatch({
        targetGroup: batchTarget,
        classId: batchClassId || undefined,
        message: batchMessage.trim(),
      });
      setBatchResults(res.recipients || []);
      success(`Prepared ${res.totalCount} WhatsApp messages for dispatch.`);
    } catch (err: any) {
      error(err.message || "Failed to prepare batch WhatsApp messages.");
    } finally {
      setIsPreparingBatch(false);
    }
  };

  const filteredTeachers = recipientsData.teachers.filter(
    (t) =>
      t.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.phone?.includes(searchQuery),
  );

  const filteredParents = recipientsData.parents.filter(
    (p) =>
      p.parentName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.studentName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.className?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.phone?.includes(searchQuery),
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
              <MessageCircle className="w-6 h-6 text-emerald-600" />
              WhatsApp Messaging Hub
            </h2>
            <Badge variant={isSenderConnected ? "success" : "warning"} size="sm" dot>
              {isSenderConnected ? "Connected" : "Setup Required"}
            </Badge>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Directly message parents and faculty, broadcast class announcements, and share 1-click report cards &amp; fee reminders
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs">
          <button
            onClick={() => setActiveTab("direct")}
            className={`px-3 py-1.5 rounded-lg font-semibold transition-all ${
              activeTab === "direct"
                ? "bg-white text-emerald-700 shadow-xs"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            Direct Chat
          </button>
          <button
            onClick={() => setActiveTab("batch")}
            className={`px-3 py-1.5 rounded-lg font-semibold transition-all ${
              activeTab === "batch"
                ? "bg-white text-emerald-700 shadow-xs"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            Broadcast / Batch
          </button>
          <button
            onClick={() => setActiveTab("templates")}
            className={`px-3 py-1.5 rounded-lg font-semibold transition-all ${
              activeTab === "templates"
                ? "bg-white text-emerald-700 shadow-xs"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            Smart Templates
          </button>
        </div>
      </div>

      {/* Official Sender Connection Banner */}
      {isSenderConnected ? (
        <div className="p-3 bg-emerald-50/70 border border-emerald-200 rounded-xl flex items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span className="text-emerald-950">
              Active Official WhatsApp Sender: <strong className="font-mono">{senderPhone}</strong> ({senderDisplayName || "Verified"})
            </span>
          </div>
          <Link
            href={isTeacher ? "/teacher/settings" : "/admin/settings"}
            className="text-[11px] font-semibold text-emerald-700 hover:text-emerald-900 hover:underline flex items-center gap-1"
          >
            <Settings className="w-3.5 h-3.5" /> Manage in Settings
          </Link>
        </div>
      ) : (
        <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2.5">
            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
            <span className="text-amber-900">
              <strong>WhatsApp Gateway Not Connected:</strong> You can compose messages and preview links, but connecting your official number in settings links your account as the verified sender.
            </span>
          </div>
          <Link
            href={isTeacher ? "/teacher/settings" : "/admin/settings"}
            className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white font-semibold rounded-lg text-xs shrink-0 inline-flex items-center gap-1"
          >
            <Settings className="w-3.5 h-3.5" /> Connect in Settings
          </Link>
        </div>
      )}

      {/* TAB 1: DIRECT CHAT */}
      {activeTab === "direct" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column: Form Controls */}
          <div className="lg:col-span-7 space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-bold flex items-center gap-2">
                  <User className="w-4 h-4 text-emerald-600" />
                  Select Recipient &amp; Message
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Recipient Type */}
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setRecipientType("PARENT");
                      setSelectedRecipientId("");
                    }}
                    className={`p-2.5 rounded-xl border text-xs font-semibold flex flex-col items-center gap-1 transition-all ${
                      recipientType === "PARENT"
                        ? "border-emerald-500 bg-emerald-50/50 text-emerald-800"
                        : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                    }`}
                  >
                    <Users className="w-4 h-4 text-emerald-600" />
                    <span>Parent / Guardian</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setRecipientType("TEACHER");
                      setSelectedRecipientId("");
                    }}
                    className={`p-2.5 rounded-xl border text-xs font-semibold flex flex-col items-center gap-1 transition-all ${
                      recipientType === "TEACHER"
                        ? "border-emerald-500 bg-emerald-50/50 text-emerald-800"
                        : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                    }`}
                  >
                    <User className="w-4 h-4 text-teal-600" />
                    <span>Faculty Teacher</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setRecipientType("CUSTOM");
                      setSelectedRecipientId("");
                    }}
                    className={`p-2.5 rounded-xl border text-xs font-semibold flex flex-col items-center gap-1 transition-all ${
                      recipientType === "CUSTOM"
                        ? "border-emerald-500 bg-emerald-50/50 text-emerald-800"
                        : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                    }`}
                  >
                    <Phone className="w-4 h-4 text-slate-600" />
                    <span>Custom Number</span>
                  </button>
                </div>

                {/* Recipient Picker */}
                {recipientType === "PARENT" && (
                  <div className="space-y-2">
                    <Input
                      placeholder="Search parent or student name / phone..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      leftIcon={<Search className="w-3.5 h-3.5 text-slate-400" />}
                      className="text-xs"
                    />
                    <div className="max-h-40 overflow-y-auto border border-slate-200 rounded-xl divide-y divide-slate-100 bg-white text-xs">
                      {filteredParents.length === 0 ? (
                        <div className="p-3 text-center text-slate-400">No parents matching search</div>
                      ) : (
                        filteredParents.map((p) => (
                          <div
                            key={p.studentId}
                            onClick={() => setSelectedRecipientId(p.studentId)}
                            className={`p-2.5 flex items-center justify-between cursor-pointer transition-colors ${
                              selectedRecipientId === p.studentId
                                ? "bg-emerald-50 font-semibold text-emerald-950"
                                : "hover:bg-slate-50"
                            }`}
                          >
                            <div>
                              <span className="font-semibold text-slate-800">{p.parentName}</span>
                              <span className="text-[11px] text-slate-500 block">
                                Guardian of {p.studentName} ({p.className} - {p.sectionName})
                              </span>
                            </div>
                            <Badge variant="neutral" size="sm" isMono>
                              {p.phone}
                            </Badge>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}

                {recipientType === "TEACHER" && (
                  <div className="space-y-2">
                    <Input
                      placeholder="Search teacher by name or phone..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      leftIcon={<Search className="w-3.5 h-3.5 text-slate-400" />}
                      className="text-xs"
                    />
                    <div className="max-h-40 overflow-y-auto border border-slate-200 rounded-xl divide-y divide-slate-100 bg-white text-xs">
                      {filteredTeachers.length === 0 ? (
                        <div className="p-3 text-center text-slate-400">No teachers found</div>
                      ) : (
                        filteredTeachers.map((t) => (
                          <div
                            key={t.id}
                            onClick={() => setSelectedRecipientId(t.id)}
                            className={`p-2.5 flex items-center justify-between cursor-pointer transition-colors ${
                              selectedRecipientId === t.id
                                ? "bg-emerald-50 font-semibold text-emerald-950"
                                : "hover:bg-slate-50"
                            }`}
                          >
                            <div>
                              <span className="font-semibold text-slate-800">{t.name}</span>
                              <span className="text-[11px] text-slate-500 block">{t.designation}</span>
                            </div>
                            <Badge variant="neutral" size="sm" isMono>
                              {t.phone || "No phone"}
                            </Badge>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}

                {recipientType === "CUSTOM" && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <Input
                      label="Recipient Full Name"
                      placeholder="e.g. John Doe"
                      value={customName}
                      onChange={(e) => setCustomName(e.target.value)}
                    />
                    <PhoneInput
                      label="WhatsApp Phone Number"
                      value={customPhone}
                      onChange={(full) => setCustomPhone(full)}
                      required
                    />
                  </div>
                )}

                {/* Template Preset Selector */}
                <div className="pt-2 border-t border-slate-100">
                  <Select
                    label="Load Pre-formatted Template (Optional)"
                    value={selectedTemplateId}
                    onChange={(e) => handleTemplateChange(e.target.value)}
                    options={[
                      { value: "CUSTOM", label: "Custom Free-Text Message" },
                      ...templates.map((t) => ({ value: t.id, label: t.name })),
                    ]}
                  />
                </div>

                {/* Message Body */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700">Message Content *</label>
                  <textarea
                    rows={6}
                    value={messageText}
                    onChange={(e) => setMessageText(e.target.value)}
                    placeholder="Type WhatsApp message here... (use *bold*, _italic_ for formatting)"
                    className="w-full text-xs p-3 rounded-xl border border-slate-300 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 font-sans leading-relaxed"
                  />
                </div>

                <Button
                  variant="primary"
                  size="md"
                  fullWidth
                  onClick={handleSendDirect}
                  leftIcon={<MessageCircle className="w-4 h-4" />}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white"
                >
                  Open in WhatsApp Web / App
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Right Column: Live WhatsApp Chat Preview */}
          <div className="lg:col-span-5 space-y-4">
            <Card className="bg-slate-900 text-white border-slate-800 overflow-hidden shadow-xl">
              <div className="p-3.5 bg-emerald-800 flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center font-bold text-sm">
                  {activeName.charAt(0)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-bold text-xs truncate">{activeName}</div>
                  <div className="text-[10px] text-emerald-200 font-mono-data">
                    {activePhone || "Select recipient phone"}
                  </div>
                </div>
                <Badge variant="success" size="sm">
                  WhatsApp
                </Badge>
              </div>

              {/* Chat Message Bubble */}
              <div className="p-5 bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:16px_16px] bg-slate-950 min-h-[300px] flex flex-col justify-end">
                {messageText.trim() ? (
                  <div className="bg-emerald-900/90 text-emerald-50 border border-emerald-700/60 p-3.5 rounded-2xl rounded-tr-xs shadow-lg max-w-[90%] self-end text-xs leading-relaxed whitespace-pre-wrap font-sans">
                    {messageText}
                    <div className="text-[10px] text-emerald-300/80 text-right mt-1.5 font-mono">
                      Just now &middot; Delivered ✓✓
                    </div>
                  </div>
                ) : (
                  <div className="text-center text-slate-500 text-xs italic py-12">
                    Message preview will appear here as you type...
                  </div>
                )}
              </div>

              <div className="p-3 bg-slate-900/90 border-t border-slate-800 text-center text-[11px] text-slate-400">
                Messages open securely in WhatsApp with end-to-end encryption.
              </div>
            </Card>
          </div>
        </div>
      )}

      {/* TAB 2: BROADCAST / BATCH */}
      {activeTab === "batch" && (
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-bold flex items-center gap-2">
                <Users className="w-4 h-4 text-emerald-600" />
                Class-Wide or Faculty Broadcast Composer
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Select
                  label="Broadcast Target Group *"
                  value={batchTarget}
                  onChange={(e) => setBatchTarget(e.target.value as any)}
                  options={[
                    { value: "ALL_PARENTS", label: "All School Parents" },
                    { value: "ALL_TEACHERS", label: "All Faculty Teachers" },
                    { value: "CLASS_PARENTS", label: "Specific Class Parents" },
                  ]}
                />
                <Select
                  label="Preset Template"
                  value={selectedTemplateId}
                  onChange={(e) => handleTemplateChange(e.target.value)}
                  options={[
                    { value: "CUSTOM", label: "Custom Broadcast Message" },
                    ...templates.map((t) => ({ value: t.id, label: t.name })),
                  ]}
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700">
                  Broadcast Message (Supports tokens: &#123;recipient_name&#125;, &#123;school_name&#125;)
                </label>
                <textarea
                  rows={5}
                  value={batchMessage}
                  onChange={(e) => setBatchMessage(e.target.value)}
                  placeholder="Dear {recipient_name}, This is an important notice from {school_name} regarding..."
                  className="w-full text-xs p-3 rounded-xl border border-slate-300 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 leading-relaxed font-sans"
                />
              </div>

              <Button
                variant="primary"
                size="md"
                onClick={handlePrepareBatch}
                isLoading={isPreparingBatch}
                leftIcon={<Layers className="w-4 h-4" />}
                className="bg-emerald-600 hover:bg-emerald-700 text-white"
              >
                Generate Personalized Batch WhatsApp Links
              </Button>
            </CardContent>
          </Card>

          {/* Batch Result List */}
          {batchResults.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-bold flex items-center justify-between">
                  <span>Prepared WhatsApp Queue ({batchResults.length} Recipients)</span>
                  <Badge variant="success" size="sm">
                    Ready to Dispatch
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 max-h-[50vh] overflow-y-auto pr-1">
                  {batchResults.map((item, idx) => (
                    <div
                      key={idx}
                      className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between gap-3 text-xs"
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-900">{item.recipientName}</span>
                          <span className="text-[11px] text-slate-400 font-mono-data">{item.phone}</span>
                        </div>
                        <p className="text-[11px] text-slate-500 truncate mt-0.5">{item.context}</p>
                      </div>

                      <a
                        href={item.whatsAppUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold shadow-xs shrink-0"
                      >
                        <MessageCircle className="w-3.5 h-3.5" />
                        Send via WhatsApp
                      </a>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* TAB 3: SMART TEMPLATES GALLERY */}
      {activeTab === "templates" && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {templates.map((tmpl) => (
            <Card key={tmpl.id} className="hover:border-emerald-300 transition-colors">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-bold">{tmpl.name}</CardTitle>
                  <Badge variant="neutral" size="sm">
                    {tmpl.category}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs font-sans whitespace-pre-wrap text-slate-700 leading-relaxed">
                  {tmpl.template}
                </div>
                <Button
                  variant="outline"
                  size="xs"
                  onClick={() => {
                    setMessageText(tmpl.template);
                    setSelectedTemplateId(tmpl.id);
                    setActiveTab("direct");
                    info(`Loaded "${tmpl.name}" into direct composer.`);
                  }}
                  leftIcon={<Copy className="w-3.5 h-3.5 text-emerald-600" />}
                >
                  Use Template in Direct Chat
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};
