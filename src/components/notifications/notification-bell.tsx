"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { getNotifications, markAsRead, markAllAsRead, getUnreadCount } from "@/server/actions/notifications";

interface Notification { id: string; type: string; title: string; body: string; read: boolean; workspaceId: string | null; documentId: string | null; createdAt: Date; }
const TYPE_ICONS: Record<string, string> = { mention: "@", comment: "\uD83D\uDCAC", reply: "\u2192", share: "\uD83D\uDD17", permission_change: "\uD83D\uDD12", document_restore: "\uD83D\uDD04", ai_complete: "\u2728", workspace_invite: "\uD83C\uDFE2" };

export function NotificationBell() {
  const [notifications, setNotifications] = useState<Notification[]>([]); const [count, setCount] = useState(0);
  const [open, setOpen] = useState(false); const router = useRouter();

  const load = useCallback(async () => { const [n, c] = await Promise.all([getNotifications(), getUnreadCount()]); setNotifications(n); setCount(c); }, []);
  useEffect(() => { load(); const i = setInterval(load, 30000); return () => clearInterval(i); }, [load]);

  async function handleClick(n: Notification) {
    if (!n.read) { await markAsRead(n.id); setCount((c) => Math.max(0, c - 1)); setNotifications((p) => p.map((x) => x.id === n.id ? { ...x, read: true } : x)); }
    setOpen(false); if (n.documentId && n.workspaceId) router.push(`/${n.workspaceId}/d/${n.documentId}`);
  }
  async function handleMarkAll() { await markAllAsRead(); setCount(0); setNotifications((p) => p.map((n) => ({ ...n, read: true }))); }

  return (
    <div className="relative">
      <button onClick={() => setOpen(!open)} className="relative rounded-xl p-2 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 transition-all">
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" /></svg>
        {count > 0 && <span className="absolute -top-0.5 -right-0.5 h-4 min-w-[16px] rounded-full bg-red-500 flex items-center justify-center text-[9px] font-bold text-white px-1">{count > 99 ? "99+" : count}</span>}
      </button>
      <AnimatePresence>
        {open && (
          <>
            <div className="fixed inset-0 z-30" onClick={() => setOpen(false)} />
            <motion.div initial={{ opacity: 0, y: -4, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: -4, scale: 0.95 }} className="absolute right-0 top-full mt-2 w-80 rounded-2xl border border-zinc-800 bg-zinc-900 shadow-2xl z-40 max-h-96 flex flex-col">
              <div className="flex items-center justify-between p-3 border-b border-zinc-800"><h3 className="text-xs font-semibold text-white">Notifications</h3>{count > 0 && <button onClick={handleMarkAll} className="text-[10px] text-zinc-500 hover:text-zinc-300">Mark all read</button>}</div>
              <div className="flex-1 overflow-y-auto">
                {notifications.length === 0 ? (
                  <div className="p-8 text-center"><div className="h-10 w-10 rounded-full bg-zinc-800 flex items-center justify-center mx-auto mb-3"><svg className="h-5 w-5 text-zinc-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" /></svg></div><p className="text-sm text-zinc-500">No notifications</p></div>
                ) : notifications.map((n) => (
                  <button key={n.id} onClick={() => handleClick(n)} className={`w-full text-left p-3 hover:bg-zinc-800/50 border-b border-zinc-800/50 transition-all ${!n.read ? "bg-blue-500/5" : ""}`}>
                    <div className="flex gap-2"><span className="text-sm shrink-0">{TYPE_ICONS[n.type] || "\u2022"}</span>
                      <div className="min-w-0 flex-1"><p className="text-xs font-medium text-white line-clamp-1">{n.title}</p><p className="text-xs text-zinc-500 mt-0.5 line-clamp-2">{n.body}</p><p className="text-[10px] text-zinc-600 mt-1">{new Date(n.createdAt).toLocaleString()}</p></div>
                      {!n.read && <div className="h-2 w-2 rounded-full bg-blue-500 shrink-0 mt-1.5" />}
                    </div>
                  </button>
                ))}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
