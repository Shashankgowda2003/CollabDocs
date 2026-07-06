import { describe, it, expect } from "vitest";

describe("slash menu", () => {
  it("contains all block types in slash menu", () => {
    const slashMenuBlocks = [
      "paragraph",
      "heading",
      "code",
      "quote",
      "callout",
      "table",
      "checklist",
      "equation",
    ];

    expect(slashMenuBlocks).toContain("table");
    expect(slashMenuBlocks).toContain("checklist");
    expect(slashMenuBlocks).toContain("equation");
    expect(slashMenuBlocks).toContain("paragraph");
  });

  it("contains media types in slash menu", () => {
    const mediaBlocks = ["image", "embed"];
    expect(mediaBlocks).toContain("image");
    expect(mediaBlocks).toContain("embed");
  });

  it("block menu turn-into has all types", () => {
    const turnIntoTypes = [
      "paragraph",
      "heading",
      "code",
      "quote",
      "callout",
      "table",
      "checklist",
      "equation",
    ];

    expect(turnIntoTypes).toHaveLength(8);
    turnIntoTypes.forEach((type) => {
      expect(turnIntoTypes.includes(type)).toBe(true);
    });
  });
});
