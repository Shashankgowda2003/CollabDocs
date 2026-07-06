import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getWorkspaceGraph } from "@/server/actions/backlinks-server";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ workspaceId: string }> }
) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { workspaceId } = await params;

  try {
    const data = await getWorkspaceGraph(workspaceId);
    return NextResponse.json(data);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Graph load failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
