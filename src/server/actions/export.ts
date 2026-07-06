"use server";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export async function exportDocument(documentId: string, format: "markdown" | "html") {
  const session = await auth();
  if (!session?.user) throw new Error("Unauthorized");

  const doc = await db.document.findUnique({
    where: { id: documentId },
    include: { blocks: { orderBy: { position: "asc" } } },
  });
  if (!doc) throw new Error("Document not found");

  if (format === "markdown") {
    let md = `# ${doc.title}\n\n`;
    for (const block of doc.blocks) {
      switch (block.type) {
        case "heading": md += `## ${block.content}\n\n`; break;
        case "code": md += "```\n" + block.content + "\n```\n\n"; break;
        case "quote": md += `> ${block.content}\n\n`; break;
        case "callout": md += `> **NOTE:** ${block.content}\n\n`; break;
        case "image": {
          try { const p = JSON.parse(block.content); md += `![${p.filename || "Image"}](${p.url})\n\n`; } catch { md += `${block.content}\n\n`; }
          break;
        }
        case "embed": {
          try { const p = JSON.parse(block.content); md += `**[File: ${p.filename || "Download"}](${p.url})**\n\n`; } catch { md += `${block.content}\n\n`; }
          break;
        }
        case "table": {
          try {
            const p = JSON.parse(block.content);
            const headers: string[] = p.headers || [];
            const rows: string[][] = p.rows || [];
            if (headers.length > 0) {
              md += "| " + headers.join(" | ") + " |\n";
              md += "| " + headers.map(() => "---").join(" | ") + " |\n";
              for (const row of rows) {
                md += "| " + row.map((c: string) => c || " ").join(" | ") + " |\n";
              }
              md += "\n";
            }
          } catch { md += `${block.content}\n\n`; }
          break;
        }
        case "checklist": {
          try {
            const p = JSON.parse(block.content);
            const items: { text: string; checked: boolean }[] = p.items || [];
            for (const item of items) {
              md += `- [${item.checked ? "x" : " "}] ${item.text}\n`;
            }
            md += "\n";
          } catch { md += `${block.content}\n\n`; }
          break;
        }
        case "equation": {
          md += `$${block.content}$\n\n`;
          break;
        }
        case "database": {
          try {
            const p = JSON.parse(block.content);
            const schema: { name: string }[] = p.schema || [];
            const rows: { cells: Record<string, unknown> }[] = p.rows || [];
            const colNames = schema.map((c) => c.name);
            if (colNames.length > 0 && rows.length > 0) {
              md += "| " + colNames.join(" | ") + " |\n";
              md += "| " + colNames.map(() => "---").join(" | ") + " |\n";
              for (const row of rows) {
                const vals = colNames.map((_, i) => {
                  const colId = schema[i] ? schema[i].name : "";
                  const cell = row.cells[colId];
                  return String(cell ?? " ");
                });
                md += "| " + vals.join(" | ") + " |\n";
              }
              md += "\n";
            }
          } catch { md += `${block.content}\n\n`; }
          break;
        }
        default: {
          const text = block.content || "";
          if (text.startsWith("{") || text.startsWith("[")) {
            md += text + "\n\n";
          } else {
            md += text + "\n\n";
          }
          break;
        }
      }
    }
    return { content: md, filename: `${doc.title}.md`, type: "text/markdown" };
  }

  let html = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>${doc.title}</title><style>body{font-family:system-ui,sans-serif;max-width:800px;margin:2rem auto;padding:0 1rem;line-height:1.7;color:#1a1a1a}h1{font-size:2rem}h2{font-size:1.5rem}pre{background:#f5f5f5;padding:1rem;border-radius:8px;overflow-x:auto;font-size:.9em}blockquote{border-left:3px solid #3b82f6;padding-left:1rem;color:#555;margin:1rem 0}.callout{background:#eff6ff;border:1px solid #bfdbfe;border-radius:8px;padding:1rem}img{max-width:100%;border-radius:8px}table{border-collapse:collapse;width:100%}td,th{border:1px solid #ddd;padding:6px 10px;font-size:.9em}th{background:#f5f5f5}ul.checklist{list-style:none;padding-left:0}ul.checklist li::before{content:'☐';margin-right:8px}ul.checklist li.checked::before{content:'☑';color:#22c55e}</style></head><body>`;
  html += `<h1>${doc.title}</h1>`;
  for (const block of doc.blocks) {
    switch (block.type) {
      case "heading": html += `<h2>${block.content}</h2>`; break;
      case "code": html += `<pre><code>${escapeHtml(block.content)}</code></pre>`; break;
      case "quote": html += `<blockquote>${block.content}</blockquote>`; break;
      case "callout": html += `<div class="callout">${block.content}</div>`; break;
      case "image": {
        try { const p = JSON.parse(block.content); html += `<img src="${p.url}" alt="${p.filename || "Image"}">`; } catch { html += `<p>${block.content}</p>`; }
        break;
      }
      case "embed": {
        try { const p = JSON.parse(block.content); html += `<p><a href="${p.url}" download>Download: ${p.filename || "File"}</a></p>`; } catch { html += `<p>${block.content}</p>`; }
        break;
      }
      case "table": {
        try {
          const p = JSON.parse(block.content);
          const headers: string[] = p.headers || [];
          const rows: string[][] = p.rows || [];
          html += "<table><thead><tr>";
          for (const h of headers) html += `<th>${escapeHtml(h)}</th>`;
          html += "</tr></thead><tbody>";
          for (const row of rows) {
            html += "<tr>";
            for (const cell of row) html += `<td>${escapeHtml(cell)}</td>`;
            html += "</tr>";
          }
          html += "</tbody></table>";
        } catch { html += `<p>${block.content}</p>`; }
        break;
      }
      case "checklist": {
        try {
          const p = JSON.parse(block.content);
          const items: { text: string; checked: boolean }[] = p.items || [];
          html += '<ul class="checklist">';
          for (const item of items) {
            html += `<li class="${item.checked ? "checked" : ""}">${escapeHtml(item.text)}</li>`;
          }
          html += "</ul>";
        } catch { html += `<p>${block.content}</p>`; }
        break;
      }
      case "equation": {
        html += `<p style="text-align:center;font-family:monospace;font-size:1.1em">${escapeHtml(block.content)}</p>`;
        break;
      }
      case "database": {
        try {
          const p = JSON.parse(block.content);
          const schema: { name: string }[] = p.schema || [];
          const rows: { cells: Record<string, unknown> }[] = p.rows || [];
          if (schema.length > 0 && rows.length > 0) {
            html += "<table><thead><tr>";
            for (const col of schema) html += `<th>${escapeHtml(col.name)}</th>`;
            html += "</tr></thead><tbody>";
            for (const row of rows) {
              html += "<tr>";
              for (const col of schema) {
                html += `<td>${escapeHtml(String(row.cells[col.name] ?? ""))}</td>`;
              }
              html += "</tr>";
            }
            html += "</tbody></table>";
          }
        } catch { html += `<p>${block.content}</p>`; }
        break;
      }
      default: html += `<p>${escapeHtml(block.content) || "&nbsp;"}</p>`; break;
    }
  }
  html += "</body></html>";
  return { content: html, filename: `${doc.title}.html`, type: "text/html" };
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
