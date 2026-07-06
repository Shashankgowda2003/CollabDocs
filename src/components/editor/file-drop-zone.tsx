"use client";

import { useState, useCallback, type DragEvent } from "react";

interface Props {
  onFilesDropped: (files: File[]) => void;
  children: React.ReactNode;
  documentId: string;
}

export function FileDropZone({ onFilesDropped, children }: Props) {
  const [isDragging, setIsDragging] = useState(false);
  const [dragCounter, setDragCounter] = useState(0);

  const handleDragEnter = useCallback((e: DragEvent) => {
    e.preventDefault(); e.stopPropagation();
    setDragCounter((c) => c + 1);
    if (e.dataTransfer.items && e.dataTransfer.items.length > 0) setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: DragEvent) => {
    e.preventDefault(); e.stopPropagation();
    setDragCounter((c) => c - 1);
    if (dragCounter - 1 === 0) setIsDragging(false);
  }, [dragCounter]);

  const handleDragOver = useCallback((e: DragEvent) => {
    e.preventDefault(); e.stopPropagation();
  }, []);

  const handleDrop = useCallback((e: DragEvent) => {
    e.preventDefault(); e.stopPropagation();
    setIsDragging(false); setDragCounter(0);

    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) onFilesDropped(files);
  }, [onFilesDropped]);

  const handlePaste = useCallback((e: React.ClipboardEvent) => {
    const items = e.clipboardData?.items;
    if (!items) return;

    const files: File[] = [];
    for (let i = 0; i < items.length; i++) {
      const file = items[i]!.getAsFile();
      if (file) files.push(file);
    }
    if (files.length > 0) {
      e.preventDefault();
      onFilesDropped(files);
    }
  }, [onFilesDropped]);

  return (
    <div
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
      onPaste={handlePaste}
      className="relative"
    >
      {children}
      {isDragging && (
        <div className="fixed inset-0 z-50 bg-blue-500/10 border-2 border-dashed border-blue-500/50 flex items-center justify-center pointer-events-none">
          <div className="rounded-2xl bg-zinc-900 border border-zinc-700 px-8 py-6 shadow-2xl text-center">
            <svg className="h-8 w-8 text-blue-400 mx-auto mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
            </svg>
            <p className="text-sm font-medium text-white">Drop files to upload</p>
            <p className="text-xs text-zinc-500 mt-1">Images, videos, documents</p>
          </div>
        </div>
      )}
    </div>
  );
}
