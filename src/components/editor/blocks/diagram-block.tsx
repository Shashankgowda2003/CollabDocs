"use client";

import { useEffect, useRef, useState } from "react";

interface DiagramBlockProps {
  content: string;
  onChange: (content: string) => void;
  onKeyDown: (e: React.KeyboardEvent) => void;
}

export function DiagramBlock({ content, onChange, onKeyDown }: DiagramBlockProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [error, setError] = useState<string | null>(null);

  let diagramDef = content;
  try {
    const parsed = JSON.parse(content);
    diagramDef = parsed.diagram || content;
  } catch {
    diagramDef = content;
  }

  useEffect(() => {
    if (!containerRef.current || !diagramDef.trim()) {
      setError(null);
      containerRef.current!.innerHTML = '<p class="text-xs text-zinc-400 p-4 text-center">Enter diagram code below</p>';
      return;
    }

    let cancelled = false;

    async function render() {
      try {
        const mermaid = (await import("mermaid")).default;
        mermaid.initialize({ startOnLoad: false, theme: "default" });
        const id = `mermaid-${Math.random().toString(36).slice(2)}`;
        const { svg } = await mermaid.render(id, diagramDef);
        if (!cancelled && containerRef.current) {
          containerRef.current.innerHTML = svg;
          setError(null);
        }
      } catch {
        if (!cancelled && containerRef.current) {
          setError("Invalid diagram syntax");
        }
      }
    }

    render();
    return () => { cancelled = true; };
  }, [diagramDef]);

  return (
    <div className="rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-950 overflow-hidden">
      <div className="flex items-center gap-2 px-4 py-2 border-b border-zinc-100 dark:border-zinc-800">
        <span className="text-[10px] font-mono text-zinc-400 bg-zinc-100 dark:bg-zinc-800 px-1.5 py-0.5 rounded">
          Mermaid
        </span>
        <span className="text-[10px] text-zinc-500">flowchart, sequence, class, state, gantt, pie, er</span>
        {error && <span className="text-[10px] text-red-400 ml-auto">{error}</span>}
      </div>
      <div
        ref={containerRef}
        className="p-4 flex justify-center overflow-x-auto bg-white dark:bg-zinc-950 min-h-[80px]"
      />
      <textarea
        className="w-full bg-zinc-50 dark:bg-zinc-900 border-t border-zinc-100 dark:border-zinc-800 p-4 text-sm font-mono text-zinc-700 dark:text-zinc-300 outline-none resize-y placeholder:text-zinc-400"
        value={diagramDef}
        onChange={(e) => onChange(JSON.stringify({ diagram: e.target.value }))}
        onKeyDown={(e) => {
          if (e.key === "Escape") (e.target as HTMLElement).blur();
          onKeyDown(e);
        }}
        placeholder={`graph TD\n  A[Start] --> B[End]`}
        rows={6}
      />
    </div>
  );
}
