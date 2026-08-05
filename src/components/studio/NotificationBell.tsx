"use client";

import { useState, useEffect } from "react";
import {
  getNotifications,
  markAllRead,
  deleteNotification,
  unreadCount,
  type AppNotification,
} from "@/lib/studio/notifications";

export function NotificationBell() {
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [count, setCount] = useState(0);

  const refresh = () => {
    const all = getNotifications();
    setNotifications(all);
    setCount(unreadCount());
  };

  useEffect(() => {
    refresh();
    const interval = setInterval(refresh, 10000);
    return () => clearInterval(interval);
  }, []);

  const handleMarkAllRead = () => {
    markAllRead();
    refresh();
  };

  const handleDelete = (id: string) => {
    deleteNotification(id);
    refresh();
  };

  const TYPE_ICON: Record<string, string> = {
    gig_match: "🎯",
    project_ready: "✅",
    music_new: "🎵",
    booking_update: "🤝",
    system: "🔔",
  };

  return (
    <div className="relative">
      <button
        onClick={() => { setOpen((o) => !o); if (!open) refresh(); }}
        className="relative rounded-lg border border-zinc-700 bg-zinc-900 p-2 text-zinc-300 hover:text-white"
      >
        🔔
        {count > 0 && (
          <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-rose-500 text-[10px] font-bold text-white">
            {count > 9 ? "9+" : count}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-12 z-50 w-80 rounded-2xl border border-zinc-700 bg-zinc-900 shadow-2xl">
          <div className="flex items-center justify-between border-b border-zinc-800 px-4 py-3">
            <h3 className="text-sm font-bold text-white">Notifications</h3>
            <div className="flex gap-2">
              {count > 0 && (
                <button
                  onClick={handleMarkAllRead}
                  className="text-xs text-zinc-400 hover:text-white"
                >
                  Mark all read
                </button>
              )}
              <button
                onClick={() => setOpen(false)}
                className="text-zinc-400 hover:text-white"
              >
                ✕
              </button>
            </div>
          </div>

          <div className="max-h-96 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="px-4 py-8 text-center text-sm text-zinc-500">
                No notifications yet
              </div>
            ) : (
              notifications.map((n) => (
                <div
                  key={n.id}
                  className={`border-b border-zinc-800 px-4 py-3 ${
                    !n.read ? "bg-zinc-800/50" : ""
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-white">
                        {TYPE_ICON[n.type] ?? "🔔"} {n.title}
                      </p>
                      <p className="mt-0.5 text-xs text-zinc-400">{n.body}</p>
                      {n.actionUrl && (
                        <a
                          href={n.actionUrl}
                          className="mt-1 inline-block text-xs text-blue-400 hover:text-blue-300"
                          onClick={() => setOpen(false)}
                        >
                          {n.actionLabel ?? "View →"}
                        </a>
                      )}
                      <p className="mt-1 text-[10px] text-zinc-600">
                        {new Date(n.createdAt).toLocaleTimeString("en-GB", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
                    </div>
                    <button
                      onClick={() => handleDelete(n.id)}
                      className="shrink-0 text-zinc-600 hover:text-zinc-300"
                    >
                      ✕
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}