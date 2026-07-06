"use client";

import { useState } from "react";

interface ButtonBlockProps {
  content: string;
  blockId: string;
}

export function ButtonBlock({ content, blockId }: ButtonBlockProps) {
  let label = "Click me";
  let variant: "primary" | "secondary" | "danger" | "outline" = "primary";
  let action = "";
  try {
    const p = JSON.parse(content);
    label = p.label || label;
    variant = p.variant || variant;
    action = p.action || action;
  } catch {
    label = content || label;
  }

  const [clicked, setClicked] = useState(false);

  const variants: Record<string, string> = {
    primary: "bg-blue-500 hover:bg-blue-600 text-white",
    secondary: "bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300",
    danger: "bg-red-500 hover:bg-red-600 text-white",
    outline: "border border-zinc-300 dark:border-zinc-600 hover:bg-zinc-50 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300",
  };

  async function handleClick() {
    setClicked(true);
    setTimeout(() => setClicked(false), 2000);
    if (action) {
      try {
        const parsed = JSON.parse(action);
        if (parsed.webhook) {
          await fetch(parsed.webhook, { method: "POST", body: JSON.stringify({ blockId, timestamp: Date.now() }) });
        }
      } catch {
        if (action.startsWith("http")) {
          await fetch(action, { method: "POST", body: JSON.stringify({ blockId, timestamp: Date.now() }) });
        }
      }
    }
  }

  return (
    <div className="flex justify-center py-2">
      <button
        onClick={handleClick}
        className={`rounded-xl px-6 py-2.5 text-sm font-semibold transition-all ${variants[variant]} ${
          clicked ? "scale-95 opacity-80" : ""
        }`}
      >
        {clicked ? "Done!" : label}
      </button>
    </div>
  );
}
