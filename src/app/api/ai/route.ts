import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import {
  aiSummarize,
  aiRewrite,
  aiGenerate,
  aiAnswer,
  aiExtractActionItems,
  getUserAiUsage,
} from "@/lib/ai";

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { action, content, instruction, question, workspaceId } = await req.json();
    const userId = session.user.id;

    switch (action) {
      case "summarize":
        return NextResponse.json({
          result: await aiSummarize(userId, workspaceId, content),
        });

      case "rewrite":
        return NextResponse.json({
          result: await aiRewrite(userId, workspaceId, content, instruction || "Improve the writing"),
        });

      case "generate":
        return NextResponse.json({
          result: await aiGenerate(userId, workspaceId, content),
        });

      case "answer":
        return NextResponse.json({
          result: await aiAnswer(userId, workspaceId, question, content),
        });

      case "action-items":
        return NextResponse.json({
          result: await aiExtractActionItems(userId, workspaceId, content),
        });

      default:
        return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : "AI request failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function GET() {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const usage = await getUserAiUsage(session.user.id);
  const total = usage.reduce((sum, u) => sum + u.tokens, 0);
  const thisMonth = usage.filter(
    (u) => u.createdAt > new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
  ).length;

  return NextResponse.json({
    usage,
    totalTokens: total,
    requestsThisMonth: thisMonth,
    limit: 1000,
  });
}
