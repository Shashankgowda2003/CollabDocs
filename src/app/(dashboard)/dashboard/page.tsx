import { auth } from "@/lib/auth";
import { cachedGetUserWorkspaces } from "@/lib/permissions";
import { createWorkspace } from "@/server/actions/workspace";
import { redirect } from "next/navigation";
import Link from "next/link";

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");
  const memberships = await cachedGetUserWorkspaces(session.user.id);

  return (
    <div className="min-h-full bg-white dark:bg-zinc-950">
      <div className="max-w-4xl mx-auto p-8">
        <div className="flex items-center justify-between mb-10">
          <div>
            <h1 className="text-2xl font-bold text-zinc-900 dark:text-white">Welcome back</h1>
            <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">{session.user.email}</p>
          </div>
        </div>

        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold text-zinc-900 dark:text-white">Your Workspaces</h2>
          <form action={createWorkspace} className="flex items-center gap-2.5">
            <input name="name" type="text" required placeholder="Workspace name"
              className="h-10 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-4 text-sm text-zinc-900 dark:text-white placeholder:text-zinc-400 dark:placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-transparent transition-all" />
            <button className="h-10 rounded-xl bg-gradient-to-r from-blue-500 to-purple-600 px-5 text-sm font-semibold text-white hover:from-blue-600 hover:to-purple-700 transition-all shadow-lg shadow-purple-500/20">Create</button>
          </form>
        </div>

        {memberships.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-zinc-300 dark:border-zinc-800 p-16 text-center">
            <div className="h-14 w-14 rounded-2xl bg-zinc-100 dark:bg-zinc-800/50 flex items-center justify-center mx-auto mb-4">
              <svg className="h-7 w-7 text-zinc-400 dark:text-zinc-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" /></svg>
            </div>
            <h3 className="text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">No workspaces yet</h3>
            <p className="text-sm text-zinc-500">Create your first workspace using the form above</p>
          </div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            {memberships.map((m) => (
              <Link key={m.workspaceId} href={`/${m.workspace.id}`}
                className="group flex items-center gap-4 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/50 p-5 hover:border-zinc-300 dark:hover:border-zinc-700 hover:shadow-sm dark:hover:bg-zinc-900 transition-all">
                <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-blue-500/20 to-purple-500/20 flex items-center justify-center text-sm font-bold text-blue-500 dark:text-blue-400">
                  {m.workspace.name[0].toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-zinc-900 dark:text-white text-sm truncate">{m.workspace.name}</h3>
                  <p className="text-xs text-zinc-500 mt-0.5">{m.workspace.folders.length} folders &middot; {m.workspace.documents.length} docs</p>
                </div>
                <span className="text-[10px] font-medium text-zinc-500 dark:text-zinc-400 bg-zinc-100 dark:bg-zinc-800 px-2 py-1 rounded-lg">{m.role}</span>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
