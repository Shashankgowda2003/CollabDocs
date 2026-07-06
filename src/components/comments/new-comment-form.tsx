"use client";

import { useState } from "react";
import { createThread } from "@/server/actions/comments";
import { getYDoc, addCommentThread, type YjsReply } from "@/lib/collaboration";

interface NewCommentFormProps {
  documentId: string;
  blockId?: string;
  textRangeAnchor?: string;
  placeholder?: string;
  onCreated?: () => void;
  userName?: string;
  userId?: string;
}

export function NewCommentForm({
  documentId,
  blockId,
  textRangeAnchor,
  placeholder = "Add a comment...",
  onCreated,
  userName,
  userId,
}: NewCommentFormProps) {
  const [content, setContent] = useState("");
  const [sending, setSending] = useState(false);

  async function handleSubmit() {
    if (!content.trim()) return;
    setSending(true);
    try {
      const thread = await createThread(
        documentId,
        blockId || null,
        textRangeAnchor || null,
        content
      );

      const ydoc = getYDoc(documentId);
      if (ydoc && userId && userName) {
        addCommentThread(ydoc, {
          id: thread.id,
          blockId: blockId || null,
          textRangeAnchor: textRangeAnchor || null,
          authorId: userId,
          authorName: userName,
          status: "Open",
          createdAt: Date.now(),
          replies: [{
            id: thread.replies?.[0]?.id || crypto.randomUUID(),
            authorId: userId,
            authorName: userName,
            content: content,
            createdAt: Date.now(),
          }],
        });
      }

      setContent("");
      onCreated?.();
    } catch (e) {
      console.error(e);
    }
    setSending(false);
  }

  return (
    <div className="flex items-start gap-2">
      <input
        value={content}
        onChange={(e) => setContent(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            handleSubmit();
          }
        }}
        placeholder={placeholder}
        className="flex-1 text-sm border border-zinc-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-zinc-400 focus:border-transparent"
      />
      <button
        onClick={handleSubmit}
        disabled={sending || !content.trim()}
        className="h-9 rounded-lg bg-zinc-900 px-4 text-sm font-medium text-white hover:bg-zinc-800 disabled:opacity-40 transition-colors shrink-0"
      >
        {sending ? "..." : "Send"}
      </button>
    </div>
  );
}
