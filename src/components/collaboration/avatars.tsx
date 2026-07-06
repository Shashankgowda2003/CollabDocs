"use client";

import type { AwarenessUser } from "@/lib/collaboration";

interface AvatarsProps {
  users: Map<number, AwarenessUser>;
}

export function ConnectedAvatars({ users }: AvatarsProps) {
  const userArray = Array.from(users.values());
  const display = userArray.slice(0, 4);
  const remaining = userArray.length - 4;
  const anyInCall = userArray.some((u) => u.callStatus === "in-call");

  return (
    <div className="flex items-center gap-1.5">
      <div className="flex items-center -space-x-2">
        {display.map((user, i) => (
          <div key={i} className="relative" title={user.name + (user.callStatus === "in-call" ? " (in call)" : "")}>
            <div
              className="h-7 w-7 rounded-full border-2 border-white flex items-center justify-center text-[10px] font-medium text-white shadow-sm"
              style={{ backgroundColor: user.color }}
            >
              {user.name[0].toUpperCase()}
            </div>
            {user.callStatus === "in-call" && (
              <span className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full bg-green-500 border-2 border-white flex items-center justify-center">
                <svg className="h-1.5 w-1.5 text-white" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3z" />
                </svg>
              </span>
            )}
          </div>
        ))}
        {remaining > 0 && (
          <div className="h-7 w-7 rounded-full border-2 border-white bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-[10px] font-medium text-zinc-500 shadow-sm">
            +{remaining}
          </div>
        )}
      </div>
      {anyInCall && (
        <span className="text-[10px] text-green-600 dark:text-green-400 font-medium">Live</span>
      )}
    </div>
  );
}
