import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { notFound } from "next/navigation";
import { WorkspaceSettingsClient } from "./workspace-settings-client";

interface Props { params: Promise<{ workspaceId: string }>; }

export default async function WorkspaceSettingsPage({ params }: Props) {
  const { workspaceId } = await params;
  const session = await auth();
  if (!session?.user) notFound();

  const membership = await db.workspaceMember.findUnique({
    where: { workspaceId_userId: { workspaceId, userId: session.user.id } },
    include: { workspace: true },
  });

  if (!membership) notFound();

  return (
    <div className="min-h-full bg-white dark:bg-zinc-950">
      <div className="border-b border-zinc-200 dark:border-zinc-800 px-8 py-4">
        <h1 className="text-lg font-semibold text-zinc-900 dark:text-white">Settings</h1>
      </div>
      <WorkspaceSettingsClient
        workspaceId={workspaceId}
        name={membership.workspace.name}
        role={membership.role}
      />
    </div>
  );
}
