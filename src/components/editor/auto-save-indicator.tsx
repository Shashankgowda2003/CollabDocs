"use client";

import { useState, useEffect } from "react";

export function AutoSaveIndicator({ lastSaved }: { lastSaved: Date | null }) {
  const [status, setStatus] = useState<"saved" | "saving" | "unsaved">("saved");
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (!lastSaved) return;
    setStatus("saving");
    setShow(true);
    const t = setTimeout(() => { setStatus("saved"); }, 600);
    const h = setTimeout(() => setShow(false), 3000);
    return () => { clearTimeout(t); clearTimeout(h); };
  }, [lastSaved]);

  if (!show) return null;

  return (
    <span className={`text-[10px] font-medium transition-all duration-300 ${
      status === "saved" ? "text-green-400" : status === "saving" ? "text-zinc-400" : "text-amber-400"
    }`}>
      {status === "saved" ? "Saved" : status === "saving" ? "Saving..." : "Unsaved changes"}
    </span>
  );
}
