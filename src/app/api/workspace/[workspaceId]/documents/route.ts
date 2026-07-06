import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ workspaceId: string }> }
) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { workspaceId } = await params;
  const url = new URL(req.url);
  const q = url.searchParams.get("q") || "";

  const member = await db.workspaceMember.findUnique({
    where: { workspaceId_userId: { workspaceId, userId: session.user.id } },
  });
  if (!member) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const documents = await db.document.findMany({
    where: {
      workspaceId,
      deletedAt: null,
      title: q ? { contains: q } : undefined,
    },
    select: { id: true, title: true },
    orderBy: { title: "asc" },
    take: 10,
  });

  return NextResponse.json({ documents });
}
