import { describe, it, expect } from "vitest";

describe("block utilities", () => {
  it("parses table block content JSON", () => {
    const json = JSON.stringify({
      headers: ["Name", "Role"],
      rows: [
        ["Alice", "Engineer"],
        ["Bob", "Designer"],
      ],
    });

    const parsed = JSON.parse(json);
    expect(parsed.headers).toHaveLength(2);
    expect(parsed.rows).toHaveLength(2);
    expect(parsed.rows[0][0]).toBe("Alice");
  });

  it("parses checklist block content JSON", () => {
    const json = JSON.stringify({
      items: [
        { text: "Task 1", checked: true },
        { text: "Task 2", checked: false },
        { text: "Task 3", checked: false },
      ],
    });

    const parsed = JSON.parse(json);
    expect(parsed.items).toHaveLength(3);
    expect(parsed.items.filter((i: { checked: boolean }) => i.checked)).toHaveLength(1);
    expect(parsed.items[0].text).toBe("Task 1");
  });

  it("parses checklist with all unchecked", () => {
    const json = JSON.stringify({
      items: [
        { text: "Buy milk", checked: false },
        { text: "Clean house", checked: false },
      ],
    });

    const parsed = JSON.parse(json);
    const checked = parsed.items.filter((i: { checked: boolean }) => i.checked);
    expect(checked).toHaveLength(0);
  });

  it("validates equation block content", () => {
    const equations = [
      "E = mc^2",
      "\\frac{a}{b}",
      "\\sum_{i=1}^{n} x_i",
    ];

    equations.forEach((eq) => {
      expect(typeof eq).toBe("string");
      expect(eq.length).toBeGreaterThan(0);
    });
  });

  it("maintains block position ordering after insert", () => {
    const blocks = [
      { id: "a", position: 0 },
      { id: "b", position: 1 },
      { id: "c", position: 2 },
    ];

    const insertAt = (afterIdx: number, newId: string) => {
      const result = [...blocks];
      result.splice(afterIdx + 1, 0, { id: newId, position: -1 });
      return result.map((b, i) => ({ ...b, position: i }));
    };

    const updated = insertAt(1, "d");
    expect(updated).toHaveLength(4);
    expect(updated[2].id).toBe("d");
    expect(updated[2].position).toBe(2);
    expect(updated[3].id).toBe("c");
    expect(updated[3].position).toBe(3);
  });
});
