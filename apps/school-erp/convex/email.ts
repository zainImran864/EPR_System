"use node";

import { internalAction, action } from "./_generated/server";
import { internal } from "./_generated/api";
import { v } from "convex/values";
import nodemailer from "nodemailer";

export interface SchoolSmtp {
  host?: string;
  port?: number;
  user?: string;
  pass?: string;
  from?: string;
  secure?: boolean;
  enabled?: boolean;
}

// Reads SMTP creds from the Convex deployment env (platform default):
//   npx convex env set SMTPMAIL "you@gmail.com"
//   npx convex env set SMTPPASS "<gmail app password>"
function getTransport() {
  const user = process.env.SMTPMAIL;
  const pass = process.env.SMTPPASS;
  if (!user || !pass) {
    console.warn("[email] SMTPMAIL / SMTPPASS not set — skipping send.");
    return null;
  }
  return {
    transport: nodemailer.createTransport({
      host: "smtp.gmail.com",
      port: 465,
      secure: true,
      auth: { user, pass },
    }),
    from: `"AcademiX" <${user}>`,
  };
}

/** Prefer a school's own SMTP config; fall back to the platform transport. */
function resolveTransport(smtp?: SchoolSmtp | null, senderLabel = "AcademiX") {
  if (smtp?.enabled && smtp.host && smtp.user && smtp.pass) {
    const port = smtp.port ?? 587;
    return {
      transport: nodemailer.createTransport({
        host: smtp.host,
        port,
        secure: smtp.secure ?? port === 465,
        auth: { user: smtp.user, pass: smtp.pass },
      }),
      from: `"${senderLabel}" <${smtp.from || smtp.user}>`,
    };
  }
  return getTransport();
}

const smtpValidator = v.optional(
  v.object({
    host: v.optional(v.string()),
    port: v.optional(v.number()),
    user: v.optional(v.string()),
    pass: v.optional(v.string()),
    from: v.optional(v.string()),
    secure: v.optional(v.boolean()),
    enabled: v.optional(v.boolean()),
  })
);

const TEAL = "#0D9488";

/** Shared HTML shell: AcademiX header + card body + footer. */
function layout(bodyHtml: string): string {
  return `<!doctype html>
<html><body style="margin:0;background:#f1f5f9;font-family:Arial,Helvetica,sans-serif;color:#0f172a">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f1f5f9;padding:24px 0">
    <tr><td align="center">
      <table role="presentation" width="560" cellpadding="0" cellspacing="0" style="max-width:560px;background:#ffffff;border-radius:16px;overflow:hidden;border:1px solid #e2e8f0">
        <tr><td style="background:linear-gradient(90deg,#0D9488,#115E59);padding:22px 28px">
          <span style="font-size:20px;font-weight:800;color:#ffffff;letter-spacing:-.3px">Academi<span style="color:#2DD4BF">X</span></span>
          <div style="font-size:11px;color:#99f6e4;margin-top:2px">School Management Platform</div>
        </td></tr>
        <tr><td style="padding:28px">${bodyHtml}</td></tr>
        <tr><td style="padding:16px 28px;border-top:1px solid #f1f5f9;text-align:center;color:#94a3b8;font-size:11px">
          Sent by <b style="color:${TEAL}">AcademiX</b> · Please do not reply to this automated message.
        </td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`;
}

function detailRow(label: string, value: string): string {
  return `<tr>
    <td style="padding:6px 0;color:#64748b;font-size:13px;width:130px">${label}</td>
    <td style="padding:6px 0;color:#0f172a;font-size:13px;font-weight:600">${value}</td>
  </tr>`;
}

// ─── Registration received (pending review) ──────────────────────────────────

export const sendRegistrationPending = internalAction({
  args: {
    to: v.string(),
    adminName: v.string(),
    schoolName: v.string(),
    adminEmail: v.string(),
    classes: v.array(v.number()),
    address: v.optional(v.string()),
  },
  handler: async (_ctx, args) => {
    const t = getTransport();
    if (!t) return;
    const grades = args.classes.sort((a, b) => a - b).map((g) => `Grade ${g}`).join(", ");
    const body = `
      <h1 style="font-size:19px;margin:0 0 6px">Welcome, ${args.adminName} 👋</h1>
      <p style="font-size:14px;color:#475569;line-height:1.6;margin:0 0 18px">
        Thanks for registering <b>${args.schoolName}</b> on AcademiX. Your submission has been
        received and is now <b style="color:#b45309">under review</b> by our team.
      </p>
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:12px;padding:8px 16px;margin-bottom:18px">
        ${detailRow("Admin name", args.adminName)}
        ${detailRow("School", args.schoolName)}
        ${detailRow("Grades", grades || "—")}
        ${args.address ? detailRow("Address", args.address) : ""}
        ${detailRow("Login email", `<span style="font-family:monospace;color:${TEAL}">${args.adminEmail}</span>`)}
      </table>
      <p style="font-size:14px;color:#475569;line-height:1.6;margin:0 0 8px">
        Once approved, sign in with the <b>login email above</b> and the <b>password you set</b> during registration.
      </p>
      <p style="font-size:13px;color:#94a3b8;margin:0">You'll receive another email as soon as your school is approved.</p>`;
    await t.transport.sendMail({
      from: t.from,
      to: args.to,
      subject: `AcademiX · ${args.schoolName} registration received`,
      html: layout(body),
    });
  },
});

// ─── Approved ────────────────────────────────────────────────────────────────

export const sendApproved = internalAction({
  args: {
    to: v.string(),
    adminName: v.string(),
    schoolName: v.string(),
    adminEmail: v.string(),
  },
  handler: async (_ctx, args) => {
    const t = getTransport();
    if (!t) return;
    const body = `
      <h1 style="font-size:19px;margin:0 0 6px">🎉 ${args.schoolName} is approved!</h1>
      <p style="font-size:14px;color:#475569;line-height:1.6;margin:0 0 18px">
        Hi ${args.adminName}, your school has been approved on AcademiX. You now have full access to your admin dashboard.
      </p>
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f0fdfa;border:1px solid #99f6e4;border-radius:12px;padding:8px 16px;margin-bottom:18px">
        ${detailRow("Login email", `<span style="font-family:monospace;color:${TEAL}">${args.adminEmail}</span>`)}
      </table>
      <p style="font-size:14px;color:#475569;line-height:1.6;margin:0">
        Sign in with your login email and the password you set to start adding teachers, students, classes and more.
      </p>`;
    await t.transport.sendMail({
      from: t.from,
      to: args.to,
      subject: `AcademiX · ${args.schoolName} approved 🎉`,
      html: layout(body),
    });
  },
});

// ─── Declined ────────────────────────────────────────────────────────────────

export const sendDeclined = internalAction({
  args: {
    to: v.string(),
    adminName: v.string(),
    schoolName: v.string(),
    reason: v.optional(v.string()),
  },
  handler: async (_ctx, args) => {
    const t = getTransport();
    if (!t) return;
    const body = `
      <h1 style="font-size:19px;margin:0 0 6px">Registration update</h1>
      <p style="font-size:14px;color:#475569;line-height:1.6;margin:0 0 14px">
        Hi ${args.adminName}, unfortunately your registration for <b>${args.schoolName}</b> was not approved at this time.
      </p>
      ${
        args.reason
          ? `<div style="background:#fff1f2;border:1px solid #fecdd3;border-radius:12px;padding:12px 16px;margin-bottom:16px;color:#9f1239;font-size:13px"><b>Reason:</b> ${args.reason}</div>`
          : ""
      }
      <p style="font-size:13px;color:#94a3b8;margin:0">If you believe this was a mistake, please reach out to our support team.</p>`;
    await t.transport.sendMail({
      from: t.from,
      to: args.to,
      subject: `AcademiX · ${args.schoolName} registration update`,
      html: layout(body),
    });
  },
});

// ─── School-branded layout (school logo TOP, AcademiX text at BOTTOM) ─────────
// Used for provisioning + test emails so the recipient sees THEIR school first.

function schoolLayout(
  bodyHtml: string,
  schoolName: string,
  schoolLogoUrl?: string | null,
  accent = TEAL
): string {
  const logo = schoolLogoUrl
    ? `<img src="${schoolLogoUrl}" alt="${schoolName}" width="52" height="52" style="border-radius:10px;object-fit:cover;background:#ffffff;display:block" />`
    : `<div style="width:52px;height:52px;border-radius:10px;background:#ffffff;color:${accent};font-size:24px;font-weight:800;line-height:52px;text-align:center">${(schoolName || "S").charAt(0)}</div>`;
  return `<!doctype html>
<html><body style="margin:0;background:#f1f5f9;font-family:Arial,Helvetica,sans-serif;color:#0f172a">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f1f5f9;padding:24px 0">
    <tr><td align="center">
      <table role="presentation" width="560" cellpadding="0" cellspacing="0" style="max-width:560px;background:#ffffff;border-radius:16px;overflow:hidden;border:1px solid #e2e8f0">
        <tr><td style="background:linear-gradient(90deg,${accent},#0f172a);padding:22px 28px">
          <table role="presentation" cellpadding="0" cellspacing="0"><tr>
            <td style="padding-right:14px">${logo}</td>
            <td style="vertical-align:middle">
              <div style="font-size:19px;font-weight:800;color:#ffffff;letter-spacing:-.3px">${schoolName}</div>
              <div style="font-size:11px;color:rgba(255,255,255,.75);margin-top:2px">Powered by AcademiX</div>
            </td>
          </tr></table>
        </td></tr>
        <tr><td style="padding:28px">${bodyHtml}</td></tr>
        <tr><td style="padding:16px 28px;border-top:1px solid #f1f5f9;text-align:center;color:#94a3b8;font-size:11px">
          Powered by <b style="color:${TEAL}">AcademiX</b> · School Management Platform<br/>
          This is an automated message — please do not reply.
        </td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`;
}

/** A highlighted credentials card (login email + password). */
function credentialCard(email: string, password: string): string {
  return `
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f0fdfa;border:1px solid #99f6e4;border-radius:12px;margin:6px 0 18px">
    <tr><td style="padding:16px 18px">
      <div style="font-size:11px;font-weight:700;color:${TEAL};text-transform:uppercase;letter-spacing:.5px;margin-bottom:8px">Your Login Details</div>
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
        ${detailRow("Login email", `<span style="font-family:monospace;color:${TEAL};font-size:14px">${email}</span>`)}
        ${detailRow("Password", `<span style="font-family:monospace;font-size:14px">${password}</span>`)}
      </table>
    </td></tr>
  </table>`;
}

const signInNote = `<p style="font-size:12px;color:#94a3b8;margin:8px 0 0">
  For your security, please sign in and change your password from <b>Settings</b> after your first login.
</p>`;

// ─── Student credentials ─────────────────────────────────────────────────────
export const sendStudentCredentials = internalAction({
  args: {
    to: v.string(),
    studentName: v.string(),
    loginEmail: v.string(),
    password: v.string(),
    schoolName: v.string(),
    schoolLogoUrl: v.optional(v.union(v.string(), v.null())),
    smtp: smtpValidator,
  },
  handler: async (_ctx, args) => {
    const t = resolveTransport(args.smtp ?? null, args.schoolName);
    if (!t) return;
    const body = `
      <h1 style="font-size:19px;margin:0 0 6px">Welcome to ${args.schoolName}, ${args.studentName} 🎓</h1>
      <p style="font-size:14px;color:#475569;line-height:1.6;margin:0 0 4px">
        Your student portal account is ready. Sign in to view your timetable, results,
        attendance and school announcements.
      </p>
      ${credentialCard(args.loginEmail, args.password)}
      ${signInNote}`;
    await t.transport.sendMail({
      from: t.from,
      to: args.to,
      subject: `${args.schoolName} · Your student login`,
      html: schoolLayout(body, args.schoolName, args.schoolLogoUrl),
    });
  },
});

// ─── Parent / guardian credentials ───────────────────────────────────────────
export const sendParentCredentials = internalAction({
  args: {
    to: v.string(),
    parentName: v.string(),
    studentName: v.string(),
    loginEmail: v.string(),
    password: v.string(),
    schoolName: v.string(),
    schoolLogoUrl: v.optional(v.union(v.string(), v.null())),
    smtp: smtpValidator,
  },
  handler: async (_ctx, args) => {
    const t = resolveTransport(args.smtp ?? null, args.schoolName);
    if (!t) return;
    const body = `
      <h1 style="font-size:19px;margin:0 0 6px">Guardian access for ${args.studentName}</h1>
      <p style="font-size:14px;color:#475569;line-height:1.6;margin:0 0 4px">
        Dear ${args.parentName}, a guardian account has been created for you at
        <b>${args.schoolName}</b>. Use it to follow ${args.studentName}'s results,
        attendance, timetable and fees.
      </p>
      ${credentialCard(args.loginEmail, args.password)}
      ${signInNote}`;
    await t.transport.sendMail({
      from: t.from,
      to: args.to,
      subject: `${args.schoolName} · Your parent portal login`,
      html: schoolLayout(body, args.schoolName, args.schoolLogoUrl),
    });
  },
});

// ─── Teacher credentials ─────────────────────────────────────────────────────
export const sendTeacherCredentials = internalAction({
  args: {
    to: v.string(),
    teacherName: v.string(),
    loginEmail: v.string(),
    password: v.string(),
    schoolName: v.string(),
    schoolLogoUrl: v.optional(v.union(v.string(), v.null())),
    smtp: smtpValidator,
  },
  handler: async (_ctx, args) => {
    const t = resolveTransport(args.smtp ?? null, args.schoolName);
    if (!t) return;
    const body = `
      <h1 style="font-size:19px;margin:0 0 6px">Welcome to the faculty, ${args.teacherName} 👋</h1>
      <p style="font-size:14px;color:#475569;line-height:1.6;margin:0 0 4px">
        A teacher account has been created for you at <b>${args.schoolName}</b>. Sign in
        to manage your classes, upload marks, mark attendance and view your timetable.
      </p>
      ${credentialCard(args.loginEmail, args.password)}
      ${signInNote}`;
    await t.transport.sendMail({
      from: t.from,
      to: args.to,
      subject: `${args.schoolName} · Your teacher login`,
      html: schoolLayout(body, args.schoolName, args.schoolLogoUrl),
    });
  },
});

// ─── SMTP test connection (public action → returns result to the admin UI) ────
export const testSmtpConnection = action({
  args: { schoolId: v.id("schools"), to: v.string() },
  handler: async (ctx, args): Promise<{ ok: boolean; error?: string }> => {
    const school = await ctx.runQuery(internal.schools.getSchoolInternal, {
      schoolId: args.schoolId,
    });
    if (!school) return { ok: false, error: "School not found" };

    // For a test we use the saved config regardless of the enabled flag.
    const t = resolveTransport(
      {
        host: school.smtpHost,
        port: school.smtpPort,
        user: school.smtpUser,
        pass: school.smtpPass,
        from: school.smtpFrom,
        secure: school.smtpSecure,
        enabled: true,
      },
      school.name
    );
    if (!t) return { ok: false, error: "No SMTP configuration found" };

    const body = `
      <h1 style="font-size:19px;margin:0 0 6px">✅ SMTP connection successful</h1>
      <p style="font-size:14px;color:#475569;line-height:1.6;margin:0 0 4px">
        This is a test email from <b>${school.name}</b>. If you're reading this, your
        school's email server is configured correctly and ready to send login details
        to your teachers, students and parents.
      </p>
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:12px;margin-top:14px">
        <tr><td style="padding:14px 18px">
          ${detailRow("Host", school.smtpHost ?? "—")}
          ${detailRow("Port", String(school.smtpPort ?? "—"))}
          ${detailRow("Username", school.smtpUser ?? "—")}
        </td></tr>
      </table>`;

    try {
      await t.transport.sendMail({
        from: t.from,
        to: args.to,
        subject: `${school.name} · SMTP test successful`,
        html: schoolLayout(body, school.name, school.logoUrl),
      });
      return { ok: true };
    } catch (e) {
      return { ok: false, error: e instanceof Error ? e.message : "Send failed" };
    }
  },
});
