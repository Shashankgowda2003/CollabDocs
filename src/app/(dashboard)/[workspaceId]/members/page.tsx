import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { hasMinRole, type Role } from "@/lib/types";
import { notFound } from "next/navigation";
import Link from "next/link";

interface Props { params: Promise<{ workspaceId: string }>; }

export default async function MembersPage({ params }: Props) {
  const { workspaceId } = await params;
  const session = await auth();
  if (!session?.user) notFound();

  const workspace = await db.workspace.findUnique({ where: { id: workspaceId } });
  if (!workspace) notFound();

  const members = await db.workspaceMember.findMany({
    where: { workspaceId },
    include: { user: { select: { id: true, name: true, email: true, image: true } } },
    orderBy: { joinedAt: "asc" },
  });

  const currentMember = members.find((m) => m.userId === session.user.id);
  if (!currentMember) notFound();

  const isAdmin = hasMinRole(currentMember.role as Role, "Admin");

  return (
    <div className="min-h-full bg-zinc-950">
      <div className="max-w-2xl mx-auto p-8">
        <Link href={`/${workspaceId}`} className="text-sm text-zinc-500 hover:text-zinc-300 transition-colors mb-4 inline-block">&larr; Back to Workspace</Link>
        <h1 className="text-2xl font-bold text-white mb-2">Members</h1>
        <p className="text-sm text-zinc-500 mb-8">{members.length} {members.length === 1 ? "member" : "members"} in {workspace.name}</p>

        <div className="space-y-2">
          {members.map((m) => (
            <div key={m.id} className="flex items-center gap-4 rounded-xl border border-zinc-800 bg-zinc-900/50 p-4">
              <div className="h-10 w-10 rounded-full bg-gradient-to-br from-blue-500/20 to-purple-500/20 flex items-center justify-center text-sm font-bold text-blue-400">
                {m.user.name?.[0]?.toUpperCase() || "?"}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-white">{m.user.name || "Unknown"}</p>
                <p className="text-xs text-zinc-500">{m.user.email}</p>
              </div>
              <div className="flex items-center gap-3">
                <span className={`text-[10px] font-medium px-2.5 py-1 rounded-full ${
                  m.role === "Owner" ? "bg-amber-500/10 text-amber-400 border border-amber-500/20" :
                  m.role === "Admin" ? "bg-purple-500/10 text-purple-400 border border-purple-500/20" :
                  "bg-zinc-800 text-zinc-400"
                }`}>{m.role}</span>
                {m.userId === session.user.id && <span className="text-[10px] text-zinc-600">You</span>}
              </div>
            </div>
          ))}
        </div>

        {members.length === 1 && (
          <div className="rounded-xl border border-dashed border-zinc-800 p-8 text-center mt-4">
            <p className="text-sm text-zinc-500">Invite members from the Share dialog on any document</p>
          </div>
        )}
      </div>
    </div>
  );
}
