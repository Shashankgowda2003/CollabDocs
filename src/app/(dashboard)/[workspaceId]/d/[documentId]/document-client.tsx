"use client";

import { useState } from "react";
import { DocumentEditor } from "./document-editor";
import { DocumentToolbar } from "./document-toolbar";
import type { Role } from "@/lib/types";

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
  authorId: string;
  status: string;
  createdAt: Date;
  author: { id: string; name: string | null; image: string | null };
  replies: {
    id: string;
    authorId: string;
    content: string;
    createdAt: Date;
    author: { id: string; name: string | null; image: string | null };
  }[];
}

interface ShareLink {
  id: string;
  role: string;
  password: string | null;
  expiresAt: Date | null;
  workspaceMemberOnly: boolean;
  isRevoked: boolean;
  createdAt: Date;
}

interface Props {
  documentId: string;
  workspaceId: string;
  role: Role;
  userName: string;
  userImage?: string;
  initialBlocks: Block[];
  threads: Thread[];
  links: ShareLink[];
  canEdit: boolean;
  canComment: boolean;
  pendingSuggestionCount: number;
}

export function DocumentClient({
  documentId,
  workspaceId,
  role,
  userName,
  userImage,
  initialBlocks,
  threads,
  links,
  canEdit,
  canComment,
  pendingSuggestionCount,
}: Props) {
  const [editorMode, setEditorMode] = useState<"editing" | "suggesting">("editing");

  return (
    <>
      <div className="flex items-center justify-end px-8 py-2 border-b border-zinc-200 dark:border-zinc-800/50">
        <DocumentToolbar
          documentId={documentId}
          workspaceId={workspaceId}
          role={role}
          threadCount={threads.length}
          links={links}
          threads={threads}
          editorMode={editorMode}
          onEditorModeChange={setEditorMode}
          pendingSuggestionCount={pendingSuggestionCount}
        />
      </div>
      <div className="flex-1 overflow-y-auto overflow-x-visible pl-14 pr-8 py-6">
        {canEdit ? (
          <DocumentEditor
            documentId={documentId}
            workspaceId={workspaceId}
            userName={userName}
            userImage={userImage}
            initialBlocks={initialBlocks}
            threads={threads}
            canComment={canComment}
            editorMode={editorMode}
          />
        ) : (
          <ReadOnlyView blocks={initialBlocks} />
        )}
      </div>
    </>
  );
}

function ReadOnlyView({
  blocks,
}: {
  blocks: { id: string; type: string; content: string }[];
}) {
  if (blocks.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-zinc-800 p-16 text-center">
        <p className="text-sm text-zinc-500">This document is empty.</p>
      </div>
    );
  }
  return (
    <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 divide-y divide-zinc-200 dark:divide-zinc-800 overflow-hidden">
      {blocks.map((block) => (
        <div key={block.id} className="p-5">
          <span className="text-xs font-mono text-zinc-600 bg-zinc-800/50 px-1.5 py-0.5 rounded mb-2 inline-block">
            {block.type}
          </span>
          <p className="text-sm text-zinc-600 dark:text-zinc-300 whitespace-pre-wrap leading-relaxed">
            {block.content}
          </p>
        </div>
      ))}
    </div>
  );
}
