"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import type { Editor } from "@tiptap/react";
import { createPortal } from "react-dom";

interface Props { editor: Editor; }

const COLORS = [
  "#ef4444", "#f97316", "#eab308", "#22c55e", "#06b6d4",
  "#3b82f6", "#8b5cf6", "#ec4899", "#78716c", "#000000",
];

const HIGHLIGHTS = [
  "#fef2f2", "#fff7ed", "#fefce8", "#f0fdf4", "#ecfeff",
  "#eff6ff", "#f5f3ff", "#fdf2f8", "#fafafa", "#fef08a",
];

export function FormattingToolbar({ editor }: Props) {
  const [visible, setVisible] = useState(false);
  const [position, setPosition] = useState({ top: 0, left: 0 });
  const [linkInput, setLinkInput] = useState(false);
  const [linkUrl, setLinkUrl] = useState("");
  const toolbarRef = useRef<HTMLDivElement>(null);
  const rafRef = useRef<number>(0);

  const updatePosition = useCallback(() => {
    const { from, to, empty } = editor.state.selection;
    if (empty || from === to) {
      setVisible(false);
      return;
    }

    const { view } = editor;
    const start = view.coordsAtPos(from);
    const end = view.coordsAtPos(to);

    const top = Math.min(start.top, end.top) - 48;
    const left = (start.left + end.right) / 2;

    if (top < 0 || left < 0) {
      setVisible(false);
      return;
    }

    setPosition({ top, left });
    setVisible(true);
  }, [editor]);

  useEffect(() => {
    const handleSelectionChange = () => {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = requestAnimationFrame(updatePosition);
    };

    editor.on("selectionUpdate", handleSelectionChange);
    editor.on("blur", () => {
      setTimeout(() => {
        if (!toolbarRef.current?.contains(document.activeElement)) {
          setVisible(false);
          setLinkInput(false);
        }
      }, 200);
    });

    return () => {
      editor.off("selectionUpdate", handleSelectionChange);
      cancelAnimationFrame(rafRef.current);
    };
  }, [editor, updatePosition]);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (toolbarRef.current && !toolbarRef.current.contains(e.target as Node)) {
        setVisible(false);
        setLinkInput(false);
      }
    };
    if (visible) {
      document.addEventListener("mousedown", handleClick);
      return () => document.removeEventListener("mousedown", handleClick);
    }
  }, [visible]);

  const setLink = useCallback(() => {
    if (!linkUrl) {
      editor.chain().focus().extendMarkRange("link").unsetLink().run();
    } else {
      const url = linkUrl.startsWith("http") ? linkUrl : `https://${linkUrl}`;
      editor.chain().focus().extendMarkRange("link").setLink({ href: url }).run();
    }
    setLinkInput(false);
    setLinkUrl("");
  }, [editor, linkUrl]);

  const openLinkInput = useCallback(() => {
    const prev = editor.getAttributes("link").href || "";
    setLinkUrl(prev);
    setLinkInput(true);
  }, [editor]);

  const closeLinkInput = useCallback(() => {
    setLinkInput(false);
    setLinkUrl("");
  }, []);

  if (!visible) return null;

  const toolbar = (
    <div
      ref={toolbarRef}
      style={{
        position: "fixed",
        top: position.top,
        left: position.left,
        transform: "translateX(-50%)",
        zIndex: 100,
      }}
      className="flex items-center gap-0.5 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 p-1 shadow-xl dark:shadow-2xl dark:shadow-black/30"
    >
      {linkInput ? (
        <div className="flex items-center gap-1 px-1">
          <input
            value={linkUrl}
            onChange={(e) => setLinkUrl(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") setLink(); if (e.key === "Escape") closeLinkInput(); }}
            placeholder="Paste link..."
            autoFocus
            className="h-7 w-40 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 px-2 text-xs text-zinc-700 dark:text-zinc-300 outline-none placeholder:text-zinc-400"
          />
          <button onClick={setLink} className="h-7 rounded-lg px-2 text-xs font-medium text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-500/10 transition-colors">Apply</button>
          <button onClick={closeLinkInput} className="h-7 w-7 rounded-lg flex items-center justify-center text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors">
            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>
      ) : (
        <>
          <MarkButton editor={editor} mark="bold" label="Bold" shortcut="B">
            <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="currentColor"><path d="M15.6 10.79c.97-.67 1.65-1.77 1.65-2.79 0-2.26-1.75-4-4-4H7v14h7.04c2.09 0 3.71-1.7 3.71-3.79 0-1.52-.86-2.82-2.15-3.42zM10 6.5h3c.83 0 1.5.67 1.5 1.5s-.67 1.5-1.5 1.5h-3v-3zm3.5 9H10v-3h3.5c.83 0 1.5.67 1.5 1.5s-.67 1.5-1.5 1.5z"/></svg>
          </MarkButton>

          <div className="w-px h-5 bg-zinc-200 dark:bg-zinc-700 mx-0.5" />

          <MarkButton editor={editor} mark="italic" label="Italic" shortcut="I">
            <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="currentColor"><path d="M10 4v3h2.21l-3.42 8H6v3h8v-3h-2.21l3.42-8H18V4z"/></svg>
          </MarkButton>

          <MarkButton editor={editor} mark="underline" label="Underline" shortcut="U">
            <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="currentColor"><path d="M12 17c3.31 0 6-2.69 6-6V3h-2.5v8c0 1.93-1.57 3.5-3.5 3.5S8.5 12.93 8.5 11V3H6v8c0 3.31 2.69 6 6 6zm-7 2v2h14v-2H5z"/></svg>
          </MarkButton>

          <MarkButton editor={editor} mark="strike" label="Strikethrough">
            <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="currentColor"><path d="M6.85 7.08C6.85 4.37 9.45 3 12.24 3c1.64 0 3 .49 3.9 1.28.77.65 1.46 1.73 1.46 3.24h-3.01c0-.31-.05-.59-.15-.85-.29-.86-1.12-1.28-2.2-1.28-1.43 0-2.49.84-2.49 2.08 0 .93.75 1.64 1.85 1.98l2.97.89C17.76 11.16 19 12.6 19 14.69c0 2.77-2.32 4.31-5.1 4.31-2.25 0-4.18-.88-4.95-2.35-.38-.69-.52-1.37-.52-1.98h2.99c.08.94.63 1.93 2.48 1.93 1.43 0 2.2-.83 2.2-1.82 0-.92-.65-1.6-1.79-1.94l-2.92-.89C9.22 10.1 6.85 8.56 6.85 7.08zM3 12.5v-1.99h18v1.99H3z"/></svg>
          </MarkButton>

          <div className="w-px h-5 bg-zinc-200 dark:bg-zinc-700 mx-0.5" />

          <MarkButton editor={editor} mark="code" label="Inline code">
            <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M17.25 6.75L22.5 12l-5.25 5.25m-10.5 0L1.5 12l5.25-5.25m7.5-3l-4.5 16.5"/></svg>
          </MarkButton>

          <MarkButton editor={editor} mark="link" label="Link" onClick={openLinkInput}>
            <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M13.19 8.688a4.5 4.5 0 011.242 7.244l-4.5 4.5a4.5 4.5 0 01-6.364-6.364l1.757-1.757m13.35-.622l1.757-1.757a4.5 4.5 0 00-6.364-6.364l-4.5 4.5a4.5 4.5 0 001.242 7.244"/></svg>
          </MarkButton>

          <div className="w-px h-5 bg-zinc-200 dark:bg-zinc-700 mx-0.5" />

          <ColorDropdown editor={editor} />
          <HighlightDropdown editor={editor} />

          <div className="w-px h-5 bg-zinc-200 dark:bg-zinc-700 mx-0.5" />

          <MarkButton editor={editor} mark="superscript" label="Superscript">
            <span className="text-[10px] font-bold leading-none">x²</span>
          </MarkButton>

          <MarkButton editor={editor} mark="subscript" label="Subscript">
            <span className="text-[10px] font-bold leading-none">x₂</span>
          </MarkButton>
        </>
      )}
    </div>
  );

  if (typeof window === "undefined") return null;
  return createPortal(toolbar, document.body);
}

function MarkButton({ editor, mark, label, shortcut, onClick, children }: {
  editor: Editor; mark: string; label: string; shortcut?: string; onClick?: () => void; children: React.ReactNode;
}) {
  const isActive = editor.isActive(mark);
  return (
    <button
      type="button"
      onMouseDown={(e) => {
        e.preventDefault();
        if (onClick) { onClick(); } else { editor.chain().focus().toggleMark(mark).run(); }
      }}
      title={`${label}${shortcut ? ` (Ctrl+${shortcut})` : ""}`}
      className={`h-7 min-w-[1.75rem] rounded-lg flex items-center justify-center transition-all ${
        isActive
          ? "bg-zinc-200 dark:bg-zinc-700 text-zinc-900 dark:text-white"
          : "text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800"
      }`}
    >
      {children}
    </button>
  );
}

function ColorDropdown({ editor }: { editor: Editor }) {
  const [open, setOpen] = useState(false);
  const currentColor = (editor.getAttributes("textStyle").color as string) || null;

  return (
    <div className="relative">
      <button
        type="button"
        onMouseDown={(e) => { e.preventDefault(); setOpen((o) => !o); }}
        title="Text color"
        className={`h-7 min-w-[1.75rem] rounded-lg flex items-center justify-center transition-all ${
          currentColor ? "bg-zinc-200 dark:bg-zinc-700" : "text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800"
        }`}
      >
        <div className="relative">
          <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4.098 19.902a3.75 3.75 0 005.304 0l6.401-6.402M6.75 21A3.75 3.75 0 013 17.25V4.125C3 3.504 3.504 3 4.125 3h5.25c.621 0 1.125.504 1.125 1.125v4.072M6.75 21a3.75 3.75 0 003.75-3.75V8.197M6.75 21h13.125M6.75 21a3.75 3.75 0 01-3.75-3.75V8.197m0 0l4.5-4.5"/></svg>
          {currentColor && <div className="absolute -bottom-0.5 left-1/2 -translate-x-1/2 h-1 w-3 rounded-full" style={{ backgroundColor: currentColor }} />}
        </div>
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-50" onClick={() => setOpen(false)} />
          <div className="absolute left-0 top-full mt-1 z-50 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 p-2 shadow-xl">
            <div className="flex flex-wrap gap-1 w-[136px]">
              <button
                onMouseDown={(e) => { e.preventDefault(); editor.chain().focus().unsetColor().run(); setOpen(false); }}
                className="h-6 w-6 rounded-md border border-zinc-200 dark:border-zinc-600 flex items-center justify-center text-[10px] text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800"
              >/</button>
              {COLORS.map((c) => (
                <button
                  key={c}
                  onMouseDown={(e) => { e.preventDefault(); editor.chain().focus().setColor(c).run(); setOpen(false); }}
                  className="h-6 w-6 rounded-md hover:ring-2 ring-zinc-400 dark:ring-zinc-500 ring-offset-1 transition-all"
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function HighlightDropdown({ editor }: { editor: Editor }) {
  const [open, setOpen] = useState(false);
  const currentHighlight = (editor.getAttributes("highlight").color as string) || null;

  return (
    <div className="relative">
      <button
        type="button"
        onMouseDown={(e) => { e.preventDefault(); setOpen((o) => !o); }}
        title="Highlight"
        className={`h-7 min-w-[1.75rem] rounded-lg flex items-center justify-center transition-all ${
          currentHighlight
            ? "bg-zinc-200 dark:bg-zinc-700 text-zinc-900 dark:text-white"
            : "text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800"
        }`}
      >
        <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 3.938A7.5 7.5 0 0021 11.438c0 4.142-4.03 7.5-9 7.5-1.014 0-1.982-.124-2.883-.348L3 21l2.348-6.117A7.485 7.485 0 013 11.438C3 7.296 7.03 3.938 12 3.938z" />
        </svg>
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-50" onClick={() => setOpen(false)} />
          <div className="absolute left-0 top-full mt-1 z-50 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 p-2 shadow-xl">
            <div className="flex flex-wrap gap-1 w-[136px]">
              <button
                onMouseDown={(e) => { e.preventDefault(); editor.chain().focus().unsetHighlight().run(); setOpen(false); }}
                className="h-6 w-6 rounded-md border border-zinc-200 dark:border-zinc-600 flex items-center justify-center text-[10px] text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800"
              >/</button>
              {HIGHLIGHTS.map((c) => (
                <button
                  key={c}
                  onMouseDown={(e) => { e.preventDefault(); editor.chain().focus().toggleHighlight({ color: c }).run(); setOpen(false); }}
                  className="h-6 w-6 rounded-md hover:ring-2 ring-zinc-400 dark:ring-zinc-500 ring-offset-1 transition-all border border-transparent"
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
