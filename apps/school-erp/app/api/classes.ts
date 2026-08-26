import { api } from "@/convex/_generated/api";

/** Convex endpoint references for the Classes & Sections domain. */
export const classesApi = {
  listWithSections: api.classes.listClassesWithSections,
  create: api.classes.createClass,
  addSection: api.classes.addSection,
};
