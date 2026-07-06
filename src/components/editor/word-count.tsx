"use client";

import { useMemo } from "react";

interface Block { content: string; }
interface Props { blocks: Block[]; }

export function WordCount({ blocks }: Props) {
  const stats = useMemo(() => {
    const text = blocks.map((b) => b.content).join(" ");
    const words = text.trim() ? text.trim().split(/\s+/).length : 0;
    const chars = text.length;
    const lines = blocks.length;
    return { words, chars, lines };
  }, [blocks]);

  return (
    <span className="text-[10px] text-zinc-400 dark:text-zinc-600 font-mono">
      {stats.words} words &middot; {stats.chars} chars &middot; {stats.lines} blocks
    </span>
  );
}
