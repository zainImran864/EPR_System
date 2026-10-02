import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "AcademiX — School Management Platform",
    short_name: "AcademiX",
    description:
      "Multi-tenant School ERP: admissions, attendance, marks, results, timetable and fees.",
    start_url: "/",
    display: "standalone",
    background_color: "#0F172A",
    theme_color: "#0D9488",
    orientation: "portrait",
    categories: ["education", "productivity"],
    icons: [
      { src: "/icon.svg", sizes: "any", type: "image/svg+xml", purpose: "any" },
      { src: "/icon-maskable.svg", sizes: "any", type: "image/svg+xml", purpose: "maskable" },
    ],
  };
}
