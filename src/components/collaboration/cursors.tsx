"use client";

import { useEffect, useState, type RefObject } from "react";
import type { AwarenessUser } from "@/lib/collaboration";

interface CursorsProps {
  users: Map<number, AwarenessUser>;
  currentUserName: string;
  containerRef: RefObject<HTMLDivElement | null>;
}

export function CollaborationCursors({
  users,
  currentUserName,
  containerRef,
}: CursorsProps) {
  const [, setTick] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => setTick((t) => t + 1), 100);
    return () => clearInterval(interval);
  }, []);

  return (
    <>
      {Array.from(users.entries())
        .filter(([, u]) => u.name !== currentUserName && u.cursor)
        .map(([clientId, user]) => (
          <div
            key={clientId}
            className="pointer-events-none absolute z-50 transition-all duration-100"
            style={{
              left: user.cursor?.x ?? 0,
              top: user.cursor?.y ?? 0,
            }}
          >
            <svg
              className="h-4 w-4 -rotate-45"
              viewBox="0 0 24 24"
              fill={user.color}
            >
              <path d="M5.5 3.21V20.8l6.38-5.61L16.72 21l1.78-.9-4.84-5.88L19.5 8.6 5.5 3.21z" />
            </svg>
            <span
              className="ml-3 rounded px-1.5 py-0.5 text-[10px] font-medium text-white whitespace-nowrap"
              style={{ backgroundColor: user.color }}
            >
              {user.name}
            </span>
          </div>
        ))}
    </>
  );
}
