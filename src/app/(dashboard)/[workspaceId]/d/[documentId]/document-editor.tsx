"use client";

import dynamic from "next/dynamic";
import { useState, useEffect, useCallback } from "react";
import { NewCommentForm } from "@/components/comments/new-comment-form";
import { OfflineIndicator } from "@/components/editor/offline-indicator";
import { WordCount } from "@/components/editor/word-count";
import { getYDoc, readCommentsFromYjs, type YjsComment } from "@/lib/collaboration";
import type * as Y from "yjs";

interface Block {
  id: string;
  type: string;
  content: string;
  parentId: string | null;
  position: number;
}

interface Thread {
  id: string;
  blockId: string | null;
  textRangeAnchor: string | null;
  author: { id: string; name: string | null; image: string | null };
  status: string;
  createdAt: Date;
  replies: {
    id: string;
    author: { id: string; name: string | null; image: string | null };
    content: string;
    createdAt: Date;
  }[];
}

const BlockEditor = dynamic(
  () =>
    import("@/components/editor/block-editor").then((mod) => ({
      default: mod.BlockEditor,
    })),
  {
    ssr: false,
    loading: () => (
      <div className="min-h-[400px] rounded-lg border border-zinc-200 p-8 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-zinc-300 border-t-zinc-600" />
          <p className="text-sm text-zinc-400">Loading editor...</p>
        </div>
      </div>
    ),
  }
);

interface Props {
  documentId: string;
  workspaceId: string;
  userName: string;
  userImage?: string;
  initialBlocks: Block[];
  threads: Thread[];
  canComment: boolean;
  editorMode?: "editing" | "suggesting";
  userId?: string;
}

export function DocumentEditor({
  documentId,
  workspaceId,
  userName,
  userImage,
  initialBlocks,
  threads: _threads,
  canComment,
  editorMode,
  userId,
}: Props) {
  const [showNewComment, setShowNewComment] = useState(false);
  const [liveComments, setLiveComments] = useState<YjsComment[]>([]);

  useEffect(() => {
    const interval = setInterval(() => {
      const ydoc = getYDoc(documentId);
      if (ydoc) {
        const comments = readCommentsFromYjs(ydoc);
        setLiveComments(comments);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [documentId]);

  return (
    <div>
      <OfflineIndicator />
      <BlockEditor
        documentId={documentId}
        workspaceId={workspaceId}
        userName={userName}
        userImage={userImage}
        initialBlocks={initialBlocks}
        editorMode={editorMode || "editing"}
      />

      {canComment && (
        <div className="mt-8 pt-6 border-t border-zinc-200 dark:border-zinc-800">
          <div className="flex items-center gap-3 mb-4">
            <h3 className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">Comments</h3>
            <button
              onClick={() => setShowNewComment(!showNewComment)}
              className="text-xs text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300"
            >
              {showNewComment ? "Cancel" : "+ New"}
            </button>
            {liveComments.length > 0 && (
              <span className="text-[10px] text-zinc-400">{liveComments.length} thread{liveComments.length !== 1 ? "s" : ""}</span>
            )}
          </div>

          {liveComments.map((thread) => (
            <div key={thread.id} className="mb-3 rounded-xl border border-zinc-100 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50 p-3">
              <div className="flex items-center gap-2 mb-2">
                <div className="h-5 w-5 rounded-full bg-zinc-200 dark:bg-zinc-700 flex items-center justify-center text-[10px] font-medium text-zinc-600 dark:text-zinc-400">
                  {thread.authorName?.[0] || "?"}
                </div>
                <span className="text-xs font-medium text-zinc-700 dark:text-zinc-300">{thread.authorName}</span>
                <span className={`text-[10px] ml-auto px-1.5 py-0.5 rounded-full ${thread.status === "Open" ? "bg-green-100 dark:bg-green-500/10 text-green-700 dark:text-green-400" : "bg-zinc-100 dark:bg-zinc-800 text-zinc-400"}`}>{thread.status}</span>
              </div>
              {thread.replies.map((reply, ri) => (
                <div key={reply.id || ri} className="pl-7 border-l border-zinc-200 dark:border-zinc-700 ml-2 mb-1">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="text-[10px] font-medium text-zinc-600 dark:text-zinc-400">{reply.authorName}</span>
                  </div>
                  <p className="text-sm text-zinc-600 dark:text-zinc-400 whitespace-pre-wrap">{reply.content}</p>
                </div>
              ))}
            </div>
          ))}

          {showNewComment && (
            <NewCommentForm
              documentId={documentId}
              placeholder="Add a document-level comment..."
              userName={userName}
              userId={userId}
            />
          )}
        </div>
      )}
    </div>
  );
}
