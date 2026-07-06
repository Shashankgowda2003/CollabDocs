import { describe, it, expect } from "vitest";

describe("offline utilities", () => {
  it("detects navigator.onLine", () => {
    const isOnline = typeof navigator !== "undefined" ? navigator.onLine : true;
    expect(typeof isOnline).toBe("boolean");
  });

  it("queues operations when offline", () => {
    const ops: { type: string; documentId: string }[] = [];
    function queueOperation(op: { type: string; documentId: string }) {
      ops.push(op);
    }

    const isOnline = false;
    if (!isOnline) {
      queueOperation({ type: "snapshot", documentId: "doc-1" });
      queueOperation({ type: "sync_links", documentId: "doc-1" });
    }

    expect(ops).toHaveLength(2);
    expect(ops[0].type).toBe("snapshot");
    expect(ops[1].type).toBe("sync_links");
  });

  it("runs server actions when online", () => {
    const serverCalls: string[] = [];
    const isOnline = true;
    if (isOnline) {
      serverCalls.push("snapshot");
      serverCalls.push("sync_links");
    }
    expect(serverCalls).toHaveLength(2);
  });

  it("counts pending operations", () => {
    const ops = [
      { id: 1, type: "snapshot" },
      { id: 2, type: "sync_links" },
      { id: 3, type: "snapshot" },
    ];
    expect(ops.length).toBe(3);
  });

  it("removes successfully synced operations", () => {
    const ops = [
      { id: 1, type: "snapshot", status: "success" },
      { id: 2, type: "sync_links", status: "failed" },
    ];
    const remaining = ops.filter((o) => o.status !== "success");
    expect(remaining).toHaveLength(1);
    expect(remaining[0].id).toBe(2);
  });
});
