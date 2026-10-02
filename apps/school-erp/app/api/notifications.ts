import { api } from "@/convex/_generated/api";
import { apiClient } from "./client";

/** Convex endpoint references for the Notifications domain. */
export const notificationsApi = {
  listForUser: api.notifications.listForUser,
  unreadCount: api.notifications.unreadCount,
  broadcast: api.notifications.broadcast,
  markRead: api.notifications.markRead,
  markAllRead: api.notifications.markAllRead,
  clearAll: api.notifications.clearAll,
};

/** NestJS REST API endpoints for Notifications */
export const notificationsRestApi = {
  list: () =>
    apiClient.get<any[]>('notifications'),
  create: (data: any) =>
    apiClient.post<any>('notifications', data),
  markAsRead: (id: string) =>
    apiClient.post<any>(`notifications/${id}/read`),
};
