"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { useState } from "react";
import { createWorkspace } from "@/server/actions/workspace";
import { AcceptInviteButton } from "./accept-invite-button";

interface WorkspaceInfo {
  id: string;
  name: string;
  role: string;
  folders: number;
  documents: number;
  isNew: boolean;
}

interface PendingInvite {
  id: string;
  workspaceId: string;
  workspaceName: string;
  role: string;
}

interface Props {
  userName: string;
  workspaces: WorkspaceInfo[];
  totalDocs: number;
  totalFolders: number;
  pendingInvites: PendingInvite[];
}

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.08, delayChildren: 0.1 },
  },
};

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 },
};

export function DashboardClient({ userName, workspaces, totalDocs, totalFolders, pendingInvites }: Props) {
  const [workspaceName, setWorkspaceName] = useState("");

  return (
    <div className="min-h-full bg-white dark:bg-zinc-950">
      {/* Background decorative blobs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div
          animate={{ scale: [1, 1.05, 1], opacity: [0.03, 0.05, 0.03] }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
          className="absolute -top-40 -right-40 w-96 h-96 rounded-full bg-blue-500 blur-3xl"
        />
        <motion.div
          animate={{ scale: [1, 1.08, 1], opacity: [0.02, 0.04, 0.02] }}
          transition={{ duration: 10, repeat: Infinity, ease: "easeInOut", delay: 2 }}
          className="absolute -bottom-32 -left-32 w-80 h-80 rounded-full bg-purple-500 blur-3xl"
        />
      </div>

      <div className="relative max-w-4xl mx-auto p-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-10"
        >
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-white">
            Welcome back, {userName.split(" ")[0] || "User"}
          </h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1.5">
            {new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}
          </p>
        </motion.div>

        {/* Stats bar */}
        {workspaces.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.15 }}
            className="grid grid-cols-3 gap-3 mb-10"
          >
            {[
              { label: "Workspaces", value: workspaces.length, icon: (
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z" /></svg>
              ) },
              { label: "Documents", value: totalDocs, icon: (
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" /></svg>
              ) },
              { label: "Folders", value: totalFolders, icon: (
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12.75V12A2.25 2.25 0 014.5 9.75h15A2.25 2.25 0 0121.75 12v.75m-8.69-6.44l-2.12-2.12a1.5 1.5 0 00-1.061-.44H4.5A2.25 2.25 0 002.25 6v12a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9a2.25 2.25 0 00-2.25-2.25h-5.379a1.5 1.5 0 01-1.06-.44z" /></svg>
              ) },
            ].map((stat, i) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.2 + i * 0.08 }}
                className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/50 p-4 flex items-center gap-3"
              >
                <div className="h-9 w-9 rounded-xl bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-zinc-400 dark:text-zinc-500">
                  {stat.icon}
                </div>
                <div>
                  <p className="text-lg font-bold text-zinc-900 dark:text-white tabular-nums">{stat.value}</p>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400">{stat.label}</p>
                </div>
              </motion.div>
            ))}
          </motion.div>
        )}

        {/* Workspaces section */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.4, delay: 0.25 }}
        >
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-lg font-semibold text-zinc-900 dark:text-white">Your Workspaces</h2>
            <form action={createWorkspace} className="flex items-center gap-2.5">
              <input
                name="name"
                type="text"
                required
                value={workspaceName}
                onChange={(e) => setWorkspaceName(e.target.value)}
                placeholder="Workspace name"
                className="h-10 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-4 text-sm text-zinc-900 dark:text-white placeholder:text-zinc-400 dark:placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-transparent transition-all"
              />
              <button className="h-10 rounded-xl bg-gradient-to-r from-blue-500 to-purple-600 px-5 text-sm font-semibold text-white hover:from-blue-600 hover:to-purple-700 transition-all shadow-lg shadow-purple-500/20">
                Create
              </button>
            </form>
          </div>

          {workspaces.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="rounded-3xl border border-dashed border-zinc-300 dark:border-zinc-800 p-16 text-center"
            >
              <motion.div
                animate={{ y: [0, -6, 0] }}
                transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                className="h-16 w-16 rounded-2xl bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-500/5 dark:to-purple-500/5 border border-blue-100 dark:border-blue-500/10 flex items-center justify-center mx-auto mb-5"
              >
                <svg className="h-8 w-8 text-blue-400 dark:text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                </svg>
              </motion.div>
              <h3 className="text-base font-semibold text-zinc-700 dark:text-zinc-300 mb-2">No workspaces yet</h3>
              <p className="text-sm text-zinc-500 max-w-sm mx-auto leading-relaxed">
                Create a workspace to organize your documents, collaborate with your team, and start building together.
              </p>
            </motion.div>
          ) : (
            <motion.div variants={container} initial="hidden" animate="show" className="grid gap-3 sm:grid-cols-2">
              {workspaces.map((ws) => (
                <motion.div key={ws.id} variants={item} whileHover={{ scale: 1.01, y: -1 }} whileTap={{ scale: 0.99 }}>
                  <Link
                    href={`/${ws.id}`}
                    className="group flex items-center gap-4 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/50 p-5 hover:border-zinc-300 dark:hover:border-zinc-700 hover:shadow-md dark:hover:bg-zinc-900 transition-all duration-200"
                  >
                    <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-blue-500/15 to-purple-500/15 flex items-center justify-center text-sm font-bold text-blue-500 dark:text-blue-400 shrink-0">
                      {ws.name[0].toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-zinc-900 dark:text-white text-sm truncate">{ws.name}</h3>
                        {ws.isNew && (
                          <span className="text-[10px] font-medium text-blue-500 bg-blue-50 dark:bg-blue-500/10 px-1.5 py-0.5 rounded-full animate-pulse">New</span>
                        )}
                      </div>
                      <p className="text-xs text-zinc-500 mt-0.5">{ws.folders} folders &middot; {ws.documents} docs</p>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-[10px] font-medium text-zinc-500 dark:text-zinc-400 bg-zinc-100 dark:bg-zinc-800 px-2 py-1 rounded-lg">{ws.role}</span>
                      <motion.svg
                        className="h-3.5 w-3.5 text-zinc-300 dark:text-zinc-600 group-hover:text-zinc-500 dark:group-hover:text-zinc-400 transition-colors"
                        fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
                        animate={{ x: [0, 2, 0] }}
                        transition={{ duration: 1.5, repeat: Infinity }}
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                      </motion.svg>
                    </div>
                  </Link>
                </motion.div>
              ))}
            </motion.div>
          )}
        </motion.div>

        {/* Pending Invitations */}
        {pendingInvites.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.4 }}
            className="mt-10"
          >
            <h2 className="text-lg font-semibold text-zinc-900 dark:text-white mb-4">Pending Invitations</h2>
            <div className="space-y-2">
              {pendingInvites.map((inv, i) => (
                <motion.div
                  key={inv.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3, delay: 0.1 * i }}
                  className="flex items-center gap-4 rounded-xl border border-amber-200 dark:border-amber-500/20 bg-amber-50 dark:bg-amber-500/5 p-4"
                >
                  <div className="h-10 w-10 rounded-xl bg-amber-100 dark:bg-amber-500/10 flex items-center justify-center text-sm font-bold text-amber-600 dark:text-amber-400">
                    {inv.workspaceName[0].toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-zinc-900 dark:text-white">{inv.workspaceName}</p>
                    <p className="text-xs text-zinc-500">Invited as {inv.role}</p>
                  </div>
                  <AcceptInviteButton invitationId={inv.id} workspaceId={inv.workspaceId} />
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Footer */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.5 }}
          className="mt-12 pt-6 border-t border-zinc-100 dark:border-zinc-800 text-center"
        >
          <p className="text-xs text-zinc-400 dark:text-zinc-500">
            &copy; {new Date().getFullYear()} CollabDocs — Built for teams that ship together
          </p>
        </motion.div>
      </div>
    </div>
  );
}
