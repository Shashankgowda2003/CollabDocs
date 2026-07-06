"use client";

import type { DatabaseData } from "./database-types";
import { getCellValue } from "./database-types";

interface Props {
  data: DatabaseData;
  onChange: (data: DatabaseData) => void;
}

export function DatabaseGalleryView({ data, onChange }: Props) {
  const { schema, rows } = data;
  const titleCol = schema[0];
  const mediaCol = schema.find((c) => c.type === "text");
  const statusCol = schema.find((c) => c.type === "select");

  return (
    <div className="p-3">
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        {rows.map((row) => (
          <div
            key={row.id}
            className="rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-950 overflow-hidden hover:shadow-lg transition-shadow group"
          >
            <div className="aspect-video bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center">
              {mediaCol && getCellValue(row, mediaCol.id) ? (
                <img
                  src={String(getCellValue(row, mediaCol.id))}
                  alt=""
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = "none";
                  }}
                />
              ) : (
                <svg className="h-10 w-10 text-zinc-300 dark:text-zinc-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909M3.75 21h16.5A2.25 2.25 0 0022.5 18.75V5.25A2.25 2.25 0 0020.25 3H3.75A2.25 2.25 0 001.5 5.25v13.5A2.25 2.25 0 003.75 21z" />
                </svg>
              )}
            </div>
            <div className="p-3">
              {titleCol && (
                <p className="text-sm font-medium text-zinc-800 dark:text-zinc-200 truncate">
                  {String(getCellValue(row, titleCol.id, "Untitled"))}
                </p>
              )}
              {statusCol && (
                <span className="inline-block mt-1.5 text-[10px] font-medium px-2 py-0.5 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-500">
                  {String(getCellValue(row, statusCol.id, ""))}
                </span>
              )}
            </div>
          </div>
        ))}
      </div>
      {rows.length === 0 && (
        <div className="text-center py-10">
          <svg className="h-10 w-10 mx-auto text-zinc-300 dark:text-zinc-600 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909M3.75 21h16.5A2.25 2.25 0 0022.5 18.75V5.25A2.25 2.25 0 0020.25 3H3.75A2.25 2.25 0 001.5 5.25v13.5A2.25 2.25 0 003.75 21z" />
          </svg>
          <p className="text-xs text-zinc-400">No items to display</p>
        </div>
      )}
    </div>
  );
}
