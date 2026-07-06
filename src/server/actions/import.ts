"use server";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export async function importMarkdown(workspaceId: string, markdown: string, title?: string) {
  const session = await auth();
  if (!session?.user) throw new Error("Unauthorized");

  const lines = markdown.split("\n");
  const blocks: Array<{ type: string; content: string; position: number }> = [];

  let i = 0;
  let position = 0;

  while (i < lines.length) {
    const line = lines[i]!;

    if (line.startsWith("```")) {
      const codeLines: string[] = [];
      i++;
      while (i < lines.length && !lines[i]!.startsWith("```")) {
        codeLines.push(lines[i]!);
        i++;
      }
      i++; // skip closing ```
      blocks.push({ type: "code", content: codeLines.join("\n"), position: position++ });
    } else if (line.startsWith("### ")) {
      blocks.push({ type: "heading", content: line.slice(4), position: position++ });
      i++;
    } else if (line.startsWith("## ")) {
      blocks.push({ type: "heading", content: line.slice(3), position: position++ });
      i++;
    } else if (line.startsWith("# ")) {
      blocks.push({ type: "heading", content: line.slice(2), position: position++ });
      i++;
    } else if (line.startsWith("> ")) {
      blocks.push({ type: "quote", content: line.slice(2), position: position++ });
      i++;
    } else if (line.startsWith("![") && line.includes("](")) {
      const alt = line.slice(2, line.indexOf("]"));
      const url = line.slice(line.indexOf("(") + 1, line.lastIndexOf(")"));
      blocks.push({ type: "image", content: JSON.stringify({ url, filename: alt }), position: position++ });
      i++;
    } else if (line.trim() === "") {
      i++;
    } else {
      let content = line;
      i++;
      while (i < lines.length && lines[i]!.trim() !== "" && !lines[i]!.startsWith("#") && !lines[i]!.startsWith(">") && !lines[i]!.startsWith("```") && !lines[i]!.startsWith("![")) {
        content += "\n" + lines[i]!;
        i++;
      }
      blocks.push({ type: "paragraph", content, position: position++ });
    }
  }

  const docTitle = title || lines.find((l) => l.startsWith("# "))?.slice(2) || "Imported Document";

  const doc = await db.document.create({
    data: {
      title: docTitle,
      workspaceId,
      authorId: session.user.id,
      blocks: { create: blocks },
    },
  });

  return doc.id;
}
