import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { resolvePermission } from "@/lib/permissions";
import { hasMinRole } from "@/lib/types";
import { notFound } from "next/navigation";
import Link from "next/link";
import { FolderItems } from "../../folder-items";

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
      childFolders: { where: { deletedAt: null }, orderBy: { name: "asc" } },
      documents: { where: { deletedAt: null }, orderBy: { updatedAt: "desc" } },
    },
  });

  if (!folder || folder.workspaceId !== workspaceId) notFound();

  const role = await resolvePermission(session.user.id, "Folder", folderId);
  if (!role || !hasMinRole(role, "Viewer")) notFound();

  const canEdit = hasMinRole(role, "Editor");

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

      <FolderItems
        workspaceId={workspaceId}
        parentFolderId={folderId}
        folders={folder.childFolders}
        documents={folder.documents}
        canEdit={canEdit}
      />
    </div>
  );
}
