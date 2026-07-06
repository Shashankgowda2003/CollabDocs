import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { searchContent } from "@/lib/search";

export async function GET(req: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const url = new URL(req.url);
  const query = url.searchParams.get("q") || "";
  const type = url.searchParams.get("type") || undefined;
  const workspaceId = url.searchParams.get("workspaceId") || undefined;
  const tag = url.searchParams.get("tag") || undefined;

  if (!query.trim()) {
    return NextResponse.json({ hits: [] });
  }

  const memberships = await db.workspaceMember.findMany({
    where: { userId: session.user.id },
    select: { workspaceId: true },
  });

  const accessibleIds = memberships.map((m) => m.workspaceId);

  try {
    const results = await searchContent(query, accessibleIds, {
      type,
      workspaceId,
      tag,
    });

    return NextResponse.json(results);
  } catch (error) {
    console.error("Search error:", error);
    return NextResponse.json(
      { error: "Search unavailable", hits: [] },
      { status: 200 }
    );
  }
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { action, documentId } = await req.json();

  if (action === "reindex") {
    try {
      const doc = await db.document.findUnique({
        where: { id: documentId },
        include: {
          workspace: { select: { name: true } },
          author: { select: { id: true, name: true } },
          blocks: { select: { id: true, content: true } },
          documentTags: { include: { tag: true } },
        },
      });

      if (!doc) {
        return NextResponse.json({ error: "Document not found" }, { status: 404 });
      }

      const { indexDocument } = await import("@/lib/search");
      await indexDocument({
        id: doc.id,
        title: doc.title,
        workspaceId: doc.workspaceId,
        workspaceName: doc.workspace.name,
        folderId: doc.folderId,
        authorId: doc.authorId,
        authorName: doc.author.name || "Unknown",
        tags: doc.documentTags.map((dt) => dt.tag.name),
        blocks: doc.blocks,
        updatedAt: doc.updatedAt,
      });

      return NextResponse.json({ success: true });
    } catch (error) {
      console.error("Reindex error:", error);
      return NextResponse.json({ error: "Reindex failed" }, { status: 500 });
    }
  }

  return NextResponse.json({ error: "Invalid action" }, { status: 400 });
}
