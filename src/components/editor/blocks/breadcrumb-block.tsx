"use client";

import { useEffect } from "react";

interface BreadcrumbBlockProps {
  content: string;
  onChange: (content: string) => void;
}

export function BreadcrumbBlock({ content, onChange }: BreadcrumbBlockProps) {
  let path: { label: string; href?: string }[] = [];
  try {
    const parsed = JSON.parse(content || "[]");
    if (Array.isArray(parsed)) path = parsed;
  } catch {
    path = [];
  }

  useEffect(() => {
    if (path.length === 0) {
      onChange(JSON.stringify([{ label: "Home" }, { label: "Documents" }]));
    }
  }, []);

  function updateSegment(idx: number, field: "label" | "href", value: string) {
    const next = path.map((s, i) => (i === idx ? { ...s, [field]: value } : s));
    onChange(JSON.stringify(next));
  }

  function addSegment() {
    onChange(JSON.stringify([...path, { label: "New" }]));
  }

  function removeSegment(idx: number) {
    if (path.length <= 1) return;
    onChange(JSON.stringify(path.filter((_, i) => i !== idx)));
  }

  return (
    <nav className="flex items-center gap-1.5 text-sm flex-wrap">
      {path.map((crumb, i) => (
        <span key={i} className="flex items-center gap-1.5 group/bc">
          {i > 0 && (
            <svg className="h-3 w-3 text-zinc-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
            </svg>
          )}
          <div className="flex items-center gap-1">
            <input
              className="bg-transparent outline-none text-sm font-medium text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded px-1 py-0.5 w-auto min-w-[60px] transition-colors"
              value={crumb.label}
              onChange={(e) => updateSegment(i, "label", e.target.value)}
              placeholder="Label"
              size={crumb.label.length || 8}
            />
            <input
              className="bg-transparent outline-none text-xs text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded px-1 py-0.5 w-auto min-w-[80px] hidden group-hover/bc:inline-block transition-colors"
              value={crumb.href ?? ""}
              onChange={(e) => updateSegment(i, "href", e.target.value)}
              placeholder="URL (optional)"
              size={(crumb.href?.length || 12)}
            />
            <button
              onClick={() => removeSegment(i)}
              className="opacity-0 group-hover/bc:opacity-100 text-[10px] text-zinc-400 hover:text-red-400 px-0.5 hidden group-hover/bc:inline-block"
            >
              ×
            </button>
          </div>
        </span>
      ))}
      <button
        onClick={addSegment}
        className="rounded-full h-5 w-5 border border-dashed border-zinc-300 dark:border-zinc-600 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 hover:border-zinc-400 dark:hover:border-zinc-500 flex items-center justify-center text-xs"
        title="Add segment"
      >
        +
      </button>
    </nav>
  );
}
