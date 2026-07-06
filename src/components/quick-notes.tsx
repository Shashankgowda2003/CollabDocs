"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { createDocument } from "@/server/actions/document";
import { useRouter } from "next/navigation";

const EMOJI_OPTIONS = ["📝", "📋", "💡", "🎯", "🔥", "⭐", "🚀", "💬", "📊", "📅", "✅", "❤️", "🎨", "🔧", "📌"];

interface QuickNotesProps {
  workspaceId: string;
}

export function QuickNotes({ workspaceId }: QuickNotesProps) {
  const [notes, setNotes] = useState<string[]>([]);
  const [input, setInput] = useState("");
  const router = useRouter();

  useEffect(() => {
    const saved = localStorage.getItem(`quick-notes-${workspaceId}`);
    if (saved) setNotes(JSON.parse(saved));
  }, [workspaceId]);

  function addNote() {
    if (!input.trim()) return;
    const updated = [input.trim(), ...notes];
    setNotes(updated);
    localStorage.setItem(`quick-notes-${workspaceId}`, JSON.stringify(updated));
    setInput("");
  }

  function removeNote(idx: number) {
    const updated = notes.filter((_, i) => i !== idx);
    setNotes(updated);
    localStorage.setItem(`quick-notes-${workspaceId}`, JSON.stringify(updated));
  }

  async function createDocFromNote(note: string) {
    const fd = new FormData();
    fd.set("title", note);
    await createDocument(workspaceId, null, fd);
    router.refresh();
  }

  return (
    <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/50 p-4">
      <div className="flex items-center gap-2 mb-3">
        <span className="text-lg">📝</span>
        <h3 className="text-sm font-semibold text-zinc-800 dark:text-zinc-200">Quick Notes</h3>
        <span className="text-[10px] text-zinc-400 ml-auto">{notes.length}</span>
      </div>

      <div className="flex items-center gap-2 mb-3">
        <input
          className="flex-1 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-900 px-3 py-2 text-sm text-zinc-700 dark:text-zinc-300 outline-none placeholder:text-zinc-400"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") addNote(); }}
          placeholder="Write a quick note..."
        />
        <button
          onClick={addNote}
          className="rounded-xl bg-blue-500 hover:bg-blue-600 px-3 py-2 text-xs font-semibold text-white transition-all"
        >
          Add
        </button>
      </div>

      <div className="space-y-1.5 max-h-48 overflow-y-auto">
        <AnimatePresence>
          {notes.map((note, i) => (
            <motion.div
              key={`${note}-${i}`}
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="group flex items-center gap-2 rounded-lg border border-zinc-100 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50 px-3 py-2 hover:border-zinc-200 dark:hover:border-zinc-700 transition-all"
            >
              <span className="text-sm">{EMOJI_OPTIONS[i % EMOJI_OPTIONS.length]}</span>
              <p className="flex-1 text-xs text-zinc-600 dark:text-zinc-400 line-clamp-2">{note}</p>
              <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  onClick={() => createDocFromNote(note)}
                  className="rounded p-1 text-zinc-400 hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-500/10"
                  title="Create document"
                >
                  <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m3.75 9v6m3-3H9m1.5-12H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                  </svg>
                </button>
                <button
                  onClick={() => removeNote(i)}
                  className="rounded p-1 text-zinc-400 hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10"
                  title="Delete"
                >
                  <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}
