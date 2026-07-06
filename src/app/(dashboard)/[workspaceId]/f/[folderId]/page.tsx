import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { resolvePermission } from "@/lib/permissions";
import { hasMinRole } from "@/lib/types";
import { notFound } from "next/navigation";
import Link from "next/link";

interface Props {
  params: Promise<{ workspaceId: string; folderId: string }>;
}

export default async function FolderPage({ params }: Props) {
  const { workspaceId, folderId } = await params;
  const session = await auth();
  if (!session?.user) notFound();

  const folder = await db.folder.findUnique({
    where: { id: folderId },
    include: {
      childFolders: { orderBy: { name: "asc" } },
      documents: { orderBy: { updatedAt: "desc" } },
    },
  });

  if (!folder || folder.workspaceId !== workspaceId) notFound();

  const role = await resolvePermission(session.user.id, "Folder", folderId);
  if (!role || !hasMinRole(role, "Viewer")) notFound();

  return (
    <div className="max-w-4xl mx-auto p-8">
      <Link
        href={`/${workspaceId}`}
        className="text-sm text-zinc-500 hover:text-zinc-700 transition-colors mb-4 inline-block"
      >
        &larr; Back to Workspace
      </Link>

      <div className="flex items-center gap-3 mb-8">
        <svg
          className="h-6 w-6 text-zinc-400"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={1.5}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M2.25 12.75V12A2.25 2.25 0 014.5 9.75h15A2.25 2.25 0 0121.75 12v.75m-8.69-6.44l-2.12-2.12a1.5 1.5 0 00-1.061-.44H4.5A2.25 2.25 0 002.25 6v12a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9a2.25 2.25 0 00-2.25-2.25h-5.379a1.5 1.5 0 01-1.06-.44z"
          />
        </svg>
        <h1 className="text-2xl font-bold text-zinc-900">{folder.name}</h1>
      </div>

      {folder.childFolders.length > 0 && (
        <section className="mb-6">
          <h2 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-3">
            Subfolders
          </h2>
          <div className="grid gap-2 sm:grid-cols-2">
            {folder.childFolders.map((sf) => (
              <Link
                key={sf.id}
                href={`/${workspaceId}/f/${sf.id}`}
                className="flex items-center gap-3 rounded-lg border border-zinc-200 p-3 hover:border-zinc-400 transition-all"
              >
                <svg
                  className="h-4 w-4 text-zinc-400 shrink-0"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={1.5}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M2.25 12.75V12A2.25 2.25 0 014.5 9.75h15A2.25 2.25 0 0121.75 12v.75m-8.69-6.44l-2.12-2.12a1.5 1.5 0 00-1.061-.44H4.5A2.25 2.25 0 002.25 6v12a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9a2.25 2.25 0 00-2.25-2.25h-5.379a1.5 1.5 0 01-1.06-.44z"
                  />
                </svg>
                <span className="text-sm font-medium text-zinc-900">{sf.name}</span>
              </Link>
            ))}
          </div>
        </section>
      )}

      <section>
        <h2 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-3">
          Documents
        </h2>
        {folder.documents.length === 0 ? (
          <div className="rounded-lg border border-dashed border-zinc-300 p-8 text-center">
            <p className="text-zinc-500 text-sm">No documents in this folder</p>
          </div>
        ) : (
          <div className="grid gap-2 sm:grid-cols-2">
            {folder.documents.map((doc) => (
              <Link
                key={doc.id}
                href={`/${workspaceId}/d/${doc.id}`}
                className="flex items-center gap-3 rounded-lg border border-zinc-200 p-3 hover:border-zinc-400 transition-all"
              >
                <svg
                  className="h-4 w-4 text-zinc-400 shrink-0"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={1.5}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z"
                  />
                </svg>
                <div className="min-w-0">
                  <p className="text-sm font-medium text-zinc-900 truncate">{doc.title}</p>
                  <p className="text-xs text-zinc-500">
                    {new Date(doc.updatedAt).toLocaleDateString()}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
