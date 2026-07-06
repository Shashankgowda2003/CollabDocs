"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";

interface SearchHit { id: string; type: string; workspaceId: string; workspaceName: string; title: string; content: string; _formatted?: { title?: string; content?: string }; }

export function SearchBar({ className = "" }: { className?: string }) {
  const [query, setQuery] = useState(""); const [results, setResults] = useState<SearchHit[]>([]);
  const [loading, setLoading] = useState(false); const [open, setOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null); const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) { if (containerRef.current && !containerRef.current.contains(e.target as Node)) setOpen(false); }
    document.addEventListener("mousedown", handleClick); return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  useEffect(() => {
    if (!query.trim()) { setResults([]); setOpen(false); return; }
    const timer = setTimeout(async () => {
      setLoading(true);
      try { const res = await fetch(`/api/search?q=${encodeURIComponent(query)}`); const data = await res.json(); setResults(data.hits || []); setOpen(true); } catch { setResults([]); }
      setLoading(false);
    }, 200);
    return () => clearTimeout(timer);
  }, [query]);

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      <div className="relative">
        <svg className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" /></svg>
        <input ref={inputRef} type="text" value={query} onChange={(e) => setQuery(e.target.value)} onFocus={() => { if (results.length > 0) setOpen(true); }} placeholder="Search..." className="w-full h-9 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-zinc-100 dark:bg-zinc-900 pl-9 pr-4 text-sm text-zinc-900 dark:text-white placeholder:text-zinc-400 dark:placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-transparent transition-all" />
        {loading && <div className="absolute right-3 top-1/2 -translate-y-1/2"><div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-zinc-600 border-t-zinc-300" /></div>}
      </div>
      <AnimatePresence>
        {open && results.length > 0 && (
          <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }} className="absolute top-full mt-1.5 w-[320px] rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-2xl z-50 max-h-80 overflow-y-auto">
            {results.map((hit) => (
              <Link key={hit.id} href={`/${hit.workspaceId}/d/${hit.id}`} onClick={() => { setOpen(false); setQuery(""); }} className="block p-3 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 border-b border-zinc-100 dark:border-zinc-800 last:border-0 transition-all">
                <div className="flex items-center gap-2 mb-0.5"><span className="text-[10px] font-medium text-zinc-400 dark:text-zinc-500 uppercase">{hit.type}</span><span className="text-[10px] text-zinc-400 dark:text-zinc-600">{hit.workspaceName}</span></div>
                <p className="text-sm font-medium text-zinc-900 dark:text-white line-clamp-1" dangerouslySetInnerHTML={{ __html: hit._formatted?.title || hit.title }} />
                {hit.content && <p className="text-xs text-zinc-500 mt-0.5 line-clamp-2" dangerouslySetInnerHTML={{ __html: hit._formatted?.content || hit.content.slice(0, 150) }} />}
              </Link>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
