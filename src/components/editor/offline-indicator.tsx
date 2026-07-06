"use client";

import { useState, useEffect } from "react";
import { syncPendingOperations, getPendingCount } from "@/lib/offline/sync-engine-v2";

export function OfflineIndicator() {
  const [online, setOnline] = useState(true);
  const [pendingCount, setPendingCount] = useState(0);
  const [syncing, setSyncing] = useState(false);

  useEffect(() => {
    function refreshPending() {
      getPendingCount().then(setPendingCount);
    }

    function handleOnline() {
      setOnline(true);
      setSyncing(true);
      syncPendingOperations().then(() => {
        refreshPending();
        setSyncing(false);
      });
    }

    function handleOffline() {
      setOnline(false);
    }

    setOnline(navigator.onLine);
    refreshPending();
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  if (online && pendingCount === 0 && !syncing) return null;

  return (
    <div
      className={`fixed bottom-4 right-4 z-50 rounded-xl px-4 py-2 text-xs font-medium shadow-lg transition-all flex items-center gap-2 ${
        !online
          ? "bg-zinc-900 dark:bg-zinc-800 text-white border border-zinc-800 animate-pulse"
          : syncing
          ? "bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 text-amber-700 dark:text-amber-400"
          : "bg-green-50 dark:bg-green-500/10 border border-green-200 dark:border-green-500/20 text-green-700 dark:text-green-400"
      }`}
    >
      {!online ? (
        <>
          <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
          </svg>
          Offline &mdash; changes saved locally
        </>
      ) : syncing ? (
        <>
          <svg className="h-3.5 w-3.5 animate-spin" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" />
          </svg>
          Syncing {pendingCount} change{pendingCount !== 1 ? "s" : ""}...
        </>
      ) : (
        <>
          <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          Synced {pendingCount} change{pendingCount !== 1 ? "s" : ""}
        </>
      )}
    </div>
  );
}
