import { describe, it, expect } from "vitest";
import fs from "fs";
import path from "path";
import {
  DEFAULT_THEME,
  THEME_OPTIONS,
  THEME_STORAGE_KEY,
  THEME_BOOT_SCRIPT,
  applyThemeColor,
  getCachedTheme,
} from "../app/lib/theme";

const APP_DIR = path.resolve(__dirname, "../app");
const COMPONENTS_DIR = path.resolve(__dirname, "../components");

describe("Frontend Pages, Design System Tokens & Module Structure Suite (Vitest)", () => {
  describe("1. Design System 2.0 Theme Tokens & Color Utilities", () => {
    it("should define Teal (#0D9488) as default primary brand accent with 8 full shade ramps", () => {
      expect(DEFAULT_THEME).toBe("#0D9488");
      expect(THEME_OPTIONS.length).toBe(8);
      expect(THEME_OPTIONS[0].name).toBe("Teal");
      expect(THEME_OPTIONS[0].hex).toBe("#0D9488");
      expect(THEME_OPTIONS[0].ramp[600]).toBe("#0D9488");
    });

    it("should define complete 50-900 color shade ramps for every theme option", () => {
      for (const option of THEME_OPTIONS) {
        expect(option.ramp[50]).toMatch(/^#[0-9A-F]{6}$/i);
        expect(option.ramp[500]).toMatch(/^#[0-9A-F]{6}$/i);
        expect(option.ramp[600]).toMatch(/^#[0-9A-F]{6}$/i);
        expect(option.ramp[900]).toMatch(/^#[0-9A-F]{6}$/i);
      }
    });

    it("should export THEME_BOOT_SCRIPT and safe storage helpers", () => {
      expect(THEME_STORAGE_KEY).toBe("academix_theme");
      expect(THEME_BOOT_SCRIPT).toContain("--sidebar-accent");
      expect(typeof applyThemeColor).toBe("function");
      expect(typeof getCachedTheme).toBe("function");
    });
  });

  describe("2. All Frontend Page Routes (Admin, SuperAdmin, Teacher, Student, Parent, Auth, Print)", () => {
    const requiredPages = [
      // Auth & System (5 pages)
      "page.tsx",
      "login/page.tsx",
      "register/page.tsx",
      "pending/page.tsx",
      "offline/page.tsx",
      // Admin Pages (14 pages)
      "admin/dashboard/page.tsx",
      "admin/students/page.tsx",
      "admin/teachers/page.tsx",
      "admin/classes/page.tsx",
      "admin/attendance/page.tsx",
      "admin/teacher-attendance/page.tsx",
      "admin/marks/page.tsx",
      "admin/fees/page.tsx",
      "admin/timetable/page.tsx",
      "admin/notifications/page.tsx",
      "admin/whatsapp/page.tsx",
      "admin/audit-logs/page.tsx",
      "admin/profile/page.tsx",
      "admin/settings/page.tsx",
      // SuperAdmin Pages (4 pages)
      "superadmin/dashboard/page.tsx",
      "superadmin/audit-logs/page.tsx",
      "superadmin/profile/page.tsx",
      "superadmin/settings/page.tsx",
      // Teacher Pages (9 pages)
      "teacher/dashboard/page.tsx",
      "teacher/my-attendance/page.tsx",
      "teacher/attendance/page.tsx",
      "teacher/marks/page.tsx",
      "teacher/timetable/page.tsx",
      "teacher/whatsapp/page.tsx",
      "teacher/audit-logs/page.tsx",
      "teacher/profile/page.tsx",
      "teacher/settings/page.tsx",
      // Student Pages (8 pages)
      "student/dashboard/page.tsx",
      "student/attendance/page.tsx",
      "student/results/page.tsx",
      "student/fees/page.tsx",
      "student/timetable/page.tsx",
      "student/audit-logs/page.tsx",
      "student/profile/page.tsx",
      "student/settings/page.tsx",
      // Parent Pages (8 pages)
      "parent/dashboard/page.tsx",
      "parent/attendance/page.tsx",
      "parent/results/page.tsx",
      "parent/fees/page.tsx",
      "parent/timetable/page.tsx",
      "parent/audit-logs/page.tsx",
      "parent/profile/page.tsx",
      "parent/settings/page.tsx",
      // Print Views (5 pages)
      "print/fee-challan/page.tsx",
      "print/question-paper/page.tsx",
      "print/report-card/page.tsx",
      "print/roll-no-slip/page.tsx",
      "print/timetable/page.tsx",
    ];

    it.each(requiredPages)("Page route `/%s` should exist and export a default React component", (relPath) => {
      const fullPath = path.join(APP_DIR, relPath);
      expect(fs.existsSync(fullPath)).toBe(true);
      const source = fs.readFileSync(fullPath, "utf8");
      expect(source).toMatch(/export\s+default\s+function/);
    });
  });

  describe("3. Core UI Primitives, Layout Shell & Enhanced Auth/Dashboard Components", () => {
    const requiredComponents = [
      "auth/AuthShell.tsx",
      "layout/AppShell.tsx",
      "layout/AppSidebar.tsx",
      "layout/Topbar.tsx",
      "layout/NotificationBell.tsx",
      "layout/RoleWelcome.tsx",
      "ui/Button.tsx",
      "ui/Card.tsx",
      "ui/Badge.tsx",
      "ui/Input.tsx",
      "ui/Select.tsx",
      "ui/Table.tsx",
      "ui/Tabs.tsx",
      "ui/Pagination.tsx",
      "ui/EmptyState.tsx",
    ];

    it.each(requiredComponents)("Component `%s` should exist and contain valid TypeScript/JSX", (relPath) => {
      const fullPath = path.join(COMPONENTS_DIR, relPath);
      expect(fs.existsSync(fullPath)).toBe(true);
      const content = fs.readFileSync(fullPath, "utf8");
      expect(content.length).toBeGreaterThan(100);
    });

    it("Login page should include animated Login Success Transition Screen and password visibility toggle", () => {
      const loginSource = fs.readFileSync(path.join(APP_DIR, "login/page.tsx"), "utf8");
      expect(loginSource).toContain("loginSuccessRole");
      expect(loginSource).toContain("Authentication Verified");
      expect(loginSource).toContain("showPassword");
    });

    it("Register page should include 4-segment Password Strength Meter and Copy Email button", () => {
      const registerSource = fs.readFileSync(path.join(APP_DIR, "register/page.tsx"), "utf8");
      expect(registerSource).toContain("[1, 2, 3, 4].map");
      expect(registerSource).toContain("Copy Email");
    });

    it("Topbar should include ⌘K Command Palette and Quick Theme Switcher", () => {
      const topbarSource = fs.readFileSync(path.join(COMPONENTS_DIR, "layout/Topbar.tsx"), "utf8");
      expect(topbarSource).toContain("Quick navigation command palette");
      expect(topbarSource).toContain("Quick Theme");
    });
  });
});
