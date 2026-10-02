/**
 * Client-side mirror of convex/lib/identity.ts for live email previews in the
 * admin provisioning forms. The server remains the source of truth (it also
 * appends a numeric suffix on collisions); this is preview-only.
 */

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

/** Preview the synthetic login email: {name}{suffix}@{slug}.com */
export function previewEmail(
  name: string,
  role: EmailRole,
  schoolCode: string | undefined | null
): string {
  const local = slugify(name) || "user";
  const slug = slugify(schoolCode ?? "school") || "school";
  return `${local}${ROLE_SUFFIX[role]}@${slug}.com`;
}
