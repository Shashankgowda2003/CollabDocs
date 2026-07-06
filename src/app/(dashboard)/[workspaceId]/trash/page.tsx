import { auth } from "@/lib/auth";
import { getTrash, restoreFromTrash, permanentDelete } from "@/server/actions/trash";
import { notFound } from "next/navigation";
import Link from "next/link";
import { TrashActions } from "./trash-actions";

interface Props { params: Promise<{ workspaceId: string }>; }

export default async function TrashPage({ params }: Props) {
  const { workspaceId } = await params;
  const session = await auth();
  if (!session?.user) notFound();

  const trash = await getTrash(workspaceId);

  return (
    <div className="min-h-full bg-white dark:bg-zinc-950">
      <div className="max-w-3xl mx-auto p-8">
        <Link href={`/${workspaceId}`} className="text-sm text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300 transition-colors mb-4 inline-block">&larr; Back to Workspace</Link>
        <h1 className="text-2xl font-bold text-zinc-900 dark:text-white mb-2">Trash</h1>
        <p className="text-sm text-zinc-500 mb-8">Items in trash are automatically deleted after 30 days.</p>

        {trash.documents.length === 0 && trash.folders.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-zinc-200 dark:border-zinc-800 p-16 text-center">
            <div className="h-12 w-12 rounded-xl bg-zinc-100 dark:bg-zinc-800/50 flex items-center justify-center mx-auto mb-4">
              <svg className="h-6 w-6 text-zinc-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" /></svg>
            </div>
            <p className="text-sm text-zinc-500">Trash is empty</p>
          </div>
        ) : (
          <div className="space-y-6">
            {trash.folders.length > 0 && (
              <section>
                <h2 className="text-xs font-semibold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider mb-3">Folders</h2>
                <div className="space-y-2">
                  {trash.folders.map((f) => (
                    <div key={f.id} className="flex items-center justify-between rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50 p-4">
                      <div className="flex items-center gap-3">
                        <svg className="h-5 w-5 text-zinc-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12.75V12A2.25 2.25 0 014.5 9.75h15A2.25 2.25 0 0121.75 12v.75m-8.69-6.44l-2.12-2.12a1.5 1.5 0 00-1.061-.44H4.5A2.25 2.25 0 002.25 6v12a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9a2.25 2.25 0 00-2.25-2.25h-5.379a1.5 1.5 0 01-1.06-.44z" /></svg>
                        <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">{f.name}</span>
                      </div>
                      <TrashActions resourceType="Folder" resourceId={f.id} workspaceId={workspaceId} />
                    </div>
                  ))}
                </div>
              </section>
            )}
            {trash.documents.length > 0 && (
              <section>
                <h2 className="text-xs font-semibold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider mb-3">Documents</h2>
                <div className="space-y-2">
                  {trash.documents.map((d) => (
                    <div key={d.id} className="flex items-center justify-between rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50 p-4">
                      <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">{d.title}</span>
                      <TrashActions resourceType="Document" resourceId={d.id} workspaceId={workspaceId} />
                    </div>
                  ))}
                </div>
              </section>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
