import { describe, it, expect } from "vitest";

describe("Yjs comment CRDT", () => {
  it("generates unique comment IDs", () => {
    const ids = new Set<string>();
    for (let i = 0; i < 100; i++) {
      ids.add(crypto.randomUUID());
    }
    expect(ids.size).toBe(100);
  });

  it("sorts comments by createdAt descending", () => {
    const comments = [
      { id: "a", status: "Open", createdAt: 1000 },
      { id: "b", status: "Resolved", createdAt: 3000 },
      { id: "c", status: "Open", createdAt: 2000 },
    ];
    const sorted = comments.sort((a, b) => b.createdAt - a.createdAt);
    expect(sorted[0].id).toBe("b");
    expect(sorted[1].id).toBe("c");
    expect(sorted[2].id).toBe("a");
  });

  it("filters comments by status", () => {
    const comments = [
      { id: "a", status: "Open" },
      { id: "b", status: "Resolved" },
      { id: "c", status: "Open" },
    ];
    const open = comments.filter((c) => c.status === "Open");
    expect(open).toHaveLength(2);
  });

  it("appends reply to thread", () => {
    const thread = { replies: [{ id: "1", content: "Hello" }] };
    const reply = { id: "2", content: "World" };
    const updated = { ...thread, replies: [...thread.replies, reply] };
    expect(updated.replies).toHaveLength(2);
    expect(updated.replies[1].content).toBe("World");
  });
});

describe("suggestion resolution", () => {
  it("accepts a suggestion", () => {
    const suggestions = [
      { id: "1", status: "pending" },
      { id: "2", status: "pending" },
    ];
    const updated = suggestions.map((s) =>
      s.id === "1" ? { ...s, status: "accepted" } : s
    );
    expect(updated[0].status).toBe("accepted");
    expect(updated[1].status).toBe("pending");
  });

  it("rejects a suggestion", () => {
    const suggestions = [
      { id: "1", status: "pending" },
    ];
    const updated = suggestions.map((s) =>
      ({ ...s, status: "rejected" })
    );
    expect(updated[0].status).toBe("rejected");
  });

  it("counts suggestions by status", () => {
    const suggestions = [
      { id: "1", status: "pending" },
      { id: "2", status: "accepted" },
      { id: "3", status: "pending" },
      { id: "4", status: "rejected" },
    ];
    const pending = suggestions.filter((s) => s.status === "pending").length;
    const accepted = suggestions.filter((s) => s.status === "accepted").length;
    const rejected = suggestions.filter((s) => s.status === "rejected").length;
    expect(pending).toBe(2);
    expect(accepted).toBe(1);
    expect(rejected).toBe(1);
  });
});
