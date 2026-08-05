/**
 * EMY Studio — Notification System
 * Handles in-app, push, and email notifications.
 * Works online and offline via service worker.
 */

export type NotificationType =
  | "gig_match"
  | "project_ready"
  | "music_new"
  | "booking_update"
  | "system";

export interface AppNotification {
  id: string;
  type: NotificationType;
  title: string;
  body: string;
  createdAt: string;
  read: boolean;
  actionUrl?: string;
  actionLabel?: string;
}

const STORAGE_KEY = "emy-studio-notifications";

// ── Read / Write ──────────────────────────────────────────────

export function getNotifications(): AppNotification[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveNotifications(notifications: AppNotification[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(notifications));
  } catch {}
}

export function addNotification(
  n: Omit<AppNotification, "id" | "createdAt" | "read">
): AppNotification {
  const notifications = getNotifications();
  const newNote: AppNotification = {
    ...n,
    id: `notif-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    createdAt: new Date().toISOString(),
    read: false,
  };
  notifications.unshift(newNote);
  // Keep last 100 notifications only
  saveNotifications(notifications.slice(0, 100));
  // Also fire a browser notification if permission granted
  fireBrowserNotification(newNote);
  return newNote;
}

export function markAllRead(): void {
  const notifications = getNotifications();
  saveNotifications(notifications.map((n) => ({ ...n, read: true })));
}

export function markRead(id: string): void {
  const notifications = getNotifications();
  saveNotifications(
    notifications.map((n) => (n.id === id ? { ...n, read: true } : n))
  );
}

export function deleteNotification(id: string): void {
  const notifications = getNotifications();
  saveNotifications(notifications.filter((n) => n.id !== id));
}

export function unreadCount(): number {
  return getNotifications().filter((n) => !n.read).length;
}

// ── Browser Push Notifications ────────────────────────────────

export async function requestPushPermission(): Promise<boolean> {
  if (!("Notification" in window)) return false;
  if (Notification.permission === "granted") return true;
  if (Notification.permission === "denied") return false;
  const result = await Notification.requestPermission();
  return result === "granted";
}

function fireBrowserNotification(n: AppNotification): void {
  if (typeof window === "undefined") return;
  if (!("Notification" in window)) return;
  if (Notification.permission !== "granted") return;
  try {
    new Notification(n.title, {
      body: n.body,
      icon: "/icons/icon-192.png",
      badge: "/icons/icon-192.png",
      tag: n.id,
    });
  } catch {}
}

// ── Notification Presets ──────────────────────────────────────

export function notifyGigMatch(venueName: string, area: string): void {
  addNotification({
    type: "gig_match",
    title: `🎯 New gig match — ${venueName}`,
    body: `A new booking opportunity at ${venueName} in ${area} matches your filters.`,
    actionUrl: "/studio/gigradar",
    actionLabel: "View in GigRadar",
  });
}

export function notifyProjectReady(projectName: string): void {
  addNotification({
    type: "project_ready",
    title: `✅ "${projectName}" is ready`,
    body: "Mastering and artwork are complete. Your release is ready to upload.",
    actionUrl: "/studio",
    actionLabel: "Open Studio",
  });
}

export function notifyNewMusic(trackName: string, source: string): void {
  addNotification({
    type: "music_new",
    title: `🎵 New track — ${trackName}`,
    body: `A new track matching your preferences is available on ${source}.`,
    actionUrl: "/studio/library",
    actionLabel: "Open Library",
  });
}

export function notifyBookingUpdate(
  venueName: string,
  newStage: string
): void {
  addNotification({
    type: "booking_update",
    title: `🤝 Booking update — ${venueName}`,
    body: `Your booking with ${venueName} moved to: ${newStage}`,
    actionUrl: "/studio/gigradar",
    actionLabel: "View Booking",
  });
}

// ── Filter Preferences ────────────────────────────────────────

export interface NotificationPrefs {
  gigMatches: boolean;
  projectReady: boolean;
  newMusic: boolean;
  bookingUpdates: boolean;
  gigFilters: {
    tiers: string[];
    areas: string[];
    minPayAed: number;
  };
  musicFilters: {
    genres: string[];
    bpmMin: number;
    bpmMax: number;
  };
}

const PREFS_KEY = "emy-studio-notif-prefs";

export const DEFAULT_PREFS: NotificationPrefs = {
  gigMatches: true,
  projectReady: true,
  newMusic: true,
  bookingUpdates: true,
  gigFilters: {
    tiers: ["superclub", "beach_club", "festival"],
    areas: [],
    minPayAed: 0,
  },
  musicFilters: {
    genres: ["Afro House", "Afro Tech", "Tribal"],
    bpmMin: 120,
    bpmMax: 135,
  },
};

export function getNotifPrefs(): NotificationPrefs {
  try {
    const raw = localStorage.getItem(PREFS_KEY);
    return raw ? { ...DEFAULT_PREFS, ...JSON.parse(raw) } : DEFAULT_PREFS;
  } catch {
    return DEFAULT_PREFS;
  }
}

export function saveNotifPrefs(prefs: NotificationPrefs): void {
  try {
    localStorage.setItem(PREFS_KEY, JSON.stringify(prefs));
  } catch {}
}