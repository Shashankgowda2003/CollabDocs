"use client";

import type { AwarenessUser } from "@/lib/collaboration";

interface AvatarsProps {
  users: Map<number, AwarenessUser>;
}

export function ConnectedAvatars({ users }: AvatarsProps) {
  const userArray = Array.from(users.values());
  const display = userArray.slice(0, 4);
  const remaining = userArray.length - 4;

  return (
    <div className="flex items-center -space-x-2">
      {display.map((user, i) => (
        <div
          key={i}
          className="h-7 w-7 rounded-full border-2 border-white flex items-center justify-center text-[10px] font-medium text-white shadow-sm"
          style={{ backgroundColor: user.color }}
          title={user.name}
        >
          {user.name[0].toUpperCase()}
        </div>
      ))}
      {remaining > 0 && (
        <div className="h-7 w-7 rounded-full border-2 border-white bg-zinc-100 flex items-center justify-center text-[10px] font-medium text-zinc-500 shadow-sm">
          +{remaining}
        </div>
      )}
    </div>
  );
}
