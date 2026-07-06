"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { toggleFavorite, getFavorites } from "@/server/actions/favorites";

interface FavoritesListProps {
  workspaceId: string;
}

export function FavoritesList({ workspaceId }: FavoritesListProps) {
  const [favorites, setFavorites] = useState<{ id: string; title: string }[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getFavorites().then((docs) => {
      setFavorites(docs.map((d) => ({ id: d.id, title: d.title })));
      setLoading(false);
    });
  }, []);

  if (loading || favorites.length === 0) return null;

  return (
    <div className="p-3 border-t border-zinc-200 dark:border-zinc-800">
      <p className="px-3 text-[10px] font-semibold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider mb-1">
        Favorites
      </p>
      <div className="space-y-0.5">
        <AnimatePresence>
          {favorites.slice(0, 5).map((doc) => (
            <motion.a
              key={doc.id}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              href={`/${workspaceId}/d/${doc.id}`}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-all"
            >
              <svg className="h-3 w-3 shrink-0 text-yellow-500" fill="currentColor" viewBox="0 0 24 24">
                <path d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" />
              </svg>
              <span className="truncate">{doc.title}</span>
            </motion.a>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}
