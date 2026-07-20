"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { signOut } from "next-auth/react";
import { SearchBar } from "@/components/search/search-bar";
import { NotificationBell } from "@/components/notifications/notification-bell";
import { FavoritesList } from "@/components/sidebar/favorites-list";
import { useTheme } from "@/lib/theme-context";
import { updateProfile } from "@/server/actions/profile";

interface Props {
  userName?: string;
  userEmail?: string;
  userImage?: string;
}

export function DashboardSidebar({ userName = "User", userEmail = "", userImage }: Props) {
  const pathname = usePathname();
  const router = useRouter();
  const { theme, toggleTheme } = useTheme();
  const [showSignOut, setShowSignOut] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [editName, setEditName] = useState(userName);
  const [saving, setSaving] = useState(false);

  async function handleSignOut() {
    await signOut({ redirect: false });
    router.push("/login");
  }

  async function handleSaveProfile(e: React.FormEvent) {
    e.preventDefault();
    if (!editName.trim() || editName === userName) return;
    setSaving(true);
    const fd = new FormData();
    fd.append("name", editName);
    try {
      await updateProfile(fd);
      setShowProfile(false);
      router.refresh();
    } catch {
      // ignore
    } finally {
      setSaving(false);
    }
  }

  return (
    <aside className="w-60 border-r border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 flex flex-col shrink-0 h-full">
      <div className="p-4 border-b border-zinc-200 dark:border-zinc-800 space-y-3">
        <Link href="/dashboard" className="flex items-center gap-2.5">
          <div className="h-8 w-8 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-sm font-bold shadow-lg shadow-purple-500/20">C</div>
          <span className="font-bold text-zinc-900 dark:text-white text-sm tracking-tight">CollabDocs</span>
        </Link>
        <SearchBar />
      </div>

      <nav className="flex-1 p-3 space-y-1">
        <Link href="/dashboard"
          className={`flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm transition-all ${
            pathname === "/dashboard"
              ? "bg-zinc-200 dark:bg-zinc-800 text-zinc-900 dark:text-white font-medium"
              : "text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-900"
          }`}>
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>
          Home
        </Link>
        {pathname.includes("/") && pathname.split("/").length >= 2 && pathname.split("/")[1] !== "dashboard" && (
          <Link href={`/${pathname.split("/")[1]}/trash`}
            className={`flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm transition-all ${
              pathname.includes("/trash")
                ? "bg-zinc-200 dark:bg-zinc-800 text-zinc-900 dark:text-white font-medium"
                : "text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-900"
            }`}>
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" /></svg>
            Trash
          </Link>
        )}
      </nav>

      <FavoritesList workspaceId={pathname.split("/")[1] || ""} />

      <div className="p-3 border-t border-zinc-200 dark:border-zinc-800">
        <button
          onClick={() => setShowProfile(true)}
          className="flex items-center gap-2.5 w-full rounded-xl p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-all"
          title="Edit profile"
        >
          <div className="h-7 w-7 rounded-full bg-gradient-to-br from-zinc-400 to-zinc-600 flex items-center justify-center text-white text-xs font-medium shrink-0 overflow-hidden">
            {userImage ? (
              <img src={userImage} alt={userName} className="h-full w-full object-cover" />
            ) : (
              userName.charAt(0).toUpperCase()
            )}
          </div>
          <div className="text-left min-w-0">
            <p className="text-xs font-medium text-zinc-700 dark:text-zinc-300 truncate">{userName}</p>
            <p className="text-[10px] text-zinc-400 dark:text-zinc-500 truncate">{userEmail}</p>
          </div>
        </button>
      </div>

      <div className="p-3 border-t border-zinc-200 dark:border-zinc-800 flex items-center justify-between">
        <NotificationBell />
        <button onClick={toggleTheme} className="rounded-xl p-2 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-all" title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}>
          {theme === 'dark' ? (
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 3v2.25m6.364.386l-1.591 1.591M21 12h-2.25m-.386 6.364l-1.591-1.591M12 18.75V21m-4.773-4.227l-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0z" /></svg>
          ) : (
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M21.752 15.002A9.718 9.718 0 0118 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 003 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 009.002-5.998z" /></svg>
          )}
        </button>
        <button onClick={() => setShowSignOut(true)} className="text-xs text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 transition-colors">Sign Out</button>
      </div>

      {showSignOut && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm" onClick={() => setShowSignOut(false)}>
          <div className="w-full max-w-sm rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-6 shadow-xl" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-sm font-semibold text-zinc-900 dark:text-white mb-2">Sign out of CollabDocs?</h3>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mb-4">Any unsaved changes may be lost.</p>
            <div className="flex items-center gap-2">
              <button onClick={handleSignOut} className="rounded-xl bg-red-500 px-4 py-2 text-xs font-semibold text-white hover:bg-red-600 transition-all">Sign Out</button>
              <button onClick={() => setShowSignOut(false)} className="rounded-xl border border-zinc-300 dark:border-zinc-700 px-4 py-2 text-xs font-medium text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-all">Cancel</button>
            </div>
          </div>
        </div>
      )}

      {showProfile && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm" onClick={() => setShowProfile(false)}>
          <div className="w-full max-w-sm rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-6 shadow-xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center gap-3 mb-4">
              <div className="h-10 w-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-sm font-bold shrink-0 overflow-hidden">
                {userImage ? (
                  <img src={userImage} alt={userName} className="h-full w-full object-cover" />
                ) : (
                  userName.charAt(0).toUpperCase()
                )}
              </div>
              <div>
                <h3 className="text-sm font-semibold text-zinc-900 dark:text-white">Edit Profile</h3>
                <p className="text-xs text-zinc-500 dark:text-zinc-400">Update your display name</p>
              </div>
            </div>
            <form onSubmit={handleSaveProfile} className="space-y-3">
              <div>
                <label className="text-xs text-zinc-500 block mb-1">Name</label>
                <input
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full rounded-xl border border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 p-2.5 text-sm text-zinc-900 dark:text-white placeholder:text-zinc-400 outline-none focus:ring-2 focus:ring-blue-500/30"
                  placeholder="Your name"
                  autoFocus
                />
              </div>
              <div>
                <label className="text-xs text-zinc-500 block mb-1">Email</label>
                <input
                  value={userEmail}
                  disabled
                  className="w-full rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-100 dark:bg-zinc-800/50 p-2.5 text-sm text-zinc-500 dark:text-zinc-500 cursor-not-allowed"
                />
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="submit"
                  disabled={saving || !editName.trim() || editName === userName}
                  className="rounded-xl bg-gradient-to-r from-blue-500 to-purple-600 px-4 py-2 text-xs font-semibold text-white hover:from-blue-600 hover:to-purple-700 disabled:opacity-50 transition-all"
                >
                  {saving ? "Saving..." : "Save"}
                </button>
                <button
                  type="button"
                  onClick={() => { setShowProfile(false); setEditName(userName); }}
                  className="rounded-xl border border-zinc-300 dark:border-zinc-700 px-4 py-2 text-xs font-medium text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-all"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </aside>
  );
}
