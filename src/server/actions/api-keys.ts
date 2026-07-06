"use server";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";

export async function saveApiKey(provider: string, key: string) {
  const session = await auth();
  if (!session?.user) throw new Error("Unauthorized");

  const existing = await db.apiKey.findFirst({
    where: { userId: session.user.id, provider },
  });

  if (existing) {
    await db.apiKey.update({
      where: { id: existing.id },
      data: { key },
    });
  } else {
    await db.apiKey.create({
      data: {
        userId: session.user.id,
        provider,
        key,
      },
    });
  }

  revalidatePath("/dashboard");
}

export async function deleteApiKey(id: string) {
  const session = await auth();
  if (!session?.user) throw new Error("Unauthorized");

  const key = await db.apiKey.findUnique({ where: { id } });
  if (!key) throw new Error("API key not found");
  if (key.userId !== session.user.id) throw new Error("Not your key");

  await db.apiKey.delete({ where: { id } });
  revalidatePath("/dashboard");
}

export async function getApiKeys() {
  const session = await auth();
  if (!session?.user) throw new Error("Unauthorized");

  return db.apiKey.findMany({
    where: { userId: session.user.id },
    select: { id: true, provider: true, createdAt: true, updatedAt: true },
    orderBy: { createdAt: "desc" },
  });
}
