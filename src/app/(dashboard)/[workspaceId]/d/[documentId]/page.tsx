import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { resolvePermission } from "@/lib/permissions";
import { hasMinRole } from "@/lib/types";
import { notFound } from "next/navigation";
import Link from "next/link";
import { DocumentClient } from "./document-client";

interface Props {
  params: Promise<{ workspaceId: string; documentId: string }>;
}

export default async function DocumentPage({ params }: Props) {
  const { workspaceId, documentId } = await params;
  const session = await auth();
  if (!session?.user) notFound();

  const document = await db.document.findUnique({
    where: { id: documentId },
    include: {
      blocks: { orderBy: { position: "asc" } },
      documentTags: { include: { tag: true } },
      commentThreads: {
        include: {
          replies: {
            include: { author: { select: { id: true, name: true, image: true } } },
            orderBy: { createdAt: "asc" },
          },
          author: { select: { id: true, name: true, image: true } },
        },
        orderBy: { createdAt: "desc" },
      },
      shareLinks: {
        where: { isRevoked: false },
        orderBy: { createdAt: "desc" },
      },
      suggestions: {
        where: { status: "pending" },
        select: { id: true },
      },
    },
  });

  if (!document || document.workspaceId !== workspaceId) notFound();

  const role = await resolvePermission(session.user.id, "Document", documentId);
  if (!role || !hasMinRole(role, "Viewer")) notFound();

  const canEdit = hasMinRole(role, "Editor");
  const canComment = hasMinRole(role, "Commenter");

  const initialBlocks = document.blocks.map((b) => ({
    id: b.id,
    type: b.type,
    content: b.content,
    parentId: b.parentBlockId,
    position: b.position,
  }));

  const threads = document.commentThreads.map((t) => ({
    id: t.id,
    blockId: t.blockId,
    textRangeAnchor: t.textRangeAnchor,
    authorId: t.authorId,
    status: t.status,
    createdAt: t.createdAt,
    author: t.author,
    replies: t.replies.map((r) => ({
      id: r.id,
      authorId: r.authorId,
      content: r.content,
      createdAt: r.createdAt,
      author: r.author,
    })),
  }));

  const links = document.shareLinks.map((l) => ({
    id: l.id,
    role: l.role,
    password: l.password,
    expiresAt: l.expiresAt,
    workspaceMemberOnly: l.workspaceMemberOnly,
    isRevoked: l.isRevoked,
    createdAt: l.createdAt,
  }));

  const pendingSuggestionCount = document.suggestions.length;

  return (
    <div className="flex h-full bg-white dark:bg-zinc-950">
      <div className="flex-1 flex flex-col min-w-0">
        <div className="flex items-center justify-between px-8 pt-6 pb-3 border-b border-zinc-200 dark:border-zinc-800/50">
          <div className="flex items-center gap-4 min-w-0">
            <Link href={`/${workspaceId}`} className="text-sm text-zinc-500 hover:text-zinc-300 transition-colors shrink-0">
              <span className="flex items-center gap-1.5">
                <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" /></svg>
                Back
              </span>
            </Link>
            <div className="flex items-center gap-1.5 text-sm text-zinc-500">
              <span className="text-zinc-600">/</span>
              <h1 className="text-lg font-bold text-zinc-900 dark:text-white truncate">{document.title}</h1>
            </div>
            <div className="flex items-center gap-1.5">
              {document.documentTags.map((dt) => (
                <span key={dt.tagId} className="text-[10px] bg-zinc-200 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400 px-2 py-0.5 rounded-full">{dt.tag.name}</span>
              ))}
            </div>
            {pendingSuggestionCount > 0 && (
              <span className="text-[10px] font-medium text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-200 dark:border-amber-500/20">
                {pendingSuggestionCount} pending
              </span>
            )}
          </div>
        </div>

        <DocumentClient
          documentId={documentId}
          workspaceId={workspaceId}
          role={role}
          userName={session.user.name || session.user.email || "Anonymous"}
          userImage={session.user.image || undefined}
          initialBlocks={initialBlocks}
          threads={threads}
          links={links}
          canEdit={canEdit}
          canComment={canComment}
          pendingSuggestionCount={pendingSuggestionCount}
        />
      </div>
    </div>
  );
}
