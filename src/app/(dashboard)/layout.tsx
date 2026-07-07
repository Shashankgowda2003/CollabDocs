import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { DashboardSidebar } from "@/components/sidebar/dashboard-sidebar";
import { MobileSidebar } from "@/components/sidebar/mobile-sidebar";
import { ErrorBoundary } from "@/components/error-boundary";
import { CommandPalette } from "@/components/command-palette";
import { KeyboardShortcutsDialog } from "@/components/keyboard-shortcuts-dialog";
import { DocumentTour } from "@/components/document-tour";
import { WorkspaceCallWrapper } from "@/components/workspace-call-wrapper";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  return (
    <div className="flex h-screen overflow-hidden bg-white dark:bg-zinc-950">
      <div className="hidden lg:block"><DashboardSidebar /></div>
      <MobileSidebar />
      <main className="flex-1 overflow-auto bg-white dark:bg-zinc-950">
        <ErrorBoundary>{children}</ErrorBoundary>
      </main>
      <CommandPalette />
      <KeyboardShortcutsDialog />
      <DocumentTour />
      <WorkspaceCallWrapper userName={session.user.name || "User"} />
    </div>
  );
}
