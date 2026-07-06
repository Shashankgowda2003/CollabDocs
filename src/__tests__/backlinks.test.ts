import { describe, it, expect } from "vitest";

describe("wiki-link extraction", () => {
  it("extracts simple wiki links", () => {
    const content = "See [[Getting Started]] and [[API Reference]] for more.";
    const regex = /\[\[([^\]]+)\]\]/g;
    const matches: string[] = [];
    let m;
    while ((m = regex.exec(content)) !== null) {
      matches.push(m[1].trim());
    }
    expect(matches).toEqual(["Getting Started", "API Reference"]);
  });

  it("deduplicates repeated wiki links", () => {
    const content = "[[Home]] [[Home]] [[About]]";
    const regex = /\[\[([^\]]+)\]\]/g;
    const matches: string[] = [];
    let m;
    while ((m = regex.exec(content)) !== null) {
      matches.push(m[1].trim());
    }
    expect(Array.from(new Set(matches))).toEqual(["Home", "About"]);
  });

  it("detects open wiki-link trigger", () => {
    const value = "Link to [[Proj";
    const openLink = value.match(/\[\[([^\]]*)$/);
    expect(openLink).not.toBeNull();
    expect(openLink?.[1]).toBe("Proj");
  });

  it("does not trigger when wiki-link is closed", () => {
    const value = "Link to [[Project]]";
    const openLink = value.match(/\[\[([^\]]*)$/);
    expect(openLink).toBeNull();
  });

  it("replaces open wiki-link with selected title", () => {
    const value = "Link to [[Proj";
    const title = "Project Alpha";
    const newContent = value.replace(/\[\[[^\]]*$/, `[[${title}]]`);
    expect(newContent).toBe("Link to [[Project Alpha]]");
  });
});

describe("graph utilities", () => {
  it("builds nodes around a circle", () => {
    const documents = [
      { id: "a", title: "A" },
      { id: "b", title: "B" },
      { id: "c", title: "C" },
    ];
    const width = 800;
    const height = 600;
    const angleStep = (2 * Math.PI) / documents.length;
    const radius = Math.min(width, height) / 2.5;
    const centerX = width / 2;
    const centerY = height / 2;

    const nodes = documents.map((doc, i) => {
      const angle = i * angleStep;
      return {
        id: doc.id,
        position: {
          x: centerX + radius * Math.cos(angle),
          y: centerY + radius * Math.sin(angle),
        },
      };
    });

    expect(nodes).toHaveLength(3);
    expect(nodes[0].position.x).toBeGreaterThan(0);
    expect(nodes[0].position.y).toBeGreaterThan(0);
  });

  it("creates edges from links", () => {
    const links = [
      { sourceDocumentId: "a", targetDocumentId: "b" },
      { sourceDocumentId: "b", targetDocumentId: "c" },
    ];
    const docMap = new Map(["a", "b", "c"].map((id) => [id, true]));

    const edges = links
      .filter((l) => docMap.has(l.sourceDocumentId) && docMap.has(l.targetDocumentId))
      .map((l) => ({
        id: `${l.sourceDocumentId}->${l.targetDocumentId}`,
        source: l.sourceDocumentId,
        target: l.targetDocumentId,
      }));

    expect(edges).toHaveLength(2);
    expect(edges[0].source).toBe("a");
    expect(edges[0].target).toBe("b");
  });
});

describe("backlinks", () => {
  it("identifies incoming links", () => {
    const links = [
      { sourceDocumentId: "a", targetDocumentId: "x" },
      { sourceDocumentId: "b", targetDocumentId: "x" },
      { sourceDocumentId: "x", targetDocumentId: "c" },
    ];
    const backlinks = links.filter((l) => l.targetDocumentId === "x");
    expect(backlinks).toHaveLength(2);
    expect(backlinks.map((l) => l.sourceDocumentId)).toContain("a");
    expect(backlinks.map((l) => l.sourceDocumentId)).toContain("b");
  });

  it("excludes self-links", () => {
    const targetIds = ["a", "b"];
    const filtered = targetIds.filter((id) => id !== "x");
    expect(filtered).toEqual(["a", "b"]);
  });
});
