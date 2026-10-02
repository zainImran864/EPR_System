import { api } from "@/convex/_generated/api";
import { apiClient } from "./client";

/** Convex endpoint reference for seeding demo tenant data. */
export const seedApi = {
  seedSchool: api.seed.seedSchool,
  seedDemo: () =>
    apiClient.post<{ success: boolean; message: string; credentials: any }>('seed/demo'),
};
