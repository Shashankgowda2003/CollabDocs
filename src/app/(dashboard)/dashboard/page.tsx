import { auth } from "@/lib/auth";
import { cachedGetUserWorkspaces } from "@/lib/permissions";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { DashboardClient } from "./dashboard-client";

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");
  const memberships = await cachedGetUserWorkspaces(session.user.id);

  const workspaces = memberships.map((m) => ({
    id: m.workspace.id,
    name: m.workspace.name,
    role: m.role,
    folders: m.workspace.folders.length,
    documents: m.workspace.documents.length,
    isNew: new Date(m.joinedAt).getTime() > Date.now() - 60 * 1000,
  }));

  let totalDocs = 0;
  let totalFolders = 0;
  for (const m of memberships) {
    totalDocs += m.workspace.documents.length;
    totalFolders += m.workspace.folders.length;
  }

  const pendingInvites = await db.pendingInvitation.findMany({
    where: { email: session.user.email!, used: false },
    orderBy: { createdAt: "desc" },
  });

  const workspaceIds = pendingInvites.map((inv) => inv.workspaceId);
  const inviteWorkspaces = workspaceIds.length > 0
    ? await db.workspace.findMany({ where: { id: { in: workspaceIds } }, select: { id: true, name: true } })
    : [];
  const workspaceMap = new Map(inviteWorkspaces.map((w) => [w.id, w]));

  return (
    <DashboardClient
      userName={session.user.name || "User"}
      workspaces={workspaces}
      totalDocs={totalDocs}
      totalFolders={totalFolders}
      pendingInvites={pendingInvites
        .map((inv) => {
          const ws = workspaceMap.get(inv.workspaceId);
          return ws ? { id: inv.id, workspaceId: inv.workspaceId, workspaceName: ws.name, role: inv.role } : null;
        })
        .filter((inv): inv is NonNullable<typeof inv> => inv !== null)}
    />
  );
}
