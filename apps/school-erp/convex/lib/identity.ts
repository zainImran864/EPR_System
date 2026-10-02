/**
 * Identity / email generation helpers for the multi-tenant auth model.
 * Emails are synthetic and unique PER SCHOOL:
 *   admin   → {name}admin@{slug}.com
 *   teacher → {name}T@{slug}.com
 *   student → {name}S@{slug}.com
 *   parent  → {name}P@{slug}.com
 */

/** Lowercase alphanumeric slug (used for the email domain + school code). */
export function slugify(name: string): string {
  return name
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^a-z0-9]+/g, "");
}

export type EmailRole = "admin" | "teacher" | "student" | "parent";

const ROLE_SUFFIX: Record<EmailRole, string> = {
  admin: "admin",
  teacher: "T",
  student: "S",
  parent: "P",
};

/** Base local part from a person's name, e.g. "John Smith" → "johnsmith". */
export function localBase(name: string): string {
  return slugify(name) || "user";
}

/** Build the email local part (without domain) for a role, with optional dedupe counter. */
export function emailLocal(name: string, role: EmailRole, counter = 0): string {
  const suffix = ROLE_SUFFIX[role];
  return `${localBase(name)}${suffix}${counter > 0 ? counter : ""}`;
}

/** Full synthetic email: {local}@{slug}.com */
export function buildEmail(name: string, role: EmailRole, slug: string, counter = 0): string {
  return `${emailLocal(name, role, counter)}@${slug}.com`;
}
