"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import * as Y from "yjs";
import { WebsocketProvider } from "y-websocket";
import { createCollaboration, setCursorPosition, getConnectedUsers, type AwarenessUser, registerYDoc, unregisterYDoc } from "@/lib/collaboration";
import { BlockHandle, BlockAddButton } from "./block-handle";
import { SlashMenu } from "./slash-menu";
import { LinkAutocomplete } from "./link-autocomplete";
import { DatabaseBlock } from "./blocks/database-block";
import { DiagramBlock } from "./blocks/diagram-block";
import { TocBlock } from "./blocks/toc-block";
import { ProgressBarBlock } from "./blocks/progress-bar-block";
import { BreadcrumbBlock } from "./blocks/breadcrumb-block";
import { ButtonBlock } from "./blocks/button-block";
import { WhiteboardBlock } from "./blocks/whiteboard-block";
import { FormBlock } from "./blocks/form-block";
import { AutoSaveIndicator } from "./auto-save-indicator";
import { WordCount } from "./word-count";
import { FileDropZone } from "./file-drop-zone";
import { CollaborationCursors } from "@/components/collaboration/cursors";
import { ConnectedAvatars } from "@/components/collaboration/avatars";
import { CallButton } from "@/components/collaboration/call-button";
import { CallPanel } from "@/components/collaboration/call-panel";
import { CallManager } from "@/lib/webrtc/call-manager";
import { getAwareness } from "@/lib/collaboration";
import { motion, AnimatePresence } from "framer-motion";
import { maybeCreateSnapshot } from "@/server/actions/snapshots";
import { createSuggestion } from "@/server/actions/suggestions";
import { replayPendingOperation } from "@/server/actions/replay";
import { saveBlocks } from "@/server/actions/blocks";
import { queueOperation } from "@/lib/offline/sync-engine-v2";
import { getDocumentContentText, estimateReadingTimeShort } from "@/lib/utils";
import katex from "katex";

interface Block { id: string; type: string; content: string; parentId: string | null; position: number; }
interface Props { documentId: string; workspaceId: string; userName: string; userImage?: string; initialBlocks?: Block[]; editorMode?: "editing" | "suggesting"; }

export function BlockEditor({ documentId, workspaceId, userName, initialBlocks = [], editorMode = "editing" }: Props) {
  const editorRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [blocks, setBlocks] = useState<Block[]>(initialBlocks);
  const [activeBlock, setActiveBlock] = useState<string | null>(null);
  const [slashBlock, setSlashBlock] = useState<string | null>(null);
  const [linkBlock, setLinkBlock] = useState<string | null>(null);
  const [linkQuery, setLinkQuery] = useState("");
  const [connectedUsers, setConnectedUsers] = useState<Map<number, AwarenessUser>>(new Map());
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [uploading, setUploading] = useState(false);
  const [callStatus, setCallStatus] = useState<"idle" | "in-call">("idle");
  const [hasActiveCallers, setHasActiveCallers] = useState(false);
  const callManagerRef = useRef<CallManager | null>(null);
  const userColorRef = useRef<string>("#8b5cf6");
  const ydocRef = useRef<Y.Doc | null>(null);
  const providerRef = useRef<WebsocketProvider | null>(null);
  const awarenessRef = useRef<WebsocketProvider["awareness"] | null>(null);
  const yBlocksRef = useRef<Y.Array<Y.Map<string>> | null>(null);
  const saveTimerRef = useRef<NodeJS.Timeout | null>(null);
  const blocksRef = useRef<Block[]>(initialBlocks);
  const observerSetupRef = useRef(false);

  // Sync blocks TO Yjs from React state
  const syncToYjs = useCallback((newBlocks: Block[]) => {
    blocksRef.current = newBlocks;
    const yBlocks = yBlocksRef.current;
    if (!yBlocks) return;
    const ydoc = ydocRef.current;
    if (!ydoc) return;

    ydoc.transact(() => {
      yBlocks.delete(0, yBlocks.length);
      newBlocks.forEach((b) => {
        const yb = new Y.Map<string>();
        yb.set("id", b.id);
        yb.set("type", b.type);
        yb.set("content", b.content);
        yb.set("parentId", b.parentId ?? "");
        yb.set("position", String(b.position));
        yBlocks.push([yb]);
      });
    });
  }, []);

  // Read blocks FROM Yjs into React state
  const readFromYjs = useCallback((): Block[] => {
    const yBlocks = yBlocksRef.current;
    if (!yBlocks) return [];
    const result: Block[] = [];
    yBlocks.forEach((yb) => {
      result.push({
        id: yb.get("id") || "",
        type: yb.get("type") || "paragraph",
        content: yb.get("content") || "",
        parentId: yb.get("parentId") || null,
        position: Number(yb.get("position")) || 0,
      });
    });
    result.sort((a, b) => a.position - b.position);
    return result;
  }, []);

  useEffect(() => {
    const { ydoc, provider, awareness, user } = createCollaboration(documentId, userName);
    ydocRef.current = ydoc;
    providerRef.current = provider;
    awarenessRef.current = awareness;
    userColorRef.current = user.color;

    registerYDoc(documentId, ydoc);

    const yBlocks = ydoc.getArray<Y.Map<string>>("blocks_v2");
    yBlocksRef.current = yBlocks;

    if (initialBlocks.length > 0) {
      ydoc.transact(() => {
        yBlocks.delete(0, yBlocks.length);
        initialBlocks.forEach((b) => {
          const yb = new Y.Map<string>();
          yb.set("id", b.id);
          yb.set("type", b.type);
          yb.set("content", b.content);
          yb.set("parentId", b.parentId ?? "");
          yb.set("position", String(b.position));
          yBlocks.push([yb]);
        });
      });
      setBlocks(initialBlocks);
    } else if (yBlocks.length > 0) {
      setBlocks(readFromYjs());
    }

    // Observe remote changes (from other clients)
    const observer = () => {
      const fresh = readFromYjs();
      setBlocks(fresh);
    };
    yBlocks.observe(observer);

    awareness.on("change", () => setConnectedUsers(getConnectedUsers(awareness)));

    return () => {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
      yBlocks.unobserve(observer);
      unregisterYDoc(documentId);
      provider.disconnect();
      ydoc.destroy();
    };
  }, [documentId, userName]);

  // Initialize CallManager when awareness is ready
  useEffect(() => {
    const awareness = awarenessRef.current;
    if (!awareness) return;

    const cm = new CallManager(documentId, userName, userColorRef.current, awareness);
    callManagerRef.current = cm;

    const unsub = cm.subscribe(() => {
      setCallStatus(cm.getState().status);
    });

    return () => {
      unsub();
      cm.destroy();
      callManagerRef.current = null;
    };
  }, [documentId, userName]);

  // Track if other users are in a call
  useEffect(() => {
    const awareness = awarenessRef.current;
    if (!awareness) return;

    const checkCallers = () => {
      let found = false;
      awareness.getStates().forEach((state, clientId) => {
        if (clientId !== awareness.clientID) {
          const user = state as AwarenessUser;
          if (user?.callStatus === "in-call") found = true;
        }
      });
      setHasActiveCallers(found);
    };

    checkCallers();
    awareness.on("change", checkCallers);
    return () => awareness.off("change", checkCallers);
  }, [documentId, userName]);

  // Immediate state update + sync to Yjs
  const setBlocksAndSync = useCallback((updater: Block[] | ((prev: Block[]) => Block[])) => {
    setBlocks((prev) => {
      const next = typeof updater === "function" ? updater(prev) : updater;
      // Sync to Yjs on next tick so it doesn't block the input
      setTimeout(() => syncToYjs(next), 0);
      return next;
    });
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(() => {
      setLastSaved(new Date());
      const latestBlocks = blocksRef.current;
      if (navigator.onLine) {
        saveBlocks(documentId, latestBlocks.map((b) => ({
          id: b.id,
          type: b.type,
          content: b.content,
          parentBlockId: b.parentId,
          position: b.position,
        }))).catch(() => {});
        maybeCreateSnapshot(documentId).catch(() => {});
        replayPendingOperation("sync_links", documentId).catch(() => {});
      } else {
        queueOperation({ type: "snapshot", documentId }).catch(() => {});
        queueOperation({ type: "sync_links", documentId }).catch(() => {});
      }
    }, 1000);
  }, [syncToYjs]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (awarenessRef.current && editorRef.current) {
      const r = editorRef.current.getBoundingClientRect();
      setCursorPosition(awarenessRef.current, activeBlock, e.clientX - r.left, e.clientY - r.top);
    }
  }, [activeBlock]);

  const handleContentChange = useCallback((blockId: string, value: string) => {
    if (editorMode === "suggesting") {
      setBlocks((prev) => {
        const block = prev.find((b) => b.id === blockId);
        if (block && block.content !== value) {
          const suggestionType = !block.content ? "add" : value ? "change" : "remove";
          createSuggestion(
            documentId,
            blockId,
            suggestionType,
            block.content,
            value
          ).catch(() => {});
        }
        return prev;
      });
      return;
    }

    setBlocksAndSync((prev) =>
      prev.map((b) => (b.id === blockId ? { ...b, content: value } : b))
    );

    if (value === "/") setSlashBlock(blockId);
    else if (slashBlock === blockId) setSlashBlock(null);

    // Markdown shortcuts
    if (value.endsWith("### ")) {
      setBlocksAndSync((prev) =>
        prev.map((b) => (b.id === blockId ? { ...b, type: "heading", content: value.replace(/###\s*$/, "") } : b))
      );
    }
    if (value.endsWith("> ")) {
      setBlocksAndSync((prev) =>
        prev.map((b) => (b.id === blockId ? { ...b, type: "quote", content: value.replace(/>\s*$/, "") } : b))
      );
    }

    // Wiki-link autocomplete trigger: [[query
    const openLink = value.match(/\[\[([^\]]*)$/);
    if (openLink) {
      setLinkBlock(blockId);
      setLinkQuery(openLink[1] || "");
    } else if (linkBlock === blockId) {
      setLinkBlock(null);
      setLinkQuery("");
    }
  }, [slashBlock, setBlocksAndSync, editorMode, documentId, linkBlock]);

  const handleTypeChange = useCallback((blockId: string, newType: string) => {
    setBlocksAndSync((prev) =>
      prev.map((b) => (b.id === blockId ? { ...b, type: newType } : b))
    );
    setActiveBlock(null);
  }, [setBlocksAndSync]);

  const addBlock = useCallback((type: string, afterId?: string, content?: string) => {
    const id = crypto.randomUUID();
    setBlocksAndSync((prev) => {
      let pos = 0;
      if (afterId) {
        const idx = prev.findIndex((b) => b.id === afterId);
        if (idx !== -1) pos = idx + 1;
      } else {
        pos = prev.length;
      }
      const initialContent = type === "database" ? JSON.stringify({
        schema: [
          { id: crypto.randomUUID(), name: "Name", type: "text" },
          { id: crypto.randomUUID(), name: "Status", type: "select", options: ["Todo", "In Progress", "Done"] },
        ],
        rows: [],
        views: [
          { id: crypto.randomUUID(), type: "table", name: "Table" },
          { id: crypto.randomUUID(), type: "board", name: "Board" },
          { id: crypto.randomUUID(), type: "calendar", name: "Calendar" },
        ],
      }) : (content || "");
      const newBlock: Block = { id, type, content: initialContent, parentId: null, position: pos };
      const result = [...prev];
      result.splice(pos, 0, newBlock);
      return result.map((b, i) => ({ ...b, position: i }));
    });
    setActiveBlock(id);
    setSlashBlock(null);
  }, [setBlocksAndSync]);

  const duplicateBlock = useCallback((blockId: string) => {
    setBlocksAndSync((prev) => {
      const idx = prev.findIndex((b) => b.id === blockId);
      if (idx === -1) return prev;
      const original = prev[idx]!;
      const newBlock: Block = { ...original, id: crypto.randomUUID(), position: idx + 1 };
      const result = [...prev];
      result.splice(idx + 1, 0, newBlock);
      return result.map((b, i) => ({ ...b, position: i }));
    });
  }, [setBlocksAndSync]);

  const deleteBlock = useCallback((blockId: string) => {
    setBlocksAndSync((prev) => prev.filter((b) => b.id !== blockId).map((b, i) => ({ ...b, position: i })));
    if (activeBlock === blockId) setActiveBlock(null);
  }, [activeBlock, setBlocksAndSync]);

  const handleSlashSelect = useCallback((type: string) => {
    if (slashBlock) handleTypeChange(slashBlock, type);
  }, [slashBlock, handleTypeChange]);

  const handleLinkSelect = useCallback((title: string) => {
    if (!linkBlock) return;
    setBlocksAndSync((prev) =>
      prev.map((b) => {
        if (b.id !== linkBlock) return b;
        const newContent = b.content.replace(/\[\[[^\]]*$/, `[[${title}]]`);
        return { ...b, content: newContent };
      })
    );
    setLinkBlock(null);
    setLinkQuery("");
  }, [linkBlock, setBlocksAndSync]);

  const handleFilesDropped = useCallback(async (files: File[]) => {
    setUploading(true);
    for (const file of files) {
      const formData = new FormData();
      formData.append("file", file);
      try {
        const res = await fetch("/api/upload", { method: "POST", body: formData });
        const data = await res.json();
        if (data.url) {
          const blockType = data.isImage ? "image" : "embed";
          const blockContent = JSON.stringify({ url: data.url, filename: data.filename, type: data.type, size: data.size });
          addBlock(blockType, blocks[blocks.length - 1]?.id, blockContent);
        }
      } catch { /* ignore */ }
    }
    setUploading(false);
  }, [blocks, addBlock]);

  const handleToolbarUpload = useCallback(() => fileInputRef.current?.click(), []);
  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files; if (files) handleFilesDropped(Array.from(files));
    if (fileInputRef.current) fileInputRef.current.value = "";
  }, [handleFilesDropped]);

  return (
    <FileDropZone documentId={documentId} onFilesDropped={handleFilesDropped}>
      <div ref={editorRef} className="relative min-h-[400px]" onMouseMove={handleMouseMove}>
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-3">
              <ConnectedAvatars users={connectedUsers} />
              <span className="text-xs text-zinc-400 dark:text-zinc-600">{connectedUsers.size} online</span>
              {editorMode === "suggesting" && (
                <span className="text-[10px] font-medium text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-200 dark:border-amber-500/20">Suggesting</span>
              )}
            </div>
            <WordCount blocks={blocks} />
            <ReadingTime blocks={blocks} />
          </div>
          <div className="flex items-center gap-3">
            {uploading && <span className="text-[10px] text-zinc-500 animate-pulse">Uploading...</span>}
            <AutoSaveIndicator lastSaved={lastSaved} />
            <CallButton
              callActive={callStatus === "in-call"}
              hasActiveCallers={hasActiveCallers}
              onStartCall={() => callManagerRef.current?.startCall()}
              onStartAudioOnly={() => callManagerRef.current?.startAudioOnly()}
              onJoinCall={() => callManagerRef.current?.joinCall()}
              onLeaveCall={() => callManagerRef.current?.leaveCall()}
            />
            <button onClick={handleToolbarUpload} className="rounded-xl p-2 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-all" title="Upload file">
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" /></svg>
            </button>
          </div>
        </div>

        <input ref={fileInputRef} type="file" multiple className="hidden" onChange={handleFileInput}
          accept="image/*,video/*,.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.csv,.zip" />

        <div className="relative">
          <CollaborationCursors users={connectedUsers} currentUserName={userName} containerRef={editorRef} />
          <AnimatePresence mode="popLayout">
            <div className="space-y-1.5" onClick={() => setActiveBlock(null)}>
              {blocks.map((block) => (
                <motion.div key={block.id} layout initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, height: 0 }}
                  className={`group relative ${activeBlock === block.id ? "min-h-[2.5rem]" : ""}`}
                  onClick={(e) => { e.stopPropagation(); setActiveBlock(block.id); }}>
                    <BlockHandle block={block} hasAbove={blocks.indexOf(block) > 0}
                      onChangeType={(t) => handleTypeChange(block.id, t)}
                      onDelete={() => deleteBlock(block.id)}
                      onDuplicate={() => duplicateBlock(block.id)}
                      onAddAfter={() => addBlock("paragraph", block.id)}
                      onUpload={handleToolbarUpload} />
                    <BlockAddButton onClick={() => addBlock("paragraph", block.id)} />
                  <div className="relative">
                    <BlockContent block={block} isActive={activeBlock === block.id}
                      allBlocks={blocks}
                      onChange={(c) => handleContentChange(block.id, c)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && !e.shiftKey && !["code", "table", "checklist", "database"].includes(block.type)) { e.preventDefault(); addBlock("paragraph", block.id); }
                        if (e.key === "Backspace" && block.content === "" && blocks.length > 1 && !["image", "embed"].includes(block.type)) { e.preventDefault(); deleteBlock(block.id); }
                      }} />
                    {slashBlock === block.id && (
                      <SlashMenu onSelect={handleSlashSelect} onClose={() => setSlashBlock(null)} />
                    )}
                    {linkBlock === block.id && (
                      <LinkAutocomplete
                        query={linkQuery}
                        workspaceId={workspaceId}
                        onSelect={(doc) => handleLinkSelect(doc.title)}
                        onClose={() => { setLinkBlock(null); setLinkQuery(""); }}
                      />
                    )}
                  </div>
                </motion.div>
              ))}
            </div>
          </AnimatePresence>

          {blocks.length === 0 && (
            <button onClick={() => addBlock("paragraph")} className="w-full rounded-xl border border-dashed border-zinc-300 dark:border-zinc-800 p-16 text-center hover:border-zinc-400 dark:hover:border-zinc-700 transition-all">
              <svg className="h-8 w-8 text-zinc-400 dark:text-zinc-600 mx-auto mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" /></svg>
              <p className="text-sm text-zinc-500">Click to start writing, type &quot;/&quot; for blocks, or drag files here</p>
              <p className="text-xs text-zinc-400 dark:text-zinc-600 mt-1">Supports images, videos, PDFs, and more</p>
            </button>
          )}

          <motion.button whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }} onClick={() => addBlock("paragraph")}
            className="mt-3 w-full rounded-xl py-2.5 text-center text-sm text-zinc-400 dark:text-zinc-600 hover:text-zinc-600 dark:hover:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-900 transition-all">+ Add a block</motion.button>
        </div>
      </div>
    {callManagerRef.current && (
      <CallPanel
        callManager={callManagerRef.current}
        localUserName={userName}
        localUserColor={userColorRef.current}
        onClose={() => callManagerRef.current?.leaveCall()}
      />
    )}
    </FileDropZone>
  );
}

function BlockContent({ block, isActive, onChange, onKeyDown, allBlocks }: {
  block: Block; isActive: boolean; onChange: (c: string) => void; onKeyDown: (e: React.KeyboardEvent) => void; allBlocks?: Block[];
}) {
  const cn = "w-full rounded-xl px-3 py-2 text-zinc-800 dark:text-zinc-200 outline-none transition-all focus:bg-zinc-50 dark:focus:bg-zinc-900/50 placeholder:text-zinc-400 dark:placeholder:text-zinc-600";

  switch (block.type) {
    case "heading":
      return <input className={`${cn} text-2xl font-bold`} value={block.content} onChange={(e) => onChange(e.target.value)} onKeyDown={onKeyDown} placeholder="Heading 1" />;
    case "code":
      return (
        <div className="rounded-xl bg-zinc-900 border border-zinc-800 overflow-hidden">
          <div className="flex items-center gap-1.5 px-4 py-2 border-b border-zinc-800"><div className="flex gap-1.5"><div className="h-2.5 w-2.5 rounded-full bg-red-500/60" /><div className="h-2.5 w-2.5 rounded-full bg-yellow-500/60" /><div className="h-2.5 w-2.5 rounded-full bg-green-500/60" /></div><span className="text-[10px] text-zinc-600 ml-2">code</span></div>
          <textarea className="w-full bg-transparent outline-none resize-none p-4 text-sm font-mono text-green-400 placeholder:text-zinc-700" value={block.content} onChange={(e) => onChange(e.target.value)} onKeyDown={onKeyDown} placeholder="Write code..." rows={6} /></div>
      );
    case "quote":
      return <div className="border-l-2 border-blue-500 pl-4"><input className={`${cn} italic text-zinc-500 dark:text-zinc-400`} value={block.content} onChange={(e) => onChange(e.target.value)} onKeyDown={onKeyDown} placeholder="Quote" /></div>;
    case "callout":
      return <div className="rounded-xl bg-blue-50 dark:bg-blue-500/5 border border-blue-200 dark:border-blue-500/20 p-4"><input className="w-full bg-transparent outline-none text-blue-700 dark:text-blue-300 text-sm placeholder:text-blue-400 dark:placeholder:text-blue-500/50" value={block.content} onChange={(e) => onChange(e.target.value)} onKeyDown={onKeyDown} placeholder="Callout" /></div>;
    case "image": {
      let url = ""; let filename = "";
      try { const p = JSON.parse(block.content); url = p.url; filename = p.filename; } catch { url = block.content; }
      return (
        <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 overflow-hidden bg-zinc-50 dark:bg-zinc-900/50">
          <img src={url} alt={filename || "Image"} className="w-full max-h-96 object-contain" />
          {filename && <div className="px-4 py-2 border-t border-zinc-200 dark:border-zinc-800 text-[10px] text-zinc-400 dark:text-zinc-500">{filename}</div>}
        </div>
      );
    }
    case "embed": {
      let url = ""; let filename = ""; let size = 0;
      try { const p = JSON.parse(block.content); url = p.url; filename = p.filename; size = p.size; } catch { url = block.content; }
      const ext = filename.split(".").pop()?.toLowerCase();
      const isVideo = ["mp4", "webm", "ogg"].includes(ext || "");
      const sizeStr = size > 1024 * 1024 ? `${(size / 1024 / 1024).toFixed(1)}MB` : size > 1024 ? `${(size / 1024).toFixed(1)}KB` : `${size}B`;
      return (
        <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 overflow-hidden bg-zinc-50 dark:bg-zinc-900/50">
          {isVideo ? (
            <video src={url} controls className="w-full max-h-96" />
          ) : (
            <a href={url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-4 p-5 hover:bg-zinc-100 dark:hover:bg-zinc-900 transition-all group">
              <div className="h-10 w-10 rounded-xl bg-zinc-200 dark:bg-zinc-800 flex items-center justify-center shrink-0">
                <svg className="h-5 w-5 text-zinc-400 dark:text-zinc-500 group-hover:text-zinc-600 dark:group-hover:text-zinc-300 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m.75 12l3 3m0 0l3-3m-3 3v-6m-1.5-9H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" /></svg>
              </div>
              <div className="flex-1 min-w-0"><p className="text-sm font-medium text-zinc-800 dark:text-white truncate">{filename || "File"}</p><p className="text-xs text-zinc-500 mt-0.5">{sizeStr}</p></div>
              <svg className="h-4 w-4 text-zinc-400 dark:text-zinc-600 group-hover:text-zinc-600 dark:group-hover:text-zinc-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" /></svg>
            </a>
          )}
        </div>
      );
    }
    case "table": {
      let headers: string[] = []; let rows: string[][] = [];
      try { const p = JSON.parse(block.content); headers = p.headers || []; rows = p.rows || []; } catch { headers = ["A", "B"]; rows = [["", ""]]; }
      const maxCols = headers.length || (rows[0]?.length || 2);

      function updateCell(ri: number, ci: number, val: string) {
        const newRows = rows.map((r, i) => i === ri ? r.map((c, j) => j === ci ? val : c) : r);
        onChange(JSON.stringify({ headers, rows: newRows }));
      }

      function updateHeader(ci: number, val: string) {
        const newHeaders = headers.map((h, i) => i === ci ? val : h);
        onChange(JSON.stringify({ headers: newHeaders, rows }));
      }

      function addColumn() {
        const newHeaders = [...headers, `Col ${headers.length + 1}`];
        const newRows = rows.map((r) => [...r, ""]);
        onChange(JSON.stringify({ headers: newHeaders, rows: newRows }));
      }

      function addRow() {
        const newRows = [...rows, Array(maxCols).fill("")];
        onChange(JSON.stringify({ headers, rows: newRows }));
      }

      function removeColumn(ci: number) {
        if (headers.length <= 1) return;
        const newHeaders = headers.filter((_, i) => i !== ci);
        const newRows = rows.map((r) => r.filter((_, i) => i !== ci));
        onChange(JSON.stringify({ headers: newHeaders, rows: newRows }));
      }

      function removeRow(ri: number) {
        if (rows.length <= 1) return;
        const newRows = rows.filter((_, i) => i !== ri);
        onChange(JSON.stringify({ headers, rows: newRows }));
      }

      return (
        <div className="rounded-xl border border-zinc-200 dark:border-zinc-700 overflow-x-auto bg-white dark:bg-zinc-950">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="bg-zinc-50 dark:bg-zinc-900/50">
                {headers.map((h, i) => (
                  <th key={i} className="border border-zinc-200 dark:border-zinc-700 px-2 py-1.5 relative group/th">
                    <div className="flex items-center gap-1">
                      <input
                        className="w-full bg-transparent outline-none text-xs font-semibold text-zinc-700 dark:text-zinc-300 px-1 py-0.5"
                        value={h}
                        onChange={(e) => updateHeader(i, e.target.value)}
                        placeholder="Header"
                      />
                      <button
                        onClick={() => removeColumn(i)}
                        className="opacity-0 group-hover/th:opacity-100 shrink-0 h-4 w-4 rounded text-zinc-400 hover:text-red-400 flex items-center justify-center"
                        title="Remove column"
                      >×</button>
                    </div>
                  </th>
                ))}
                <th className="border border-zinc-200 dark:border-zinc-700 px-1 py-1.5 w-8">
                  <button onClick={addColumn} className="h-5 w-5 rounded text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 flex items-center justify-center text-xs font-bold" title="Add column">+</button>
                </th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row, ri) => (
                <tr key={ri} className="group/trow">
                  {row.map((cell, ci) => (
                    <td key={ci} className="border border-zinc-100 dark:border-zinc-800 px-2 py-1">
                      <input
                        className="w-full bg-transparent outline-none text-xs text-zinc-600 dark:text-zinc-400 px-1 py-0.5"
                        value={cell}
                        onChange={(e) => updateCell(ri, ci, e.target.value)}
                        placeholder=" "
                      />
                    </td>
                  ))}
                  <td className="border border-zinc-100 dark:border-zinc-800 px-1 py-1 w-8">
                    <button
                      onClick={() => removeRow(ri)}
                      className="opacity-0 group-hover/trow:opacity-100 h-5 w-5 rounded text-zinc-400 hover:text-red-400 flex items-center justify-center text-xs"
                      title="Remove row"
                    >×</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <button onClick={addRow} className="w-full py-1.5 text-xs text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-900/50 border-t border-zinc-100 dark:border-zinc-800 flex items-center justify-center gap-1 transition-all">
            <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" /></svg>
            Add row
          </button>
        </div>
      );
    }
    case "checklist": {
      let items: { text: string; checked: boolean }[] = [];
      try { const p = JSON.parse(block.content); items = p.items || []; } catch { items = []; }
      if (items.length === 0) items = [{ text: "", checked: false }];

      function toggleItem(idx: number) {
        const newItems = items.map((item, i) => i === idx ? { ...item, checked: !item.checked } : item);
        onChange(JSON.stringify({ items: newItems }));
      }

      function updateItem(idx: number, text: string) {
        const newItems = items.map((item, i) => i === idx ? { ...item, text } : item);
        onChange(JSON.stringify({ items: newItems }));
      }

      function addItem() {
        onChange(JSON.stringify({ items: [...items, { text: "", checked: false }] }));
      }

      function removeItem(idx: number) {
        if (items.length <= 1) return;
        const newItems = items.filter((_, i) => i !== idx);
        onChange(JSON.stringify({ items: newItems }));
      }

      const completed = items.filter((i) => i.checked).length;
      const progress = items.length > 0 ? Math.round((completed / items.length) * 100) : 0;

      return (
        <div className="rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-950 p-3">
          <div className="flex items-center gap-2 mb-3">
            <div className="flex-1 h-1.5 rounded-full bg-zinc-100 dark:bg-zinc-800 overflow-hidden">
              <div className="h-full rounded-full bg-green-500 transition-all" style={{ width: `${progress}%` }} />
            </div>
            <span className="text-[10px] text-zinc-400 tabular-nums">{completed}/{items.length}</span>
          </div>
          <div className="space-y-1">
            {items.map((item, idx) => (
              <div key={idx} className="flex items-start gap-2 group/item">
                <button
                  onClick={() => toggleItem(idx)}
                  className={`mt-0.5 h-4 w-4 rounded border flex items-center justify-center shrink-0 transition-all ${
                    item.checked
                      ? "bg-green-500 border-green-500 text-white"
                      : "border-zinc-300 dark:border-zinc-600 hover:border-zinc-400 dark:hover:border-zinc-500"
                  }`}
                >
                  {item.checked && (
                    <svg className="h-2.5 w-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" /></svg>
                  )}
                </button>
                <input
                  className={`flex-1 bg-transparent outline-none text-sm py-0.5 ${
                    item.checked
                      ? "text-zinc-400 line-through"
                      : "text-zinc-700 dark:text-zinc-300"
                  }`}
                  value={item.text}
                  onChange={(e) => updateItem(idx, e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") { e.preventDefault(); addItem(); }
                    if (e.key === "Backspace" && item.text === "" && items.length > 1) { e.preventDefault(); removeItem(idx); }
                  }}
                  placeholder="List item..."
                />
                <button
                  onClick={() => removeItem(idx)}
                  className="opacity-0 group-hover/item:opacity-100 h-5 w-5 rounded text-zinc-400 hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 flex items-center justify-center shrink-0"
                >×</button>
              </div>
            ))}
          </div>
          <button onClick={addItem} className="mt-2 w-full py-1 text-xs text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-900/50 rounded-lg flex items-center justify-center gap-1 transition-all">
            <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" /></svg>
            Add item
          </button>
        </div>
      );
    }
    case "equation": {
      const renderLatex = (latex: string) => {
        try {
          return katex.renderToString(latex || "x = 0", { throwOnError: false, output: "html" });
        } catch {
          return latex;
        }
      };

      return (
        <div className="rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-950 p-3">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-[10px] font-mono text-zinc-400 bg-zinc-100 dark:bg-zinc-800 px-1.5 py-0.5 rounded">LaTeX</span>
          </div>
          <input
            className="w-full rounded-lg bg-zinc-50 dark:bg-zinc-900 p-2 text-sm font-mono text-zinc-700 dark:text-zinc-300 outline-none placeholder:text-zinc-400"
            value={block.content}
            onChange={(e) => onChange(e.target.value)}
            onKeyDown={onKeyDown}
            placeholder="E = mc^2"
          />
          {block.content && (
            <div className="mt-2 flex justify-center min-h-[2rem] p-2">
              <span
                className="text-base text-zinc-700 dark:text-zinc-300 font-mono"
                dangerouslySetInnerHTML={{ __html: renderLatex(block.content) }}
              />
            </div>
          )}
        </div>
      );
    }
    case "database":
      return <DatabaseBlock content={block.content} onChange={onChange} />;
    case "diagram":
      return <DiagramBlock content={block.content} onChange={onChange} onKeyDown={onKeyDown} />;
    case "toc":
      return <TocBlock blocks={allBlocks ?? []} onScrollToBlock={(id) => {
        document.getElementById(`block-${id}`)?.scrollIntoView({ behavior: "smooth" });
      }} />;
    case "progress":
      return <ProgressBarBlock content={block.content} onChange={onChange} />;
    case "breadcrumb":
      return <BreadcrumbBlock content={block.content} onChange={onChange} />;
    case "button":
      return <ButtonBlock content={block.content} blockId={block.id} />;
    case "whiteboard":
      return <WhiteboardBlock content={block.content} onChange={onChange} />;
    case "form":
      return <FormBlock content={block.content} onChange={onChange} />;
    case "synced": {
      let refId = block.content;
      try { const p = JSON.parse(block.content); refId = p.refId || block.content; } catch {}
      const refBlock = (allBlocks ?? []).find((b) => b.id === refId);
      if (refBlock) {
        return <BlockContent block={refBlock} isActive={false} onChange={() => {}} onKeyDown={() => {}} allBlocks={allBlocks} />;
      }
      return (
        <div className="rounded-xl border border-dashed border-amber-300 dark:border-amber-500/30 bg-amber-50 dark:bg-amber-500/5 p-4 text-center">
          <p className="text-xs text-amber-600 dark:text-amber-400">
            Synced block — paste a block ID to mirror it here
          </p>
          <input
            className="mt-2 w-full max-w-xs rounded-lg border border-amber-200 dark:border-amber-500/20 bg-white dark:bg-zinc-900 px-3 py-1.5 text-xs text-zinc-700 dark:text-zinc-300 outline-none font-mono"
            value={refId}
            onChange={(e) => onChange(JSON.stringify({ refId: e.target.value }))}
            placeholder="Block ID"
          />
        </div>
      );
    }
    default:
      return <input className={`${cn} text-sm leading-relaxed`} value={block.content} onChange={(e) => onChange(e.target.value)} onKeyDown={onKeyDown} placeholder="Type '/' for commands..." />;
  }
}

function ReadingTime({ blocks }: { blocks: { content: string }[] }) {
  const text = getDocumentContentText(blocks);
  if (!text.trim()) return null;
  return (
    <span className="text-xs text-zinc-400 dark:text-zinc-600">
      {estimateReadingTimeShort(text)}
    </span>
  );
}
