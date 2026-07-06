export function estimateReadingTime(content: string): string {
  const words = content.trim().split(/\s+/).filter(Boolean).length;
  const minutes = Math.max(1, Math.ceil(words / 200));
  return `${minutes} min read`;
}

export function estimateReadingTimeShort(content: string): string {
  const words = content.trim().split(/\s+/).filter(Boolean).length;
  const minutes = Math.max(1, Math.round(words / 200));
  return `${minutes}m`;
}

export function getDocumentContentText(blocks: { content: string }[]): string {
  return blocks.map((b) => {
    try {
      const p = JSON.parse(b.content);
      if (typeof p === "string") return p;
      return p.text ?? p.content ?? p.diagram ?? p.title ?? "";
    } catch {
      return b.content;
    }
  }).join(" ");
}
