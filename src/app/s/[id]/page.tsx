import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { checkPermission } from "@/lib/permissions";
import { redirect } from "next/navigation";
import Link from "next/link";

interface Props {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export default async function ShareLinkPage({ params, searchParams }: Props) {
  const { id } = await params;
  const sp = await searchParams;
  const password = typeof sp.password === "string" ? sp.password : undefined;

  const link = await db.shareLink.findUnique({ where: { id } });

  if (!link || link.isRevoked) {
    return <ErrorView message="This link is no longer valid." />;
  }

  if (link.expiresAt && link.expiresAt < new Date()) {
    return <ErrorView message="This share link has expired." />;
  }

  if (link.password && link.password !== (password || "")) {
    return <PasswordView linkId={id} />;
  }

  const doc = await db.document.findUnique({
    where: { id: link.documentId, deletedAt: null },
    select: { workspaceId: true, id: true },
  });

  if (!doc) {
    return <ErrorView message="This document has been deleted." />;
  }

  const session = await auth();
  if (!session?.user) {
    redirect(`/login?callbackUrl=${encodeURIComponent(`/s/${id}`)}`);
  }

  if (link.workspaceMemberOnly) {
    const member = await db.workspaceMember.findUnique({
      where: {
        workspaceId_userId: { workspaceId: doc.workspaceId, userId: session.user.id },
      },
    });
    if (!member) {
      return <ErrorView message="This link is only accessible to workspace members." />;
    }
  }

  const hasPerm = await checkPermission({
    userId: session.user.id,
    resourceType: "Document",
    resourceId: doc.id,
    requiredRole: "Viewer",
  });

  if (!hasPerm) {
    await db.permission.create({
      data: {
        userId: session.user.id,
        resourceType: "Document",
        resourceId: doc.id,
        role: link.role,
      },
    });
  }

  redirect(`/${doc.workspaceId}/d/${doc.id}`);
}

function ErrorView({ message }: { message: string }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-950">
      <div className="text-center">
        <svg className="mx-auto h-10 w-10 text-zinc-500 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
        </svg>
        <p className="text-sm text-zinc-400">{message}</p>
        <Link href="/dashboard" className="mt-4 inline-block rounded-xl bg-zinc-800 px-5 py-2 text-sm font-medium text-white hover:bg-zinc-700 transition-all">
          Go to Dashboard
        </Link>
      </div>
    </div>
  );
}

function PasswordView({ linkId }: { linkId: string }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-950">
      <div className="w-full max-w-sm rounded-2xl border border-zinc-800 bg-zinc-900 p-6">
        <h2 className="text-sm font-semibold text-white mb-3">This document is password-protected</h2>
        <form action={`/s/${linkId}`} method="GET" className="space-y-3">
          <input name="password" type="password" placeholder="Enter password" className="w-full rounded-xl border border-zinc-700 bg-zinc-800 p-2.5 text-sm text-white placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50" autoFocus />
          <button className="w-full rounded-xl bg-white px-4 py-2.5 text-sm font-semibold text-zinc-900 hover:bg-zinc-100 transition-all">Unlock</button>
        </form>
      </div>
    </div>
  );
}
