import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const token = url.searchParams.get("token");
  if (!token) return NextResponse.json({ valid: false });

  const invitation = await db.pendingInvitation.findUnique({
    where: { token },
    include: { document: { select: { title: true } } },
  });

  if (!invitation || invitation.used || invitation.expiresAt < new Date()) {
    return NextResponse.json({ valid: false });
  }

  return NextResponse.json({
    valid: true,
    email: invitation.email,
    role: invitation.role,
    documentTitle: invitation.document.title,
  });
}
