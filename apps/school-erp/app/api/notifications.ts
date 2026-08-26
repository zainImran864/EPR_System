import { api } from "@/convex/_generated/api";

/** Convex endpoint references for the Notifications domain. */
export const notificationsApi = {
  listForUser: api.notifications.listForUser,
  unreadCount: api.notifications.unreadCount,
  broadcast: api.notifications.broadcast,
  markRead: api.notifications.markRead,
  markAllRead: api.notifications.markAllRead,
};
