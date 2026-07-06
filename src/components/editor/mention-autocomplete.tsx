"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface User { id: string; name: string | null; email: string; }
interface Props { workspaceId: string; onSelect: (email: string) => void; onClose: () => void; searchText: string; }

export function MentionAutocomplete({ workspaceId, onSelect, onClose, searchText }: Props) {
  const [users, setUsers] = useState<User[]>([]);
  const [filtered, setFiltered] = useState<User[]>([]);
  const [selectedIdx, setSelectedIdx] = useState(0);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch(`/api/workspace/${workspaceId}/members`)
      .then((r) => r.json())
      .then((data) => {
        if (data.users) setUsers(data.users);
      })
      .catch(() => {});
  }, [workspaceId]);

  useEffect(() => {
    const q = searchText.toLowerCase();
    setFiltered(users.filter((u) => (u.name?.toLowerCase() || u.email.toLowerCase()).includes(q)));
    setSelectedIdx(0);
  }, [searchText, users]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "ArrowDown") { e.preventDefault(); setSelectedIdx((i) => Math.min(i + 1, filtered.length - 1)); }
      if (e.key === "ArrowUp") { e.preventDefault(); setSelectedIdx((i) => Math.max(i - 1, 0)); }
      if (e.key === "Enter") { e.preventDefault(); if (filtered[selectedIdx]) onSelect(filtered[selectedIdx]!.email); }
      if (e.key === "Escape") { onClose(); }
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [filtered, selectedIdx, onSelect, onClose]);

  useEffect(() => {
    const handler = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) onClose(); };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [onClose]);

  if (filtered.length === 0 && users.length > 0) return null;

  return (
    <motion.div ref={ref} initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }}
      className="absolute z-[70] w-64 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 shadow-xl overflow-hidden">
      {users.length === 0 ? (
        <div className="p-4 text-center text-xs text-zinc-400">Loading members...</div>
      ) : filtered.length === 0 ? (
        <div className="p-4 text-center text-xs text-zinc-400">No matches</div>
      ) : (
        filtered.map((u, i) => (
          <button key={u.id} onClick={() => onSelect(u.email)}
            className={`flex items-center gap-3 w-full px-3 py-2.5 text-sm text-left transition-all ${
              i === selectedIdx ? "bg-blue-50 dark:bg-blue-500/10" : "hover:bg-zinc-50 dark:hover:bg-zinc-800/50"
            }`}>
            <div className="h-7 w-7 rounded-full bg-gradient-to-br from-blue-500/20 to-purple-500/20 flex items-center justify-center text-[10px] font-bold text-blue-500 shrink-0">
              {(u.name || u.email)[0]!.toUpperCase()}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-zinc-800 dark:text-zinc-200 truncate">{u.name || u.email}</p>
              {u.name && <p className="text-[10px] text-zinc-400 truncate">{u.email}</p>}
            </div>
          </button>
        ))
      )}
    </motion.div>
  );
}
