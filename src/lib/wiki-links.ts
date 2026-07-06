const WIKILINK_REGEX = /\[\[([^\]]+)\]\]/g;

export function extractWikiLinks(content: string): string[] {
  const matches: string[] = [];
  let m;
  while ((m = WIKILINK_REGEX.exec(content)) !== null) {
    matches.push(m[1].trim());
  }
  return Array.from(new Set(matches));
}
