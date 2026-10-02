import { api } from "@/convex/_generated/api";
import { apiClient } from "./client";

/** Convex endpoint references for the Classes & Sections domain. */
export const classesApi = {
  listWithSections: api.classes.listClassesWithSections,
  create: api.classes.createClass,
  addSection: api.classes.addSection,
  updateClass: api.classes.updateClass,
  updateSection: api.classes.updateSection,
};

/** NestJS REST API endpoints for Classes */
export const classesRestApi = {
  listClasses: () =>
    apiClient.get<any[]>('classes'),
  createClass: (data: any) =>
    apiClient.post<any>('classes', data),
  createSection: (data: any) =>
    apiClient.post<any>('classes/sections', data),
  deleteSection: (id: string) =>
    apiClient.delete<any>(`classes/sections/${id}`),
  listSubjects: () =>
    apiClient.get<any[]>('classes/subjects'),
  createSubject: (data: any) =>
    apiClient.post<any>('classes/subjects', data),
};
