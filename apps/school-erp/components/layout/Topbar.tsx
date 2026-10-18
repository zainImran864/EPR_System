"use client";

import React, { useState, useRef, useEffect, useMemo } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { useAppStore } from "@/app/store/useAppStore";
import { cn } from "@/app/lib/utils";
import {
  Menu,
  LogOut,
  User as UserIcon,
  ShieldAlert,
  Settings,
  ChevronDown,
  Search,
  CornerDownLeft,
  ChevronRight,
  Palette,
  X,
} from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { Avatar } from "@/components/ui/Avatar";
import { NotificationBell } from "./NotificationBell";
import { ParentChildSwitcher } from "./ParentChildSwitcher";
import { LanguageToggle } from "./LanguageToggle";
import { useAuth } from "@/app/hooks/useAuth";
import { THEME_OPTIONS, DEFAULT_THEME, applyThemeColor } from "@/app/lib/theme";
import type { NavLink } from "./navConfig";

export interface TopbarProps {
  title?: string;
  subtitle?: string;
  sectionGroup?: string;
  nav?: NavLink[];
  onSeedData?: () => void;
  isSeeding?: boolean;
  userName?: string;
  userRole?: string;
  onLogout?: () => void;
  schoolName?: string;
  schoolLogoUrl?: string | null;
}

export const Topbar: React.FC<TopbarProps> = ({
  title = "Oakridge Academy Portal",
  subtitle = "Academic Year 2026-2027",
  sectionGroup,
  nav = [],
  userName = "Administrator",
  userRole = "Admin",
  onLogout,
}) => {
  const { isSidebarOpen, toggleSidebar } = useAppStore();
  const { user, role } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [cmdOpen, setCmdOpen] = useState(false);
  const [cmdQuery, setCmdQuery] = useState("");
  const [cmdIndex, setCmdIndex] = useState(0);
  const [activeHex, setActiveHex] = useState<string>(user?.themeColor || DEFAULT_THEME);

  const dropdownRef = useRef<HTMLDivElement>(null);
  const cmdInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (user?.themeColor) {
      setActiveHex(user.themeColor);
    }
  }, [user?.themeColor]);

  // Role prefix for routes: admin, teacher, student, parent, superadmin
  const rolePrefix =
    role || (userRole ? userRole.toLowerCase().replace(/[\s_]+/g, "") : "admin");
  const displayEmail =
    user?.email || `${userName.toLowerCase().replace(/\s+/g, ".")}@school.edu`;

  // Command palette items combining role nav + account routes
  const commandItems = useMemo(() => {
    const base = nav.map((n) => ({
      href: n.href,
      label: n.label,
      group: n.group || "Navigation",
      description: n.description || `Go to ${n.label}`,
      icon: n.icon,
    }));

    const accountItems = [
      {
        href: `/${rolePrefix}/profile`,
        label: "My Profile & Biometrics",
        group: "Account",
        description: "Update personal info, phone number & profile picture",
        icon: <UserIcon className="w-4 h-4" />,
      },
      {
        href: `/${rolePrefix}/audit-logs`,
        label: "Audit Logs & Activity",
        group: "Account",
        description: "Review security events and recent account actions",
        icon: <ShieldAlert className="w-4 h-4" />,
      },
      {
        href: `/${rolePrefix}/settings`,
        label: "Account & System Settings",
        group: "Account",
        description: "Configure security, 2FA, notifications & theme",
        icon: <Settings className="w-4 h-4" />,
      },
    ];

    const seen = new Set(base.map((b) => b.href));
    for (const acc of accountItems) {
      if (!seen.has(acc.href)) base.push(acc);
    }
    return base;
  }, [nav, rolePrefix]);

  const filteredCommands = useMemo(() => {
    const q = cmdQuery.trim().toLowerCase();
    if (!q) return commandItems;
    return commandItems.filter(
      (item) =>
        item.label.toLowerCase().includes(q) ||
        item.group.toLowerCase().includes(q) ||
        item.description.toLowerCase().includes(q)
    );
  }, [commandItems, cmdQuery]);

  // Reset active command index when query changes
  useEffect(() => {
    setCmdIndex(0);
  }, [cmdQuery, cmdOpen]);

  // Global keyboard shortcut: Cmd+K / Ctrl+K
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setCmdOpen((prev) => !prev);
      } else if (e.key === "Escape" && cmdOpen) {
        setCmdOpen(false);
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [cmdOpen]);

  // Auto-focus command input when opened
  useEffect(() => {
    if (cmdOpen) {
      setTimeout(() => cmdInputRef.current?.focus(), 20);
    } else {
      setCmdQuery("");
    }
  }, [cmdOpen]);

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelectCommand = (href: string) => {
    setCmdOpen(false);
    router.push(href);
  };

  const handleQuickTheme = (hex: string) => {
    setActiveHex(hex);
    applyThemeColor(hex);
  };

  return (
    <>
      <header
        className={cn(
          "fixed top-0 right-0 z-30 h-16 bg-white/95 backdrop-blur-md border-b border-slate-200/80 transition-all duration-300 ease-in-out flex items-center justify-between px-4 sm:px-6",
          isSidebarOpen ? "left-0 md:left-64" : "left-0 md:left-20"
        )}
      >
        {/* Left: Mobile Toggle & Page Context */}
        <div className="flex items-center gap-3 min-w-0">
          <button
            type="button"
            onClick={toggleSidebar}
            aria-label="Toggle navigation menu"
            className="p-2 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100 md:hidden transition-colors shrink-0"
          >
            <Menu className="w-5 h-5" />
          </button>

          <div className="flex flex-col min-w-0">
            <div className="flex items-center gap-2 min-w-0">
              {sectionGroup && (
                <span className="hidden lg:inline-flex items-center gap-1 text-xs font-medium text-slate-400">
                  <span>{sectionGroup}</span>
                  <ChevronRight className="w-3.5 h-3.5 text-slate-300" />
                </span>
              )}
              <h1 className="text-base font-bold text-slate-900 tracking-tight truncate">
                {title}
              </h1>
              <Badge variant="primary" size="sm" isMono className="hidden xs:inline-flex">
                2026-2027
              </Badge>
            </div>
            <span className="text-[11px] text-slate-500 hidden sm:inline truncate">
              {subtitle}
            </span>
          </div>
        </div>

        {/* Center/Right: Command Search Trigger + Notifications + User Menu */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Quick Jump / Command Palette Trigger */}
          {commandItems.length > 0 && (
            <button
              type="button"
              onClick={() => setCmdOpen(true)}
              aria-label="Quick search modules (Ctrl+K)"
              className="flex items-center justify-between gap-3 px-2.5 sm:px-3.5 py-1.5 rounded-xl bg-slate-50 hover:bg-slate-100/90 border border-slate-200/90 hover:border-slate-300 text-xs text-slate-500 transition-all group cursor-pointer"
            >
              <span className="flex items-center gap-2">
                <Search className="w-3.5 h-3.5 text-slate-400 group-hover:text-primary transition-colors" />
                <span className="hidden md:inline font-medium text-slate-500 group-hover:text-slate-700">
                  Quick jump to module…
                </span>
              </span>
              <kbd className="hidden sm:inline-flex items-center px-1.5 py-0.5 text-[10px] font-mono-data font-semibold text-slate-400 bg-white rounded border border-slate-200 shadow-2xs">
                ⌘K
              </kbd>
            </button>
          )}

          {/* Multi-Child Switcher for Parent Portal */}
          {rolePrefix === "parent" && <ParentChildSwitcher />}

          {/* Multi-Language Toggle (English / اردو) */}
          <LanguageToggle />

          {/* Notification Bell */}
          <NotificationBell />

          {/* User Profile Dropdown Menu */}
          <div className="relative border-l border-slate-200 pl-2.5 sm:pl-3" ref={dropdownRef}>
            <button
              type="button"
              onClick={() => setDropdownOpen((prev) => !prev)}
              aria-expanded={dropdownOpen}
              aria-haspopup="menu"
              className="flex items-center gap-2.5 p-1.5 rounded-xl hover:bg-slate-100/80 transition-all group focus-visible:outline-2 focus-visible:outline-primary"
            >
              <Avatar name={userName} size="sm" />
              <div className="hidden sm:flex flex-col text-left">
                <span className="text-xs font-semibold text-slate-800 leading-tight truncate max-w-[130px]">
                  {userName}
                </span>
                <span className="text-[10px] text-slate-500 capitalize">{userRole}</span>
              </div>
              <ChevronDown
                className={cn(
                  "w-3.5 h-3.5 text-slate-400 group-hover:text-slate-700 transition-transform duration-200",
                  dropdownOpen && "rotate-180"
                )}
              />
            </button>

            {/* Dropdown Menu Modal */}
            {dropdownOpen && (
              <div
                role="menu"
                className="absolute right-0 mt-2 w-68 rounded-2xl bg-white border border-slate-200/90 shadow-xl shadow-slate-900/10 py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-150"
              >
                {/* Header Info */}
                <div className="px-4 py-3 border-b border-slate-100 flex items-center gap-3 bg-slate-50/60">
                  <Avatar name={userName} size="md" />
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-bold text-slate-900 truncate">{userName}</p>
                    <p className="text-[11px] text-slate-500 truncate font-mono-data">
                      {displayEmail}
                    </p>
                    <div className="mt-1">
                      <Badge variant="primary" size="sm" className="uppercase text-[10px]">
                        {userRole}
                      </Badge>
                    </div>
                  </div>
                </div>

                {/* Quick Theme Swatches */}
                <div className="px-4 py-2.5 border-b border-slate-100">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1">
                      <Palette className="w-3 h-3" /> Accent Theme
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    {THEME_OPTIONS.map((t) => {
                      const isSelected = activeHex.toLowerCase() === t.hex.toLowerCase();
                      return (
                        <button
                          key={t.hex}
                          type="button"
                          onClick={() => handleQuickTheme(t.hex)}
                          title={`${t.name} theme`}
                          aria-label={`Apply ${t.name} theme`}
                          style={{ backgroundColor: t.hex }}
                          className={cn(
                            "w-5 h-5 rounded-full transition-transform hover:scale-110 cursor-pointer",
                            isSelected && "ring-2 ring-offset-2 ring-slate-800 scale-110"
                          )}
                        />
                      );
                    })}
                  </div>
                </div>

                {/* Navigation Actions */}
                <div className="px-2 py-1.5 space-y-0.5">
                  <Link
                    href={`/${rolePrefix}/profile`}
                    onClick={() => setDropdownOpen(false)}
                    className="flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-slate-700 rounded-xl hover:bg-primary-50 hover:text-primary-900 transition-colors"
                  >
                    <UserIcon className="w-4 h-4 text-primary" />
                    <span>My Profile &amp; Biometrics</span>
                  </Link>

                  <Link
                    href={`/${rolePrefix}/audit-logs`}
                    onClick={() => setDropdownOpen(false)}
                    className="flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-slate-700 rounded-xl hover:bg-primary-50 hover:text-primary-900 transition-colors"
                  >
                    <ShieldAlert className="w-4 h-4 text-primary" />
                    <span>Audit Logs &amp; Activity</span>
                  </Link>

                  <Link
                    href={`/${rolePrefix}/settings`}
                    onClick={() => setDropdownOpen(false)}
                    className="flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-slate-700 rounded-xl hover:bg-primary-50 hover:text-primary-900 transition-colors"
                  >
                    <Settings className="w-4 h-4 text-slate-500" />
                    <span>Account &amp; System Settings</span>
                  </Link>
                </div>

                {/* Logout Footer */}
                {onLogout && (
                  <div className="border-t border-slate-100 px-2 pt-1.5 mt-1">
                    <button
                      type="button"
                      onClick={() => {
                        setDropdownOpen(false);
                        onLogout();
                      }}
                      className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-50 rounded-xl transition-colors text-left"
                    >
                      <LogOut className="w-4 h-4 text-rose-500" />
                      <span>Sign Out</span>
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Command Palette (⌘K) Modal */}
      {cmdOpen && (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-[12vh] p-4">
          <div
            className="fixed inset-0 bg-slate-950/50 backdrop-blur-xs transition-opacity"
            onClick={() => setCmdOpen(false)}
            aria-hidden="true"
          />
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Quick navigation command palette"
            className="relative z-10 w-full max-w-lg rounded-2xl bg-white border border-slate-200 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150"
          >
            {/* Search Input Header */}
            <div className="flex items-center gap-3 px-4 py-3.5 border-b border-slate-100">
              <Search className="w-4 h-4 text-primary shrink-0" />
              <input
                ref={cmdInputRef}
                type="text"
                value={cmdQuery}
                onChange={(e) => setCmdQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "ArrowDown") {
                    e.preventDefault();
                    setCmdIndex((i) =>
                      filteredCommands.length ? (i + 1) % filteredCommands.length : 0
                    );
                  } else if (e.key === "ArrowUp") {
                    e.preventDefault();
                    setCmdIndex((i) =>
                      filteredCommands.length
                        ? (i - 1 + filteredCommands.length) % filteredCommands.length
                        : 0
                    );
                  } else if (e.key === "Enter" && filteredCommands[cmdIndex]) {
                    e.preventDefault();
                    handleSelectCommand(filteredCommands[cmdIndex].href);
                  }
                }}
                placeholder="Type a module or setting to jump (e.g. Students, Attendance, Fees)…"
                className="flex-1 text-sm text-slate-900 placeholder:text-slate-400 bg-transparent focus:outline-none"
              />
              {cmdQuery && (
                <button
                  type="button"
                  onClick={() => setCmdQuery("")}
                  aria-label="Clear search"
                  className="p-1 rounded-md text-slate-400 hover:text-slate-600 hover:bg-slate-100"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
              <kbd className="px-1.5 py-0.5 text-[10px] font-mono-data font-semibold text-slate-400 bg-slate-50 rounded border border-slate-200">
                ESC
              </kbd>
            </div>

            {/* Results List */}
            <div className="max-h-80 overflow-y-auto p-2 space-y-1">
              {filteredCommands.length === 0 ? (
                <div className="py-10 text-center text-xs text-slate-400">
                  No matching modules found for &ldquo;{cmdQuery}&rdquo;.
                </div>
              ) : (
                filteredCommands.map((item, idx) => {
                  const isActive = idx === cmdIndex;
                  const isCurrentRoute = pathname.startsWith(item.href);
                  return (
                    <button
                      key={item.href}
                      type="button"
                      onMouseEnter={() => setCmdIndex(idx)}
                      onClick={() => handleSelectCommand(item.href)}
                      className={cn(
                        "w-full flex items-center justify-between gap-3 px-3 py-2.5 rounded-xl text-left transition-colors cursor-pointer",
                        isActive ? "bg-primary-50 text-slate-900" : "hover:bg-slate-50 text-slate-700"
                      )}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div
                          className={cn(
                            "w-8 h-8 rounded-lg flex items-center justify-center shrink-0 transition-colors",
                            isActive
                              ? "bg-primary text-white shadow-xs"
                              : "bg-slate-100 text-slate-500"
                          )}
                        >
                          {item.icon}
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-semibold text-slate-900 truncate">
                              {item.label}
                            </span>
                            <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-slate-100 text-slate-500">
                              {item.group}
                            </span>
                            {isCurrentRoute && (
                              <span className="text-[10px] font-semibold text-primary">
                                • Current
                              </span>
                            )}
                          </div>
                          <p className="text-[11px] text-slate-500 truncate mt-0.5">
                            {item.description}
                          </p>
                        </div>
                      </div>
                      <CornerDownLeft
                        className={cn(
                          "w-3.5 h-3.5 shrink-0 transition-opacity",
                          isActive ? "text-primary opacity-100" : "opacity-0"
                        )}
                      />
                    </button>
                  );
                })
              )}
            </div>

            {/* Footer Hints */}
            <div className="px-4 py-2.5 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
              <div className="flex items-center gap-3">
                <span>
                  <strong className="font-mono-data text-slate-600">↑↓</strong> Navigate
                </span>
                <span>
                  <strong className="font-mono-data text-slate-600">↵</strong> Open
                </span>
                <span>
                  <strong className="font-mono-data text-slate-600">ESC</strong> Close
                </span>
              </div>
              <span className="font-medium text-slate-400">Quick Module Jumper</span>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

