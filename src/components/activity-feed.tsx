"use client";

import { useState, useEffect } from "react";
import { getActivityFeed } from "@/server/actions/activity";

interface Activity { id: string; action: string; resource: string; title: string; createdAt: Date; user: { id: string; name: string | null; image: string | null }; }

const ACTION_LABELS: Record<string, string> = {
  created: "created", edited: "edited", deleted: "deleted", commented: "commented on",
  restored: "restored", shared: "shared", published: "published",
};

export function ActivityFeed({ workspaceId }: { workspaceId: string }) {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getActivityFeed(workspaceId).then((a) => { setActivities(a); setLoading(false); });
  }, [workspaceId]);

  if (loading) return <div className="py-8 text-center"><div className="mx-auto h-5 w-5 animate-spin rounded-full border-2 border-zinc-300 border-t-zinc-600" /></div>;
  if (activities.length === 0) return null;

  return (
    <div className="mt-8">
      <h3 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-3">Recent Activity</h3>
      <div className="space-y-1">
        {activities.slice(0, 10).map((a) => (
          <div key={a.id} className="flex items-center gap-3 py-2 px-3 rounded-lg hover:bg-zinc-50 dark:hover:bg-zinc-900/50 transition-all text-sm">
            <div className="h-6 w-6 rounded-full bg-zinc-200 dark:bg-zinc-800 flex items-center justify-center text-[9px] font-bold text-zinc-500 shrink-0">
              {(a.user.name || "?")[0]!.toUpperCase()}
            </div>
            <span className="text-zinc-600 dark:text-zinc-400">
              <span className="font-medium text-zinc-800 dark:text-zinc-200">{a.user.name || "Someone"}</span>{" "}
              {ACTION_LABELS[a.action] || a.action}{" "}
              <span className="font-medium text-zinc-700 dark:text-zinc-300">{a.title}</span>
            </span>
            <span className="text-[10px] text-zinc-400 ml-auto shrink-0">
              {new Date(a.createdAt).toLocaleDateString()}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
