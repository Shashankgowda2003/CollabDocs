import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { cachedGetUserWorkspaces } from "@/lib/permissions";
import { hasMinRole, type Role } from "@/lib/types";
import { notFound } from "next/navigation";
import Link from "next/link";
import { WorkspaceItems } from "./workspace-items";
import { WorkspaceActions } from "./workspace-actions";
import { ActivityFeed } from "@/components/activity-feed";
import { QuickNotes } from "@/components/quick-notes";

interface Props { params: Promise<{ workspaceId: string }>; }

export default async function WorkspacePage({ params }: Props) {
  const { workspaceId } = await params;
  const session = await auth();
  if (!session?.user) notFound();

  const memberships = await cachedGetUserWorkspaces(session.user.id);
  const membership = memberships.find((m) => m.workspaceId === workspaceId);
  if (!membership) notFound();

  const { workspace } = membership;
  const canEdit = hasMinRole(membership.role as Role, "Editor");

  const recentDocs = await db.document.findMany({ where: { workspaceId, deletedAt: null }, orderBy: { updatedAt: "desc" }, take: 5 });

  return (
    <div className="min-h-full bg-white dark:bg-zinc-950">
      <div className="max-w-4xl mx-auto p-8">
        <div className="flex items-center justify-between mb-10">
          <div>
            <Link href="/dashboard" className="text-sm text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300 transition-colors mb-1.5 inline-block">&larr; All Workspaces</Link>
            <h1 className="text-2xl font-bold text-zinc-900 dark:text-white">{workspace.name}</h1>
            <div className="flex items-center gap-3 mt-1">
              <p className="text-sm text-zinc-500">{membership.role}</p>
              <Link href={`/${workspaceId}/members`} className="text-xs text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-400 transition-colors">Members</Link>
              <span className="text-zinc-600 dark:text-zinc-700">&middot;</span>
              <Link href={`/${workspaceId}/trash`} className="text-xs text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-400 transition-colors">Trash</Link>
            </div>
            <WorkspaceActions workspaceId={workspaceId} />
          </div>
        </div>

        {recentDocs.length > 0 && (
          <section className="mb-8">
            <h2 className="text-xs font-semibold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider mb-3">Recent</h2>
            <div className="grid gap-2 sm:grid-cols-2">
              {recentDocs.map((doc) => (
                <Link key={doc.id} href={`/${workspaceId}/d/${doc.id}`}
                  className="group flex items-center gap-3 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/50 p-3 hover:border-zinc-300 dark:hover:border-zinc-700 hover:shadow-sm dark:hover:bg-zinc-900 transition-all">
                  <svg className="h-4 w-4 text-zinc-400 dark:text-zinc-500 group-hover:text-zinc-600 dark:group-hover:text-zinc-300 transition-colors shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" /></svg>
                  <div className="min-w-0"><p className="text-sm font-medium text-zinc-900 dark:text-white truncate">{doc.title}</p><p className="text-[10px] text-zinc-500 mt-0.5">{new Date(doc.updatedAt).toLocaleDateString()}</p></div>
                </Link>
              ))}
            </div>
          </section>
        )}

        <WorkspaceItems workspaceId={workspaceId} folders={workspace.folders} documents={workspace.documents} canEdit={canEdit} />
        <div className="mt-8">
          <QuickNotes workspaceId={workspaceId} />
        </div>
        <ActivityFeed workspaceId={workspaceId} />
      </div>
    </div>
  );
}
