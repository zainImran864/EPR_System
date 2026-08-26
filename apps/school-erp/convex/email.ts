"use node";

import { internalAction } from "./_generated/server";
import { v } from "convex/values";
import nodemailer from "nodemailer";

// Reads SMTP creds from the Convex deployment env:
//   npx convex env set SMTPMAIL "you@gmail.com"
//   npx convex env set SMTPPASS "<gmail app password>"
function getTransport() {
  const user = process.env.SMTPMAIL;
  const pass = process.env.SMTPPASS;
  if (!user || !pass) {
    console.warn("[email] SMTPMAIL / SMTPPASS not set — skipping send.");
    return null;
  }
  return nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 465,
    secure: true,
    auth: { user, pass },
  });
}

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
    const transport = getTransport();
    if (!transport) return;
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
    await transport.sendMail({
      from: `"AcademiX" <${process.env.SMTPMAIL}>`,
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
    const transport = getTransport();
    if (!transport) return;
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
    await transport.sendMail({
      from: `"AcademiX" <${process.env.SMTPMAIL}>`,
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
    const transport = getTransport();
    if (!transport) return;
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
    await transport.sendMail({
      from: `"AcademiX" <${process.env.SMTPMAIL}>`,
      to: args.to,
      subject: `AcademiX · ${args.schoolName} registration update`,
      html: layout(body),
    });
  },
});
