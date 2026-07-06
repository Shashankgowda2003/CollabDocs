import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import bcrypt from "bcryptjs";

export async function POST(req: Request) {
  try {
    const { name, email, password, inviteToken } = await req.json();

    if (!email || !password || password.length < 8) {
      return NextResponse.json(
        { error: "Email and password (min 8 chars) are required" },
        { status: 400 }
      );
    }

    const existing = await db.user.findUnique({ where: { email } });
    if (existing) {
      return NextResponse.json(
        { error: "An account with this email already exists" },
        { status: 409 }
      );
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    const user = await db.user.create({
      data: {
        name: name || email.split("@")[0],
        email,
      },
    });

    await db.account.create({
      data: {
        userId: user.id,
        type: "credentials",
        provider: "credentials",
        providerAccountId: user.id,
        access_token: hashedPassword,
      },
    });

    if (inviteToken) {
      const invitation = await db.pendingInvitation.findUnique({
        where: { token: inviteToken },
      });

      if (invitation && !invitation.used && invitation.expiresAt > new Date()) {
        await db.$transaction([
          db.permission.create({
            data: {
              userId: user.id,
              resourceType: "Document",
              resourceId: invitation.documentId,
              role: invitation.role,
            },
          }),
          db.pendingInvitation.update({
            where: { id: invitation.id },
            data: { used: true },
          }),
        ]);
      }
    }

    return NextResponse.json({ success: true }, { status: 201 });
  } catch {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
