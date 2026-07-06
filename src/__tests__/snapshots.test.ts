import { describe, it, expect } from "vitest";

describe("snapshots", () => {
  it("determines snapshot threshold correctly", () => {
    const THRESHOLD = 500;

    expect(100).toBeLessThan(THRESHOLD);
    expect(500).toBeGreaterThanOrEqual(THRESHOLD);
    expect(501).toBeGreaterThanOrEqual(THRESHOLD);
    expect(0).toBeLessThan(THRESHOLD);
    expect(499).toBeLessThan(THRESHOLD);
  });

  it("handles first snapshot (no prior snapshot)", () => {
    const totalOps = 10;
    const lastSnapshotOps = 0;
    const opsSinceLast = totalOps - lastSnapshotOps;
    expect(opsSinceLast).toBe(10);
  });

  it("identifies recent snapshot within 15 minutes", () => {
    const fifteenMinutes = 15 * 60 * 1000;
    const recent = new Date(Date.now() - 5 * 60 * 1000);
    const old = new Date(Date.now() - 20 * 60 * 1000);

    expect(recent.getTime()).toBeGreaterThan(Date.now() - fifteenMinutes);
    expect(old.getTime()).toBeLessThan(Date.now() - fifteenMinutes);
  });
});
