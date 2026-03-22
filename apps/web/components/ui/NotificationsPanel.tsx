"use client";

import { useEffect, useRef, useState } from "react";
import { Bell, CheckCircle, AlertTriangle, FileText, X } from "lucide-react";
import { cn } from "@/app/lib/utils";
import Link from "next/link";

interface Notification {
  id: string;
  type: "success" | "warning" | "info";
  title: string;
  message: string;
  time: string;
  read: boolean;
  href?: string;
}

const DISMISSED_KEY = "lt_notifications_dismissed";
const WELCOME_SHOWN_KEY = "lt_welcome_shown";

function getDismissed(): string[] {
  try { return JSON.parse(localStorage.getItem(DISMISSED_KEY) ?? "[]"); } catch { return []; }
}
function saveDismissed(ids: string[]) {
  try { localStorage.setItem(DISMISSED_KEY, JSON.stringify(ids)); } catch {}
}

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60_000);
  if (mins < 1) return "ahora";
  if (mins < 60) return `hace ${mins}m`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `hace ${hrs}h`;
  const days = Math.floor(hrs / 24);
  return days === 1 ? "ayer" : `hace ${days}d`;
}

export function NotificationsPanel() {
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const panelRef = useRef<HTMLDivElement>(null);

  const unreadCount = notifications.filter((n) => !n.read).length;

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(false); };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, []);

  // Load real notifications from API
  useEffect(() => {
    async function load() {
      try {
        const dismissed = getDismissed();
        const built: Notification[] = [];

        // Welcome — only once
        const welcomeShown = localStorage.getItem(WELCOME_SHOWN_KEY);
        if (!welcomeShown) {
          built.push({
            id: "welcome",
            type: "success",
            title: "Bienvenido a Doculex",
            message: "Tu cuenta está lista. Creá tu primer documento desde el botón 'Nuevo Documento'.",
            time: "ahora",
            read: false,
          });
          localStorage.setItem(WELCOME_SHOWN_KEY, "1");
        }

        // Fetch documents needing review
        const { listDocuments } = await import("@/app/lib/webApi");
        const res = await listDocuments({ pageSize: 10, sort: "createdAt:desc" });
        const docs = res.documents ?? [];

        for (const doc of docs) {
          const status = doc.lastVersion?.status;
          if (status === "needs_review") {
            built.push({
              id: `review_${doc.id}`,
              type: "warning",
              title: "Documento requiere revisión",
              message: `${doc.type ?? "Documento"} en ${doc.jurisdiccion ?? "sin jurisdicción"} tiene contenido incompleto.`,
              time: timeAgo(doc.createdAt),
              read: false,
              href: `/documents/${doc.id}`,
            });
          }
        }

        // Recent docs created (last 24h, generated status)
        const recent24h = docs.filter((d) => {
          const diff = Date.now() - new Date(d.createdAt).getTime();
          return diff < 86_400_000 && d.lastVersion?.status === "generated";
        });

        for (const doc of recent24h.slice(0, 3)) {
          built.push({
            id: `created_${doc.id}`,
            type: "info",
            title: "Documento generado",
            message: `${doc.type ?? "Documento"} · ${doc.jurisdiccion ?? "sin jurisdicción"}`,
            time: timeAgo(doc.createdAt),
            read: true,
            href: `/documents/${doc.id}`,
          });
        }

        // Filter dismissed
        setNotifications(built.filter((n) => !dismissed.includes(n.id)));
      } catch {
        // fallback — no notifications on error
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const markAllRead = () =>
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));

  const dismiss = (id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
    const dismissed = getDismissed();
    saveDismissed([...dismissed, id]);
  };

  const iconMap = {
    success: CheckCircle,
    warning: AlertTriangle,
    info: FileText,
  };
  const colorMap = {
    success: "text-emerald-500",
    warning: "text-amber-500",
    info: "text-blue-500",
  };

  return (
    <div ref={panelRef} className="relative">
      {/* Bell button */}
      <button
        onClick={() => setOpen((v) => !v)}
        className={cn(
          "p-2 rounded-lg relative transition-colors",
          open
            ? "bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white"
            : "text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
        )}
        aria-label="Notificaciones"
        aria-expanded={open}
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute top-1.5 right-1.5 size-2 bg-red-500 rounded-full border-2 border-white dark:border-slate-900" />
        )}
      </button>

      {/* Dropdown */}
      {open && (
        <div className="absolute right-0 top-full mt-2 w-80 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-150">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-sm text-slate-900 dark:text-white">Notificaciones</h3>
              {unreadCount > 0 && (
                <span className="inline-flex items-center justify-center px-1.5 py-0.5 bg-primary text-white text-[10px] font-bold rounded-full leading-none">
                  {unreadCount}
                </span>
              )}
            </div>
            {unreadCount > 0 && (
              <button onClick={markAllRead} className="text-xs text-primary font-semibold hover:underline">
                Marcar leídas
              </button>
            )}
          </div>

          {/* Items */}
          <div className="max-h-72 overflow-y-auto divide-y divide-slate-50 dark:divide-slate-800/60">
            {loading ? (
              <div className="px-4 py-8 flex justify-center">
                <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
              </div>
            ) : notifications.length === 0 ? (
              <div className="px-4 py-10 text-center">
                <Bell className="w-8 h-8 text-slate-200 dark:text-slate-700 mx-auto mb-2" />
                <p className="text-sm text-slate-400 dark:text-slate-500">No hay notificaciones</p>
              </div>
            ) : (
              notifications.map((n) => {
                const Icon = iconMap[n.type];
                const content = (
                  <div
                    className={cn(
                      "flex items-start gap-3 px-4 py-3 transition-colors",
                      !n.read
                        ? "bg-primary/[0.03] dark:bg-primary/5"
                        : "hover:bg-slate-50 dark:hover:bg-slate-800/40"
                    )}
                  >
                    <Icon className={cn("w-4 h-4 flex-shrink-0 mt-0.5", colorMap[n.type])} />
                    <div className="flex-1 min-w-0">
                      <p className={cn("text-sm font-semibold leading-snug", !n.read ? "text-slate-900 dark:text-white" : "text-slate-600 dark:text-slate-400")}>
                        {n.title}
                      </p>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 leading-snug">{n.message}</p>
                      <p className="text-[10px] text-slate-400 dark:text-slate-600 mt-1">{n.time}</p>
                    </div>
                    <button
                      onClick={(e) => { e.preventDefault(); e.stopPropagation(); dismiss(n.id); }}
                      className="flex-shrink-0 p-1 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-300 hover:text-slate-500 transition-colors mt-0.5"
                      aria-label="Descartar"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                );

                return n.href ? (
                  <Link key={n.id} href={n.href} onClick={() => setOpen(false)}>
                    {content}
                  </Link>
                ) : (
                  <div key={n.id}>{content}</div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
