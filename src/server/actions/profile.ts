"use server";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";

export async function updateProfile(formData: FormData) {
  const session = await auth();
  if (!session?.user) throw new Error("Unauthorized");

  const name = formData.get("name") as string;
  if (!name?.trim()) throw new Error("Name is required");

  await db.user.update({
    where: { id: session.user.id },
    data: { name: name.trim() },
  });

  revalidatePath("/", "layout");
  return { success: true };
}
